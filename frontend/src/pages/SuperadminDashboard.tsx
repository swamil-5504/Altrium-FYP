import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import axios from "@/api/axios";
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Shield, ShieldAlert, ShieldCheck, UserCog, Users, Trash2, BarChart3, Clock, CheckCircle } from "lucide-react";

interface UserInfo {
  id: string;
  email: string;
  full_name: string | null;
  role: "SUPERADMIN" | "ADMIN" | "STUDENT" | "EMPLOYER";
  college_name: string | null;
  prn_number: string | null;
  is_legal_admin_verified: boolean;
  wallet_address: string | null;
  created_at: string;
}

const SuperadminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "admins" | "students">("overview");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/users");
      // The backend returns all users to the superadmin
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const handleVerifyAdmin = async (userId: string) => {
    setVerifyingId(userId);
    const toastId = toast.loading("Approving user login...");
    try {
      await axios.post(`/users/verify-admin/${userId}`);
      toast.success("User login approved successfully!", { id: toastId });
      await fetchUsers();
    } catch (err: unknown) {
      console.error(err);
      const detail =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(detail || "Approval failed. Check backend logs.", { id: toastId });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;

    setDeletingId(userId);
    const toastId = toast.loading("Deleting user from database...");
    try {
      await axios.delete(`/users/${userId}`);
      toast.success("User deleted successfully.", { id: toastId });
      await fetchUsers();
    } catch (err: unknown) {
      console.error(err);
      toast.error("Failed to delete user.", { id: toastId });
    } finally {
      setDeletingId(null);
    }
  };

  const pendingAdmins = users.filter((u) => u.role === "ADMIN" && !u.is_legal_admin_verified);
  const verifiedAdmins = users.filter((u) => u.role === "ADMIN" && u.is_legal_admin_verified);
  const studentList = users.filter((u) => u.role === "STUDENT");
  const superadmins = users.filter((u) => u.role === "SUPERADMIN");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollReveal>
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">Superadmin Control Panel</h1>
                <p className="text-muted-foreground">Manage platform users and verify university administrators.</p>
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-card text-foreground font-medium text-sm">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  Elevated Access
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "overview"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <BarChart3 className="w-4 h-4" />
              Overview Data
            </button>
            <button
              onClick={() => setActiveTab("admins")}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "admins"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <UserCog className="w-4 h-4" />
              Administrators
              {(pendingAdmins.length > 0 || verifiedAdmins.length > 0) && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-accent/10 text-accent">
                  {pendingAdmins.length + verifiedAdmins.length + superadmins.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "students"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Users className="w-4 h-4" />
              Students
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-muted border text-muted-foreground">
                {studentList.length}
              </span>
            </button>
          </div>

          {activeTab === "overview" && (
            <ScrollReveal delay={100}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                {/* Students Widget */}
                <div className="p-6 rounded-2xl border bg-card surface-elevated relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between z-10 relative">
                    <div className="p-3 bg-accent/10 text-accent rounded-xl">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="z-10 relative mt-4">
                    <h3 className="text-3xl font-bold tracking-tight">{studentList.length}</h3>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Total Registered Students</p>
                  </div>
                </div>

                {/* Pending Admins Widget */}
                <div className="p-6 rounded-2xl border bg-card surface-elevated relative overflow-hidden flex flex-col justify-between border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                  <div className="flex items-start justify-between z-10 relative">
                    <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                      <Clock className="w-6 h-6" />
                    </div>
                    {pendingAdmins.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600">Action Required</span>
                    )}
                  </div>
                  <div className="z-10 relative mt-4">
                    <h3 className="text-3xl font-bold tracking-tight">{pendingAdmins.length}</h3>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Pending Approvals</p>
                  </div>
                </div>

                {/* Verified Admins Widget */}
                <div className="p-6 rounded-2xl border bg-card surface-elevated relative overflow-hidden flex flex-col justify-between border-green-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <div className="flex items-start justify-between z-10 relative">
                    <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="z-10 relative mt-4">
                    <h3 className="text-3xl font-bold tracking-tight">{verifiedAdmins.length}</h3>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Verified University Admins</p>
                  </div>
                </div>

              </div>
            </ScrollReveal>
          )}

          {activeTab === "admins" && (
            <>
              {/* Pending Admins */}
              <ScrollReveal delay={100}>
                <div className="rounded-xl border border-amber-500/20 bg-card overflow-hidden mb-8">
                  <div className="p-4 border-b border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10">
                    <div className="flex flex-wrap items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold text-amber-600 dark:text-amber-500">Pending Verification</span>
                        <span className="tabular-nums px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold">
                          {pendingAdmins.length}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Requires approval to grant login access
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name & Email</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">University</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Wallet</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Loading administrators...</td></tr>
                        ) : pendingAdmins.length === 0 ? (
                          <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No pending admins awaiting verification.</td></tr>
                        ) : (
                          pendingAdmins.map((admin) => (
                            <tr key={admin.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-medium">{admin.full_name || "N/A"}</div>
                                <div className="text-xs text-muted-foreground">{admin.email}</div>
                              </td>
                              <td className="py-3 px-4">{admin.college_name || "N/A"}</td>
                              <td className="py-3 px-4">
                                {admin.wallet_address ? (
                                  <span className="font-mono text-xs p-1 rounded bg-muted">
                                    {admin.wallet_address.substring(0, 8)}...{admin.wallet_address.substring(38)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-destructive">Not connected</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                    onClick={() => handleVerifyAdmin(admin.id)}
                                    disabled={verifyingId === admin.id || deletingId !== null}
                                  >
                                    <Shield className="w-3 h-3" />
                                    {verifyingId === admin.id ? "Approving..." : "Approve Login"}
                                  </button>
                                  <button
                                    className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                    onClick={() => handleDeleteUser(admin.id)}
                                    disabled={deletingId === admin.id}
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ScrollReveal>

              {/* Verified Admins & Superadmins */}
              <ScrollReveal delay={150}>
                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-semibold text-foreground">Verified Personnel</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/20">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name & Email</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">University</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...superadmins, ...verifiedAdmins].length === 0 ? (
                          <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No verified admins found.</td></tr>
                        ) : (
                          [...superadmins, ...verifiedAdmins].map((admin) => (
                            <tr key={admin.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-medium">{admin.full_name || "N/A"}</div>
                                <div className="text-xs text-muted-foreground">{admin.email}</div>
                              </td>
                              <td className="py-3 px-4">
                                {admin.role === "SUPERADMIN" ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-accent">SUPERADMIN</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border">ADMIN</span>
                                )}
                              </td>
                              <td className="py-3 px-4">{admin.college_name || "N/A"}</td>
                              <td className="py-3 px-4">
                                <div className="text-xs text-muted-foreground">{new Date(admin.created_at).toLocaleDateString()}</div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {admin.role !== "SUPERADMIN" && (
                                  <button
                                    className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                    onClick={() => handleDeleteUser(admin.id)}
                                    disabled={deletingId === admin.id}
                                    title="Delete Admin"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ScrollReveal>
            </>
          )}

          {activeTab === "students" && (
            <ScrollReveal delay={100}>
              <div className="rounded-xl border bg-card overflow-hidden">
                <div className="p-4 border-b bg-muted/30">
                  <h3 className="font-semibold text-foreground">Registered Students</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name & Email</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">PRN</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">University</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Loading students...</td></tr>
                      ) : studentList.length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No students registered across the platform yet.</td></tr>
                      ) : (
                        studentList.map((stu) => (
                          <tr key={stu.id} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-medium">{stu.full_name || "N/A"}</div>
                              <div className="text-xs text-muted-foreground">{stu.email}</div>
                            </td>
                            <td className="py-3 px-4 text-xs font-mono">{stu.prn_number || "N/A"}</td>
                            <td className="py-3 px-4">{stu.college_name || "N/A"}</td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(stu.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                onClick={() => handleDeleteUser(stu.id)}
                                disabled={deletingId === stu.id}
                                title="Delete Student"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollReveal>
          )}

        </div>
      </div>
    </div>
  );
};

export default SuperadminDashboard;
