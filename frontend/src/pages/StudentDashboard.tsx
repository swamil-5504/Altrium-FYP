import React, { useEffect, useState } from "react";
import axios from "@/api/axios";
import { toast } from "sonner";
import { extractErrorMessage } from "@/utils/errors";
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Upload, CreditCard, Clock, Shield, XCircle, ArrowRight, Eye, User as UserIcon, Mail, Building2, FileText, MessageSquare, RefreshCcw } from "lucide-react";

type DegreeType = "BTECH" | "BSC" | "MTECH" | "MBA";

const DEGREE_TYPE_OPTIONS: { value: DegreeType; label: string }[] = [
  { value: "BTECH", label: "BTech" },
  { value: "BSC", label: "BSc" },
  { value: "MTECH", label: "MTech" },
  { value: "MBA", label: "MBA" },
];
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";


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
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  const approvedCount = submissions.filter((sub) => sub.status === "APPROVED").length;
  const rejectedCount = submissions.filter((sub) => sub.status === "REJECTED").length;
  const pendingCount = submissions.filter((sub) => sub.status === "PENDING").length;

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    prn_number: user?.prn_number || "",
    studentName: user?.full_name || "",
    entryYear: "",
    passingYear: "",
    cgpa: "",
    credits: "",
    degree_type: "" as DegreeType | "",
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
      toast.error(t("studentDashboard.toasts.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = async (credentialId: string) => {
    const loadingToast = toast.loading(t("studentDashboard.toasts.loadingDocument"));
    try {
      const response = await axios.get(`/degrees/${credentialId}/document`, {
        responseType: "blob",
      });
      toast.dismiss(loadingToast);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error(err);
      toast.error(t("studentDashboard.toasts.documentFailed"));
    }
  };

  const handleRelink = async () => {
    try {
      const response = await axios.get("/telegram/link-token");
      toast.success("New link generated! Please connect again.");
      await refreshUser();
      // Optionally open the link automatically
      window.open(response.data.link, "_blank");
    } catch (err) {
      toast.error("Failed to generate new link");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prn_number || !formData.degree_type) {
      toast.error(t("studentDashboard.toasts.requiredFields"));
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

      const titleLabel =
        DEGREE_TYPE_OPTIONS.find((o) => o.value === formData.degree_type)?.label
        ?? formData.degree_type;

      await axios.post("/degrees", {
        title: titleLabel,
        degree_type: formData.degree_type,
        description: formData.description || null,
        prn_number: formData.prn_number,
        college_name: formData.college_name,
        metadata_json: studentBasicsPayload,
      });

      toast.success(t("studentDashboard.toasts.submitSuccess"));
      setShowForm(false);
      setFormData({
        prn_number: "",
        studentName: "",
        entryYear: "",
        passingYear: "",
        cgpa: "",
        credits: "",
        degree_type: "",
        description: "",
        college_name: "",
      });

      await fetchSubmissions();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, t("studentDashboard.toasts.submitFailed")));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <ScrollReveal>
            <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-1">{t("studentDashboard.title")}</h1>
                  <p className="text-muted-foreground text-sm">{t("studentDashboard.subtitle")}</p>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2 px-3 rounded-lg bg-muted/40 border text-xs sm:text-sm w-fit">
                  <div className="flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-accent" />
                    <span className="font-semibold">{user?.full_name || t("studentDashboard.fallbackStudent")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{user?.college_name}</span>
                  </div>
                </div>

                {/* Telegram Connectivity Card */}
                <div className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition-all duration-300 ${user?.telegram_id
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-accent/5 border-accent/20 animate-pulse-slow"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user?.telegram_id ? "bg-green-500/10 text-green-500" : "bg-accent/10 text-accent"
                      }`}>
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold opacity-60">Telegram Status</p>
                      <p className="text-xs font-semibold">
                        {user?.telegram_id ? "Live Alerts Active" : "Not Connected"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user?.telegram_id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-green-600/70 font-medium px-2 py-0.5 bg-green-500/10 rounded-full">
                          Linked: {user.telegram_id}
                        </span>
                        <button
                          onClick={handleRelink}
                          className="text-[10px] text-muted-foreground hover:text-accent transition-colors font-bold uppercase tracking-tighter border-l pl-2 border-muted-foreground/20"
                        >
                          Relink
                        </button>
                      </div>
                    ) : (
                      <a
                        href={user?.telegram_bot_link || `https://t.me/Altrium_Notification_Bot?start=${user?.telegram_link_token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] bg-accent text-white px-3 py-1 rounded-lg font-bold hover:opacity-90 transition-opacity"
                      >
                        Link Now
                      </a>
                    )}
                    <button
                      onClick={() => {
                        void refreshUser();
                        toast.success("Syncing status...");
                      }}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                      title="Sync Status"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                <Upload className="w-4 h-4" />
                {t("studentDashboard.newSubmission")}
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={50}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-3xl border bg-card p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">{t("studentDashboard.pendingReview")}</p>
                <div className="text-3xl font-bold tabular-nums">{pendingCount}</div>
                <p className="text-sm text-muted-foreground mt-2">{t("studentDashboard.pendingReviewDesc")}</p>
              </div>
              <div className="rounded-3xl border bg-card p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">{t("studentDashboard.approved")}</p>
                <div className="text-3xl font-bold tabular-nums">{approvedCount}</div>
                <p className="text-sm text-muted-foreground mt-2">{t("studentDashboard.approvedDesc")}</p>
              </div>
              <div className="rounded-3xl border bg-card p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">{t("studentDashboard.rejected")}</p>
                <div className="text-3xl font-bold tabular-nums">{rejectedCount}</div>
                <p className="text-sm text-muted-foreground mt-2">{t("studentDashboard.rejectedDesc")}</p>
              </div>
            </div>
          </ScrollReveal>

          {showForm && (
            <ScrollReveal>
              <form onSubmit={handleSubmit} className="p-6 rounded-xl border bg-card mb-8 space-y-5">
                <h3 className="font-semibold text-lg">{t("studentDashboard.form.title")}</h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 opacity-70">{t("studentDashboard.form.prnNumber")}</label>
                    <input
                      type="text"
                      value={formData.prn_number}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-lg border bg-muted text-sm cursor-not-allowed outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("studentDashboard.form.studentName")}</label>
                    <input
                      type="text"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      placeholder={t("studentDashboard.form.studentNamePlaceholder")}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("studentDashboard.form.degreeTitle")}</label>
                    <select
                      value={formData.degree_type}
                      onChange={(e) =>
                        setFormData({ ...formData, degree_type: e.target.value as DegreeType | "" })
                      }
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="" disabled>Select degree type…</option>
                      {DEGREE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 opacity-70">{t("studentDashboard.form.university")}</label>
                    <input
                      type="text"
                      value={formData.college_name}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-lg border bg-muted text-sm cursor-not-allowed outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("studentDashboard.form.description")}</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t("studentDashboard.form.descriptionPlaceholder")}
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("studentDashboard.form.entryYear")}</label>
                    <input
                      type="text"
                      value={formData.entryYear}
                      onChange={(e) => setFormData({ ...formData, entryYear: e.target.value })}
                      placeholder={t("studentDashboard.form.entryYearPlaceholder")}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("studentDashboard.form.passingYear")}</label>
                    <input
                      type="text"
                      value={formData.passingYear}
                      onChange={(e) => setFormData({ ...formData, passingYear: e.target.value })}
                      placeholder={t("studentDashboard.form.passingYearPlaceholder")}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("studentDashboard.form.cgpa")}</label>
                    <input
                      type="text"
                      value={formData.cgpa}
                      onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                      placeholder={t("studentDashboard.form.cgpaPlaceholder")}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("studentDashboard.form.credits")}</label>
                    <input
                      type="text"
                      value={formData.credits}
                      onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                      placeholder={t("studentDashboard.form.creditsPlaceholder")}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <CreditCard className="w-4 h-4 text-accent shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Your university will mint your degree on-chain when they import the cohort PDFs. No PDF upload needed from you.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity active:scale-[0.98]"
                  >
                    {t("studentDashboard.form.submitAndPay")}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </form>
            </ScrollReveal>
          )}

          <ScrollReveal delay={100}>
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("studentDashboard.yourSubmissions")}</h3>

              {loading ? (
                <div className="text-center py-10 opacity-70">{t("studentDashboard.loadingSubmissions")}</div>
              ) : submissions.length === 0 ? (
                <div className="p-8 border rounded-xl bg-card text-center text-muted-foreground">
                  {t("studentDashboard.noSubmissions")}
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
                            {t("studentDashboard.prnLabel")} <span className="font-mono">{sub.prn_number ?? "-"}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t("studentDashboard.submittedOn", { date: new Date(sub.created_at).toLocaleDateString() })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">{t("studentDashboard.studentLabel", { name: studentName })}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        {sub.status === "PENDING" && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/30 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {t("studentDashboard.pendingReview")}
                          </span>
                        )}

                        {sub.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                            <Shield className="w-3 h-3" />
                            {t("studentDashboard.approved")}
                          </span>
                        )}

                        {sub.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            {t("studentDashboard.rejected")}
                          </span>
                        )}

                        {sub.status === "APPROVED" && sub.tx_hash && (
                          <span className="text-xs font-mono text-muted-foreground max-w-[180px] truncate" title={sub.tx_hash}>
                            {t("studentDashboard.txLabel")} {sub.tx_hash}
                          </span>
                        )}
                        {sub.status === "APPROVED" && sub.token_id !== null && sub.token_id !== undefined && (
                          <span className="text-xs font-mono text-muted-foreground">{t("studentDashboard.tokenLabel")} {sub.token_id}</span>
                        )}
                        {sub.status === "APPROVED" && sub.document_uid && (
                          <span className="text-xs font-mono text-muted-foreground">{t("studentDashboard.documentIdLabel")} {sub.document_uid}</span>
                        )}

                        {sub.has_document && sub.status === "APPROVED" ? (
                          <button
                            onClick={() => void handleViewDocument(sub.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors active:scale-[0.97]"
                          >
                            <Eye className="w-3 h-3" />
                            {t("studentDashboard.viewApprovedPdf")}
                          </button>
                        ) : sub.has_document ? (
                          <span className="text-xs text-muted-foreground">{t("studentDashboard.documentUploaded")}</span>
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
