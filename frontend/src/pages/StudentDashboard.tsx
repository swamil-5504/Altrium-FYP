import React, { useEffect, useState } from "react";
import axios from "@/api/axios";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Upload, FileText, CreditCard, Clock, Shield, XCircle, ArrowRight, Eye } from "lucide-react";
import { useAuth } from "@/context/AuthContext";


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
  document_uid?: string | null;
  has_document?: boolean;
  created_at: string;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    prn_number: user?.prn_number || "",
    studentName: user?.full_name || "",
    entryYear: "",
    passingYear: "",
    cgpa: "",
    credits: "",
    title: "",
    description: "",
    college_name: user?.college_name || "",
  });

  // Keep form data in sync with user if user profile loads late
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        prn_number: prev.prn_number || user.prn_number || "",
        studentName: prev.studentName || user.full_name || "",
        college_name: prev.college_name || user.college_name || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    void fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/degrees");
      setSubmissions(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your submissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (credentialId: string) => {
    try {
      const response = await axios.get(`/degrees/${credentialId}/document`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load document. It may not have been uploaded yet.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prn_number || !formData.title) {
      toast.error("PRN number and Degree Title are required.");
      return;
    }

    if (!file) {
      toast.error("Please select your degree PDF.");
      return;
    }

    try {
      const studentBasicsPayload = {
        studentName: formData.studentName,
        passingYear: formData.passingYear,
        entryYear: formData.entryYear,
        cgpa: formData.cgpa,
        credits: formData.credits,
      };

      // Step 1: Create the degree submission
      const response = await axios.post("/degrees", {
        title: formData.title,
        description: formData.description || null,
        prn_number: formData.prn_number,
        college_name: formData.college_name,
        metadata_json: studentBasicsPayload,
      });

      const credentialId = response.data.id;

      // Step 2: Upload the PDF document
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      await axios.post(`/degrees/${credentialId}/document`, formDataUpload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Submission & document uploaded. College Admin will verify and mint on Sepolia.");
      setShowForm(false);
      setFile(null);
      setFormData({
        prn_number: "",
        studentName: "",
        entryYear: "",
        passingYear: "",
        cgpa: "",
        credits: "",
        title: "",
        description: "",
        college_name: "",
      });

      await fetchSubmissions();
    } catch (err: unknown) {
      const detail =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(detail || "Failed to submit degree.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-8 flex-col sm:flex-row gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">Student Dashboard</h1>
                <p className="text-muted-foreground">Submit your degree for verification (Web2 upload + Web3 mint by Admin).</p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                <Upload className="w-4 h-4" />
                New Submission
              </button>
            </div>
          </ScrollReveal>

          {showForm && (
            <ScrollReveal>
              <form onSubmit={handleSubmit} className="p-6 rounded-xl border bg-card mb-8 space-y-5">
                <h3 className="font-semibold text-lg">Submit Degree for Verification</h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 opacity-70">PRN Number (From Profile)</label>
                    <input
                      type="text"
                      value={formData.prn_number}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-lg border bg-muted text-sm cursor-not-allowed outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Student Name</label>
                    <input
                      type="text"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      placeholder="As on your degree"
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Degree Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. B.Tech Computer Science"
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 opacity-70">University (From Profile)</label>
                    <input
                      type="text"
                      value={formData.college_name}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-lg border bg-muted text-sm cursor-not-allowed outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Description (optional)</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g. specialization, remarks"
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Entry Year</label>
                    <input
                      type="text"
                      value={formData.entryYear}
                      onChange={(e) => setFormData({ ...formData, entryYear: e.target.value })}
                      placeholder="e.g. 2021"
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Passing Year</label>
                    <input
                      type="text"
                      value={formData.passingYear}
                      onChange={(e) => setFormData({ ...formData, passingYear: e.target.value })}
                      placeholder="e.g. 2024"
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">CGPA</label>
                    <input
                      type="text"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      placeholder="e.g. 8.6"
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Credits</label>
                    <input
                      type="text"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                      placeholder="e.g. 160"
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Degree Document (PDF)</label>
                  <label className="flex items-center gap-3 px-4 py-6 rounded-lg border-2 border-dashed bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {file ? file.name : "Click to upload or drag your degree PDF here"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <CreditCard className="w-4 h-4 text-accent shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Payment (Razorpay/UPI) is not wired yet; submit will create a PENDING entry for College Admin to mint.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
                  >
                    Submit & Proceed to Pay
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </ScrollReveal>
          )}

          <ScrollReveal delay={100}>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Submissions</h3>

              {loading ? (
                <div className="text-center py-10 opacity-70">Loading submissions...</div>
              ) : submissions.length === 0 ? (
                <div className="p-8 border rounded-xl bg-card text-center text-muted-foreground">
                  You have no submissions yet.
                </div>
              ) : (
                submissions.map((sub) => {
                  const meta = (sub.metadata_json ?? {}) as Record<string, unknown>;
                  const studentName = typeof meta.studentName === "string" ? meta.studentName : "-";
                  return (
                    <div
                      key={sub.id}
                      className="p-5 rounded-xl border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-medium">{sub.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            PRN: <span className="font-mono">{sub.prn_number ?? "-"}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted {new Date(sub.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Student: {studentName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        {sub.status === "PENDING" && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/30 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}

                        {sub.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                            <Shield className="w-3 h-3" />
                            Approved
                          </span>
                        )}

                        {sub.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}

                        {sub.status === "APPROVED" && sub.tx_hash && (
                          <span className="text-xs font-mono text-muted-foreground max-w-[180px] truncate" title={sub.tx_hash}>
                            Tx: {sub.tx_hash}
                          </span>
                        )}
                        {sub.status === "APPROVED" && sub.token_id !== null && sub.token_id !== undefined && (
                          <span className="text-xs font-mono text-muted-foreground">Token: {sub.token_id}</span>
                        )}
                        {sub.status === "APPROVED" && sub.document_uid && (
                          <span className="text-xs font-mono text-muted-foreground">Document ID: {sub.document_uid}</span>
                        )}

                        {sub.has_document && sub.status === "APPROVED" ? (
                          <button
                            onClick={() => void handleViewDocument(sub.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors active:scale-[0.97]"
                          >
                            <Eye className="w-3 h-3" />
                            View Approved PDF
                          </button>
                        ) : sub.has_document ? (
                          <span className="text-xs text-muted-foreground">Document uploaded — awaiting approval.</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>

    </div>
  );
};

export default StudentDashboard;
