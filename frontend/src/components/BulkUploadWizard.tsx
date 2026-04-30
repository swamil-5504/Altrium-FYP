import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import axios from "@/api/axios";
import {
  Upload,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

type DegreeType = "BTECH" | "BSC" | "MTECH" | "MBA";

const DEGREE_OPTIONS: { value: DegreeType; label: string }[] = [
  { value: "BTECH", label: "BTech" },
  { value: "BSC", label: "BSc" },
  { value: "MTECH", label: "MTech" },
  { value: "MBA", label: "MBA" },
];

interface RequestedRow {
  credential_id: string;
  prn_number: string | null;
  student_name: string | null;
  student_email: string | null;
  description: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
}

interface MatchedRow {
  credential_id: string;
  prn_number: string;
  student_name: string | null;
  pdf_filename: string;
  selected: boolean;
}

interface MatchResponse {
  batch_id: string;
  degree_type: DegreeType;
  matched_rows: MatchedRow[];
  unmatched_request_prns: string[];
  orphan_pdf_filenames: string[];
  created_at: string;
}

interface CommitResultRow {
  credential_id: string;
  prn_number: string;
  status: string;
  error: string | null;
}

interface CommitResponse {
  batch_id: string;
  committed_count: number;
  skipped_count: number;
  failed_count: number;
  rows: CommitResultRow[];
}

type Step = "select-type" | "review-live" | "review-match" | "result";

interface Props {
  /** Called after a successful commit so the parent can refetch the pending queue. */
  onCommitted?: () => void;
}

const BulkUploadWizard: React.FC<Props> = ({ onCommitted }) => {
  const [step, setStep] = useState<Step>("select-type");
  const [degreeType, setDegreeType] = useState<DegreeType | null>(null);

  const [requestedRows, setRequestedRows] = useState<RequestedRow[]>([]);
  const [loadingRequested, setLoadingRequested] = useState(false);

  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);

  const [deselected, setDeselected] = useState<Set<string>>(new Set());
  const [committing, setCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<CommitResponse | null>(null);

  // Fetch live REQUESTED rows whenever a degree type is picked.
  useEffect(() => {
    if (!degreeType || step !== "review-live") return;
    void fetchRequested(degreeType);
  }, [degreeType, step]);

  const fetchRequested = async (dt: DegreeType) => {
    setLoadingRequested(true);
    try {
      const res = await axios.get<RequestedRow[]>("/degrees/bulk/requests", {
        params: { degree_type: dt },
      });
      setRequestedRows(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load requested credentials.");
    } finally {
      setLoadingRequested(false);
    }
  };

  const resetWizard = () => {
    setStep("select-type");
    setDegreeType(null);
    setRequestedRows([]);
    setPdfFiles([]);
    setMatchResult(null);
    setDeselected(new Set());
    setCommitResult(null);
  };

  const handleSelectType = (dt: DegreeType) => {
    setDegreeType(dt);
    setStep("review-live");
  };

  const handleFilesPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    const arr = Array.from(list).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    setPdfFiles(arr);
  };

  const handleMatch = async () => {
    if (!degreeType || pdfFiles.length === 0) return;
    setMatching(true);
    try {
      const fd = new FormData();
      fd.append("degree_type", degreeType);
      pdfFiles.forEach((f) => fd.append("files", f));
      const res = await axios.post<MatchResponse>("/degrees/bulk/match", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMatchResult(res.data);
      setDeselected(new Set());
      setStep("review-match");
    } catch (err) {
      console.error(err);
      toast.error("PDF match failed.");
    } finally {
      setMatching(false);
    }
  };

  const toggleSelected = (credentialId: string) => {
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(credentialId)) next.delete(credentialId);
      else next.add(credentialId);
      return next;
    });
  };

  const handleCommit = async () => {
    if (!matchResult) return;
    setCommitting(true);
    try {
      const res = await axios.post<CommitResponse>(
        `/degrees/bulk/${matchResult.batch_id}/commit`,
        { deselected_credential_ids: Array.from(deselected) },
      );
      setCommitResult(res.data);
      setStep("result");
      toast.success(`Committed ${res.data.committed_count} row(s) to pending queue.`);
      onCommitted?.();
    } catch (err) {
      console.error(err);
      toast.error("Commit failed.");
    } finally {
      setCommitting(false);
    }
  };

  const matchedSelectedCount = useMemo(() => {
    if (!matchResult) return 0;
    return matchResult.matched_rows.filter((r) => !deselected.has(r.credential_id)).length;
  }, [matchResult, deselected]);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Bulk Mint Wizard</div>
          <div className="text-base font-semibold">
            {step === "select-type" && "Step 1 — Pick degree type"}
            {step === "review-live" && `Step 2 — Live requests (${degreeType})`}
            {step === "review-match" && "Step 3 — Review PRN matches"}
            {step === "result" && "Step 4 — Done"}
          </div>
        </div>
        {step !== "select-type" && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border hover:bg-muted transition"
            onClick={resetWizard}
          >
            <RotateCcw className="w-3 h-3" />
            Restart
          </button>
        )}
      </div>

      <div className="p-5">
        {step === "select-type" && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Pick the degree type you're issuing in this batch. The wizard will load all
              outstanding student requests of that type from your college and let you import
              the matching PDF cohort.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DEGREE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectType(opt.value)}
                  className="group p-5 rounded-xl border bg-background hover:border-accent hover:bg-accent/5 transition text-left"
                >
                  <GraduationCap className="w-5 h-5 text-accent mb-2" />
                  <div className="text-base font-semibold">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-1 group-hover:text-accent">
                    Use this template <ArrowRight className="inline w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "review-live" && degreeType && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {loadingRequested
                ? "Loading live requests..."
                : `${requestedRows.length} student${requestedRows.length === 1 ? "" : "s"} requested a ${degreeType} degree.`}{" "}
              Pick the folder of signed PDFs (named <code className="px-1 py-0.5 rounded bg-muted text-xs">{"{PRN}.pdf"}</code>)
              and click Match.
            </p>

            <div className="rounded-lg border bg-background overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">PRN</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRequested ? (
                    <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Loading…</td></tr>
                  ) : requestedRows.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No outstanding requests for this degree type.</td></tr>
                  ) : (
                    requestedRows.map((r) => (
                      <tr key={r.credential_id} className="border-b last:border-0">
                        <td className="py-2 px-3">{r.student_name ?? "—"}</td>
                        <td className="py-2 px-3 font-mono text-xs">{r.prn_number ?? "—"}</td>
                        <td className="py-2 px-3 text-muted-foreground">{r.student_email ?? "—"}</td>
                        <td className="py-2 px-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-muted cursor-pointer text-sm font-medium">
                <Upload className="w-4 h-4" />
                Pick PDF folder / files
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={handleFilesPicked}
                />
              </label>
              <span className="text-xs text-muted-foreground">
                {pdfFiles.length === 0 ? "No PDFs picked yet." : `${pdfFiles.length} PDF(s) ready.`}
              </span>
              <div className="sm:ml-auto" />
              <button
                type="button"
                onClick={() => void handleMatch()}
                disabled={pdfFiles.length === 0 || matching || requestedRows.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {matching ? "Matching…" : "Match by PRN"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === "review-match" && matchResult && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="rounded-lg border p-3 bg-emerald-500/5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Matched</div>
                <div className="text-2xl font-bold tabular-nums">{matchResult.matched_rows.length}</div>
              </div>
              <div className="rounded-lg border p-3 bg-amber-500/5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Requests w/o PDF</div>
                <div className="text-2xl font-bold tabular-nums">{matchResult.unmatched_request_prns.length}</div>
              </div>
              <div className="rounded-lg border p-3 bg-rose-500/5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Orphan PDFs</div>
                <div className="text-2xl font-bold tabular-nums">{matchResult.orphan_pdf_filenames.length}</div>
              </div>
            </div>

            <div className="rounded-lg border bg-background overflow-hidden mb-4">
              <div className="px-3 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
                Matched rows — untick any that look wrong; unticked rows stay REQUESTED for next batch.
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="w-10 py-2 px-3"></th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">PRN</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {matchResult.matched_rows.length === 0 ? (
                    <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No matches.</td></tr>
                  ) : (
                    matchResult.matched_rows.map((r) => {
                      const isUnticked = deselected.has(r.credential_id);
                      return (
                        <tr key={r.credential_id} className={`border-b last:border-0 ${isUnticked ? "opacity-50" : ""}`}>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={!isUnticked}
                              onChange={() => toggleSelected(r.credential_id)}
                            />
                          </td>
                          <td className="py-2 px-3 font-mono text-xs">{r.prn_number}</td>
                          <td className="py-2 px-3">{r.student_name ?? "—"}</td>
                          <td className="py-2 px-3 text-muted-foreground inline-flex items-center gap-1.5"><FileText className="w-3 h-3" />{r.pdf_filename}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {(matchResult.unmatched_request_prns.length > 0 || matchResult.orphan_pdf_filenames.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {matchResult.unmatched_request_prns.length > 0 && (
                  <div className="rounded-lg border p-3 bg-amber-500/5">
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-600 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Requests without a PDF
                    </div>
                    <ul className="text-xs font-mono space-y-1">
                      {matchResult.unmatched_request_prns.map((prn) => <li key={prn}>{prn}</li>)}
                    </ul>
                  </div>
                )}
                {matchResult.orphan_pdf_filenames.length > 0 && (
                  <div className="rounded-lg border p-3 bg-rose-500/5">
                    <div className="flex items-center gap-2 text-sm font-medium text-rose-600 mb-2">
                      <AlertTriangle className="w-4 h-4" /> PDFs without a request
                    </div>
                    <ul className="text-xs font-mono space-y-1">
                      {matchResult.orphan_pdf_filenames.map((fn, i) => <li key={`${fn}-${i}`}>{fn}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleCommit()}
                disabled={committing || matchedSelectedCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {committing ? "Committing…" : `Commit ${matchedSelectedCount} row(s) → Pending`}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === "result" && commitResult && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="rounded-lg border p-4 bg-emerald-500/5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Committed</div>
                <div className="text-3xl font-bold tabular-nums">{commitResult.committed_count}</div>
              </div>
              <div className="rounded-lg border p-4 bg-muted">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Skipped</div>
                <div className="text-3xl font-bold tabular-nums">{commitResult.skipped_count}</div>
              </div>
              <div className="rounded-lg border p-4 bg-rose-500/5">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Failed</div>
                <div className="text-3xl font-bold tabular-nums">{commitResult.failed_count}</div>
              </div>
            </div>

            <div className="rounded-lg border bg-background overflow-hidden mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">PRN</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Outcome</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {commitResult.rows.map((r) => (
                    <tr key={r.credential_id} className="border-b last:border-0">
                      <td className="py-2 px-3 font-mono text-xs">{r.prn_number}</td>
                      <td className="py-2 px-3">{r.status}</td>
                      <td className="py-2 px-3 text-muted-foreground">{r.error ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              Committed rows are now in your <strong>pending</strong> queue. Switch to the
              Degree Submissions tab and use the existing Mint SBT button to push each one
              on-chain.
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetWizard}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted"
              >
                <RotateCcw className="w-4 h-4" />
                Run another batch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadWizard;
