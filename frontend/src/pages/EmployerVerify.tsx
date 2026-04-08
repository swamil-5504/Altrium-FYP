import React, { useState } from "react";
import axios from "@/api/axios";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollReveal } from "@/components/ScrollReveal";
import { toast } from "sonner";
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
  ArrowRight,
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
  created_at: string;
}

const EmployerVerify: React.FC = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Credential | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allDegrees, setAllDegrees] = useState<Credential[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);

  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await axios.get("/degrees/public");
        setAllDegrees(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAll(false);
      }
    };
    void fetchAll();
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (!e.target.value.trim()) {
      setSearched(false);
      setResult(null);
    }
  };

  const handleSearch = async (e: React.FormEvent | { preventDefault: () => void }) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setSearched(false);
      setResult(null);
      return;
    }

    setSearched(true);
    setLoading(true);
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

  const meta = (result?.metadata_json ?? {}) as Record<string, unknown>;
  const studentName =
    typeof meta.studentName === "string" ? meta.studentName : typeof meta.name === "string" ? meta.name : "-";
  const passingYear = typeof meta.passingYear === "string" ? meta.passingYear : "-";
  const entryYear = typeof meta.entryYear === "string" ? meta.entryYear : "-";
  const cgpa = typeof meta.cgpa === "string" ? meta.cgpa : "-";
  const credits = typeof meta.credits === "string" ? meta.credits : "-";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-2xl">
          <ScrollReveal className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <Search className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Verify a Degree</h1>
            <p className="text-muted-foreground">Enter a student&apos;s PRN to check verified credentials. No login required.</p>
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
                <div className="bg-primary/5 border-b px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Shield className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <h3 className="font-semibold text-primary">Altrium Verified</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Degree anchored on the blockchain (SBT minted).</p>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Student basics (degreeHash anchors this payload) */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <InfoRow icon={GraduationCap} label="Student Name" value={studentName} />
                    <InfoRow icon={Hash} label="PRN" value={result.prn_number ?? "-"} mono />
                    <InfoRow icon={FileText} label="Degree Title" value={result.title} />
                    <InfoRow icon={Calendar} label="Entry Year" value={String(entryYear)} />
                    <InfoRow icon={Calendar} label="Passing Year" value={String(passingYear)} />
                    <InfoRow icon={Blocks} label="CGPA" value={String(cgpa)} />
                    <InfoRow icon={Blocks} label="Credits" value={String(credits)} />
                    <InfoRow icon={Building2} label="Off-chain Notes" value={result.description ?? "-"} />
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30 border space-y-2.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">On-Chain Proof</p>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Token ID</span>
                      <span className="font-mono font-medium">{result.token_id ?? "-"}</span>
                    </div>

                    {result.tx_hash && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Tx Hash</span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${result.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-mono text-accent hover:underline max-w-[180px] truncate"
                        >
                          {result.tx_hash}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}
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

          {!searched && (
            <ScrollReveal delay={150}>
              <div className="mt-12 text-left">
                <h3 className="text-xl font-bold mb-4 text-center md:text-left">Verified Degrees Directory</h3>
                {loadingAll ? (
                  <p className="text-sm text-center text-muted-foreground p-8">Loading directory...</p>
                ) : allDegrees.length === 0 ? (
                  <p className="text-sm text-center text-muted-foreground p-8">No degrees have been fully verified on the blockchain yet.</p>
                ) : (
                  <div className="grid gap-3">
                    {allDegrees.map((deg) => {
                      const dMeta = (deg.metadata_json ?? {}) as Record<string, unknown>;
                      const studentName = typeof dMeta.studentName === "string" ? dMeta.studentName : typeof dMeta.name === "string" ? dMeta.name : "Unknown Student";
                      return (
                        <div
                          key={deg.id}
                          className="p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors flex items-center justify-between group cursor-pointer"
                          onClick={() => {
                            setQuery(deg.prn_number || "");
                            setSearched(true);
                            setResult(deg);
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                              <Shield className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{studentName}</div>
                              <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{deg.prn_number}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="truncate max-w-[200px] sm:max-w-none">{deg.title}</span>
                                <span className="hidden sm:inline">•</span>
                                <span>SBT: <span className="font-mono font-medium text-foreground">{deg.token_id ?? "Pending"}</span></span>
                              </div>
                            </div>
                          </div>
                          <div className="text-accent opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex items-start gap-3">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  </div>
);

export default EmployerVerify;
