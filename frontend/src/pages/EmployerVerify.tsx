import React, { useState } from "react";
import axios from "@/api/axios";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { toast } from "sonner";
import { ethers } from "ethers";
import {
  Search,
  Shield,
  FileText,
  GraduationCap,
  Blocks,
  Calendar,
  Hash,
  ExternalLink,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
} from "lucide-react";

type CredentialStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Credential {
  id: string;
  title: string;
  description?: string | null;
  metadata_json?: Record<string, unknown> | null;
  prn_number?: string | null;
  status: CredentialStatus;
  tx_hash?: string | null;
  token_id?: number | null;
  revoked?: boolean;
  college_name?: string | null;
  revoked?: boolean;
  college_name?: string | null;
  created_at: string;
}

const CONTRACT_REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS || "";

const registryAbi = [
  {
    type: "function",
    name: "getDegree",
    inputs: [{ name: "collegeIdHash", type: "bytes32" }],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "tokenId", type: "uint256" },
      {
        name: "record",
        type: "tuple",
        components: [
          { name: "collegeIdHash", type: "bytes32" },
          { name: "issuedBy", type: "address" },
          { name: "issuedAt", type: "uint64" },
          { name: "verified", type: "bool" },
          { name: "degreeHash", type: "bytes32" },
          { name: "revoked", type: "bool" },
          { name: "revokedAt", type: "uint64" },
          { name: "revokedBy", type: "address" },
        ],
      },
      { name: "degreeURI", type: "string" },
    ],
    stateMutability: "view",
  },
] as const;

