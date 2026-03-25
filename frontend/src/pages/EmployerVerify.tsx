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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) return;

    setSearched(true);
    setLoading(true);
    try {
      const response = await axios.get("/credentials/public", {
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
            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter PRN Number (e.g. PRN2024001)"
                required
                className="flex-1 px-4 py-3 rounded-lg border bg-card text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              />
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
                <div className="bg-success/5 border-b px-6 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-success">Verified on Blockchain</h3>
                    <p className="text-xs text-muted-foreground">Degree anchored for integrity (SBT minted by Admin).</p>
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
                <p className="text-sm text-muted-foreground">
                  No APPROVED degree was found for PRN{" "}
                  <span className="font-mono font-medium">{query.toUpperCase()}</span>. The admin may not have minted it yet.
                </p>
              </div>
            </ScrollReveal>
          )}

          {!searched && (
            <ScrollReveal delay={150}>
              <p className="text-center text-xs text-muted-foreground mt-4">
                Try{" "}
                <button
                  type="button"
                  onClick={() => setQuery("PRN2024001")}
                  className="font-mono text-accent hover:underline"
                >
                  PRN2024001
                </button>{" "}
                for a demo (if approved on backend).
              </p>
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