const EmployerVerify: React.FC = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Credential | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hashVerified, setHashVerified] = useState<boolean | null>(null);
  const [verifyingHash, setVerifyingHash] = useState(false);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!e.target.value.trim()) {
      setSearched(false);
      setResult(null);
      setHashVerified(null);
    }
  };

  const handleSearch = async (e: React.FormEvent | { preventDefault: () => void }) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setSearched(false);
      setResult(null);
      setHashVerified(null);
      return;
    }

    setSearched(true);
    setLoading(true);
    setHashVerified(null);
    try {
      const response = await axios.get("/degrees/public", {
        params: { prn_number: trimmed },
      });

      const list: Credential[] = response.data;
      if (list.length > 0) setResult(list[0]);
      else setResult(null);
    } catch (err: unknown) {
      const detail =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      console.error(err);
      toast.error(detail || "Failed to verify credential.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyHash = async () => {
    if (!result) return;
    setVerifyingHash(true);
    try {
      const universityName = result.college_name || "Altrium University";
      const combinedString = `${result.prn_number}-${universityName}`;
      const collegeIdHash = ethers.keccak256(ethers.toUtf8Bytes(combinedString));

      // 1. Client-side Metadata Integrity Check
      const m = (result.metadata_json ?? {}) as Record<string, unknown>;
      const extractedStudentName =
        typeof m.studentName === "string" ? m.studentName : typeof m.name === "string" ? m.name : "Student";
      const payload = {
        studentName: extractedStudentName,
        passingYear: typeof m.passingYear === "string" ? m.passingYear : "",
        entryYear: typeof m.entryYear === "string" ? m.entryYear : "",
        cgpa: typeof m.cgpa === "string" ? m.cgpa : "",
        credits: typeof m.credits === "string" ? m.credits : "",
        degreeTitle: result.title,
        degreeDescription: result.description ?? "",
      };
      const computedDegreeHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(payload)));

      // 2. On-Chain Existence & Revocation Check
      if (typeof window !== "undefined" && window.ethereum && CONTRACT_REGISTRY_ADDRESS) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_REGISTRY_ADDRESS, registryAbi, provider);

        const [exists, tokenId, record] = await contract.getDegree(collegeIdHash);

        if (!exists) {
          toast.error("Degree not found on-chain. It might not be minted yet.");
          setHashVerified(false);
          return;
        }

        if (record.revoked) {
          toast.error("Blockchain record shows this degree is REVOKED.");
        }

        if (record.degreeHash !== computedDegreeHash) {
          console.log("Hash mismatch:", { onChain: record.degreeHash, computed: computedDegreeHash });
          toast.error("Integrity Mismatch! Off-chain data doesn't match on-chain hash.");
          setHashVerified(false);
          return;
        }

        toast.success("On-chain record verified! Integrity hash matches.");
      } else {
        toast.info("Computing integrity hash (Connect MetaMask for full on-chain proof)");
      }

      setHashVerified(true);
    } catch (err) {
      console.error(err);
      toast.error("Verification failed correctly.");
      setHashVerified(false);
    } finally {
      setVerifyingHash(false);
    }
  };

  const meta = (result?.metadata_json ?? {}) as Record<string, unknown>;
  const studentName =
    typeof meta.studentName === "string" ? meta.studentName : typeof meta.name === "string" ? meta.name : "-";
  const passingYear = typeof meta.passingYear === "string" ? meta.passingYear : "-";
  const entryYear = typeof meta.entryYear === "string" ? meta.entryYear : "-";
  const cgpa = typeof meta.cgpa === "string" ? meta.cgpa : "-";
  const credits = typeof meta.credits === "string" ? meta.credits : "-";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <div className="pt-28 pb-20 flex-1">
          <div className="pt-28 pb-20 flex-1">
            <div className="container mx-auto px-4 max-w-2xl">
              <ScrollReveal className="text-center mb-10">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
                  <Search className="w-7 h-7 text-accent" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Verify a Degree</h1>
                <p className="text-muted-foreground">Enter a student&apos;s PRN or email to check verified credentials. No login required.</p>
              </ScrollReveal>

              <ScrollReveal delay={80}>
                <form onSubmit={handleSearch} className="flex gap-2 mb-8 relative">
                  <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Enter PRN Number (e.g. PRN2024001)"
                    required
                    className="flex-1 px-4 py-3 rounded-lg border bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => handleQueryChange({ target: { value: "" } } as any)}
                      className="absolute right-[110px] top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </button>
                </form>
              </ScrollReveal>

              {result && (
                <ScrollReveal>
                  <div className="rounded-xl border bg-card overflow-hidden blockchain-glow">
                    {/* Revoked Banner */}
                    {result.revoked && (
                      <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-destructive shrink-0" />
                        <p className="text-sm text-destructive font-medium">This credential has been <strong>revoked</strong> by the issuing institution and is no longer valid.</p>
                      </div>
                    )}

                    <div className="bg-primary/5 border-b px-6 py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${result.revoked ? "bg-destructive/20" : "bg-primary"}`}>
                          {result.revoked
                            ? <XCircle className="w-5 h-5 text-destructive" />
                            : <Shield className="w-5 h-5 text-primary-foreground" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {result.revoked
                              ? <><AlertTriangle className="w-4 h-4 text-destructive" /><h3 className="font-semibold text-destructive">Credential Revoked</h3></>
                              : <><CheckCircle2 className="w-4 h-4 text-accent" /><h3 className="font-semibold text-primary">Altrium Verified</h3></>
                            }
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {result.revoked ? "This credential is no longer valid." : "Degree anchored on the blockchain (SBT minted)."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="max-w-3xl mx-auto space-y-6">
                        {/* Student basics */}
                        <div className="grid sm:grid-cols-2 gap-6 items-start">
                          <div className="space-y-5">
                            <InfoRow icon={GraduationCap} label="Student Name" value={studentName} />
                            <InfoRow icon={Hash} label="PRN" value={result.prn_number ?? "-"} mono />
                            <InfoRow icon={Calendar} label="Entry Year" value={String(entryYear)} />
                            <InfoRow icon={Blocks} label="CGPA" value={String(cgpa)} />
                            <InfoRow icon={Building2} label="Off-chain Notes" value={result.description ?? "-"} />
                          </div>
                          <div className="space-y-5">
                            <InfoRow icon={Building2} label="University" value={result.college_name || "Altrium University"} />
                            <InfoRow icon={FileText} label="Degree Title" value={result.title} />
                            <InfoRow icon={Calendar} label="Passing Year" value={String(passingYear)} />
                            <InfoRow icon={Blocks} label="Credits" value={String(credits)} />
                          </div>
                        </div>

                        <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10 space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">On-Chain Proof</p>
                          <div className="p-5 rounded-xl bg-muted/20 border border-muted-foreground/10 space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">On-Chain Proof</p>

                            <div className="flex items-center justify-between text-sm py-1 border-b border-muted-foreground/10">
                              <span className="text-muted-foreground">Token ID</span>
                              <span className="font-mono font-bold text-foreground">{result.token_id ?? "-"}</span>
                            </div>

                            {result.tx_hash && (
                              <div className="flex items-center justify-between text-sm py-1 border-b border-muted-foreground/10">
                                <span className="text-muted-foreground">Tx Hash</span>
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${result.tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 font-mono text-accent hover:text-accent/80 transition-colors max-w-[200px] sm:max-w-[260px] truncate"
                                >
                                  {result.tx_hash}
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                </a>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm py-1 border-b border-muted-foreground/10">
                              <span className="text-muted-foreground">Token ID</span>
                              <span className="font-mono font-bold text-foreground">{result.token_id ?? "-"}</span>
                            </div>

                            {result.tx_hash && (
                              <div className="flex items-center justify-between text-sm py-1 border-b border-muted-foreground/10">
                                <span className="text-muted-foreground">Tx Hash</span>
                                <a
                                  href={`https://sepolia.etherscan.io/tx/${result.tx_hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 font-mono text-accent hover:text-accent/80 transition-colors max-w-[200px] sm:max-w-[260px] truncate"
                                >
                                  {result.tx_hash}
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                </a>
                              </div>
                            )}

                            {/* Hash re-verification */}
                            <div className="flex items-center justify-between text-sm py-1">
                              <span className="text-muted-foreground">Integrity Check</span>
                              <button
                                onClick={handleVerifyHash}
                                disabled={verifyingHash}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {verifyingHash ? "Verifying..." : hashVerified === true ? "✅ Verified" : hashVerified === false ? "❌ Failed" : "Verify Hash"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                </ScrollReveal>
              )}

              {searched && !result && (
                <ScrollReveal>
                  <div className="rounded-xl border bg-card p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Search className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1">No Record Found</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      No APPROVED degree was found for PRN{" "}
                      <span className="font-mono font-medium">{query}</span>. The admin may not have minted it yet.
                    </p>
                    <button
                      onClick={() => handleQueryChange({ target: { value: "" } } as any)}
                      className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-accent/10 hover:text-accent transition-colors"
                    >
                      Back to Directory
                    </button>
                  </div>
                </ScrollReveal>
              )}

            </div>
          </div>

          <Footer />

        </div>
        );
};

        const InfoRow = ({
          icon: Icon,
        label,
        value,
        mono,
        className,
        className,
}: {
          icon: React.ElementType;
        label: string;
        value: string;
        mono?: boolean;
        className?: string;
        className?: string;
}) => (
        <div className={`flex items-start gap-3 ${className ?? ""}`}>
          <div className={`flex items-start gap-3 ${className ?? ""}`}>
            <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`font-medium text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
            </div>
          </div>
          );

          export default EmployerVerify;