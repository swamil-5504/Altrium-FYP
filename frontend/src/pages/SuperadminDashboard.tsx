import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import axios from "@/api/axios";
import { extractErrorMessage } from "@/utils/errors";
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
  Trash2,
  BarChart3,
  Clock,
  CheckCircle,
  GraduationCap,
  Building2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Search,
  ChevronRight,
  Star,
  X,
  Layers,
  Activity,
  Mail,
} from "lucide-react";
import {
  PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

interface CredentialInfo {
  id: string;
  title: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  college_name: string | null;
  created_at: string;
}

const SuperadminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [credentials, setCredentials] = useState<CredentialInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "admins" | "students">("overview");
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [userRes, credRes] = await Promise.all([
        axios.get("/users"),
        axios.get("/degrees"),
      ]);
      setUsers(userRes.data);
      setCredentials(credRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      await fetchUsers(true);
    } catch (err: unknown) {
      console.error(err);
      toast.error(extractErrorMessage(err, "Approval failed. Check backend logs."), { id: toastId });
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
      await fetchUsers(true);
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

  const credPending = credentials.filter(c => c.status === 'PENDING').length;
  const credApproved = credentials.filter(c => c.status === 'APPROVED').length;
  const credRejected = credentials.filter(c => c.status === 'REJECTED').length;

  // Chart Data
  const roleData = [
    { name: 'Students', value: studentList.length, color: 'hsl(var(--accent))' },
    { name: 'Verified Admins', value: verifiedAdmins.length, color: '#10b981' },
    { name: 'Pending Admins', value: pendingAdmins.length, color: '#f59e0b' },
    { name: 'Superadmins', value: superadmins.length, color: 'hsl(var(--primary))' },
  ].filter(d => d.value > 0);

  const registrationsByDate = users.reduce((acc: Record<string, number>, user) => {
    const date = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const growthData = Object.entries(registrationsByDate)
    .map(([date, count]) => ({ date, count }))
    .slice(-10);

  const uniDist = users.reduce((acc: Record<string, number>, user) => {
    const name = user.college_name?.trim();
    if (name && !name.includes('@') && name.length > 2) {
      acc[name] = (acc[name] || 0) + 1;
    }
    return acc;
  }, {});

  const universityData = Object.entries(uniDist)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const uniqueUniversities = new Set(
    users
      .map((u) => u.college_name?.trim())
      .filter((name): name is string => !!name)
  ).size;

  const recentSignups = users.filter((u) => {
    const created = new Date(u.created_at);
    const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }).length;

  const totalCredentials = credApproved + credPending + credRejected;
  const approvedRatio = totalCredentials > 0 ? Math.round((credApproved / totalCredentials) * 100) : 0;
  const approvalStatusLabel = pendingAdmins.length > 0 ? "Action required" : "All systems nominal";

  // Filtered lists for search
  const filteredStudents = studentList.filter(s =>
    !searchQuery ||
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.college_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingAdmins = pendingAdmins.filter(a =>
    !searchQuery ||
    a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.college_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allVerifiedPersonnel = [...superadmins, ...verifiedAdmins].filter(a =>
    !searchQuery ||
    a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.college_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3, badge: null },
    {
      id: "admins" as const, label: "Administrators", icon: UserCog,
      badge: pendingAdmins.length > 0 ? pendingAdmins.length : null,
      badgeColor: "bg-amber-500"
    },
    {
      id: "students" as const, label: "Students", icon: GraduationCap,
      badge: studentList.length, badgeColor: "bg-accent"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-24">
        {/* Hero Header */}
        <div className="relative overflow-hidden border-b bg-card/50 backdrop-blur-sm">
          <div
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, hsl(var(--accent)) 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, hsl(var(--primary)) 0%, transparent 50%)`
            }}
          />
          <div className="container mx-auto px-4 max-w-6xl py-8">
            <ScrollReveal>
              <div className="flex flex-col gap-6">
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/20">
                      <Shield className="w-5 h-5 text-accent" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-accent/80 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/15 inline-flex items-center gap-2">
                        SUPERADMIN
                      </span>
                      <div className="text-xs text-muted-foreground">Elevated access to platform controls</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Platform Control Center</h1>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                      Manage administrator approvals, monitor platform health, and oversee all registered users from one responsive dashboard.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 min-w-0">
                  <div className="rounded-3xl border bg-card/90 p-6 shadow-sm min-w-0">
                    <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr] min-w-0">
                      <div className="space-y-5 min-w-0">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Platform snapshot</p>
                            <h2 className="text-2xl font-semibold tracking-tight">Operational control center</h2>
                          </div>
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${pendingAdmins.length > 0 ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600"}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${pendingAdmins.length > 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
                            {approvalStatusLabel}
                          </span>
                        </div>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                          Track latest signups, institution coverage, and credential flow without crowding the page.
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-border bg-background/80 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Universities onboarded</p>
                            <p className="text-2xl font-semibold tracking-tight">{uniqueUniversities}</p>
                            <p className="text-xs text-muted-foreground mt-2">Distinct institutions represented</p>
                          </div>
                          <div className="rounded-2xl border border-border bg-background/80 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Recent signups</p>
                            <p className="text-2xl font-semibold tracking-tight">{recentSignups}</p>
                            <p className="text-xs text-muted-foreground mt-2">In the last 7 days</p>
                          </div>
                          <div className="rounded-2xl border border-border bg-background/80 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Verification state</p>
                            <p className="text-2xl font-semibold tracking-tight">{approvalStatusLabel}</p>
                            <p className="text-xs text-muted-foreground mt-2">Pending admin approvals</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-3xl border border-border bg-background/90 p-5 min-w-0">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 rounded-xl bg-primary/10 border border-primary/15">
                            <TrendingUp className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Credential pipeline</p>
                            <h3 className="text-sm font-semibold">Platform issuance health</h3>
                          </div>
                        </div>
                        <div className="rounded-3xl bg-muted px-4 py-5">
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                            <span>Approved</span>
                            <span>{credApproved}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden bg-border">
                            <div
                              className="h-full rounded-full bg-accent transition-all duration-500"
                              style={{ width: `${approvedRatio}%` }}
                            />
                          </div>
                          <div className="mt-3 text-xs text-muted-foreground">
                            {credPending} pending · {credRejected} rejected credentials
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      onClick={() => { setActiveTab("admins"); setSearchQuery(""); }}
                      className="inline-flex min-w-[180px] items-center gap-2 px-4 py-2 rounded-2xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Review pending logins
                    </button>
                    <button
                      onClick={() => void fetchUsers(true)}
                      disabled={refreshing}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-accent/30 transition"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                      Refresh data
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl mt-8">
          {/* Priority Action Banner - only when pending admins exist */}
          {!loading && pendingAdmins.length > 0 && (
            <ScrollReveal>
              <div className="mb-6 flex items-center gap-4 p-4 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/8 to-orange-500/5 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {pendingAdmins.length} Administrator{pendingAdmins.length !== 1 ? "s" : ""} Awaiting Approval
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    These accounts cannot log in until you grant access.
                  </p>
                </div>
                <button
                  onClick={() => { setActiveTab("admins"); setSearchQuery(""); }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
                >
                  Review Now <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </ScrollReveal>
          )}

          {/* Tab Navigation */}
          <ScrollReveal>
            <div className="relative flex gap-1 mb-8 p-1.5 bg-muted/60 rounded-2xl border border-border/50 backdrop-blur-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                  className={`relative flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                    ? "bg-background shadow-md text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                    }`}
                >
                  <tab.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge !== null && tab.badge > 0 && (
                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${activeTab === tab.id ? (tab.badgeColor || "bg-accent") : "bg-muted-foreground/60"
                      }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </ScrollReveal>

          {/* ---- OVERVIEW TAB ---- */}
          {activeTab === "overview" && (
            <ScrollReveal delay={100}>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                  {
                    label: "Total Platform Users", value: users.length,
                    icon: Users, color: "accent",
                    sub: `${verifiedAdmins.length} admins · ${studentList.length} students`
                  },
                  {
                    label: "Pending Actions", value: pendingAdmins.length,
                    icon: Clock, color: "amber",
                    sub: pendingAdmins.length > 0 ? "Approvals required" : "All systems nominal",
                    urgent: pendingAdmins.length > 0
                  },
                  {
                    label: "Verified Assets", value: verifiedAdmins.length + superadmins.length,
                    icon: ShieldCheck, color: "green",
                    sub: `${credApproved} credentials issued`
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`relative p-6 rounded-3xl border bg-card overflow-hidden group hover:shadow-xl transition-all duration-300 ${stat.urgent ? "border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.06)]" : "hover:border-accent/20"
                      }`}
                  >
                    <div
                      className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5 group-hover:opacity-10 transition-opacity"
                      style={{
                        background: stat.color === "amber" ? "#f59e0b"
                          : stat.color === "green" ? "#10b981"
                            : "hsl(var(--accent))"
                      }}
                    />
                    <div className={`inline-flex p-3 rounded-2xl mb-4 ${stat.color === "amber" ? "bg-amber-500/10 text-amber-500"
                      : stat.color === "green" ? "bg-green-500/10 text-green-500"
                        : "bg-accent/10 text-accent"
                      }`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums">{stat.value}</div>
                    <div className="text-sm font-semibold mt-1 text-foreground/80">{stat.label}</div>
                    <div className="text-xs text-muted-foreground mt-2">{stat.sub}</div>
                  </div>
                ))}
              </div>



              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Pie Chart */}
                <div className="p-6 rounded-2xl border bg-card shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-accent/10 border border-accent/15">
                      <Layers className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">User Distribution</h4>
                      <p className="text-xs text-muted-foreground">Role breakdown across the platform</p>
                    </div>
                  </div>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roleData}
                          cx="50%" cy="50%"
                          stroke="none"
                          innerRadius={60} outerRadius={90}
                          paddingAngle={6}
                          dataKey="value"
                        >
                          {roleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity" />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="glass-card border px-3 py-2 rounded-xl shadow-xl text-sm">
                                  <p className="font-bold">{payload[0].name}</p>
                                  <p className="text-muted-foreground">{payload[0].value} users</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center">
                    {roleData.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        {d.name} ({d.value})
                      </div>
                    ))}
                  </div>
                </div>

                {/* Area Chart - Growth */}
                <div className="p-6 rounded-2xl border bg-card shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/15">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Registration Activity</h4>
                      <p className="text-xs text-muted-foreground">New user sign-ups over time</p>
                    </div>
                  </div>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={growthData}>
                        <defs>
                          <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" strokeOpacity={0.6} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={8} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="glass-card border px-3 py-2 rounded-xl shadow-xl text-sm">
                                  <p className="text-xs font-bold text-accent mb-0.5">{label}</p>
                                  <p className="font-semibold">{payload[0].value} sign-ups</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area type="monotone" dataKey="count" stroke="hsl(var(--accent))" strokeWidth={2.5} fillOpacity={1} fill="url(#growthGradient)" animationDuration={1500} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* University Bar Chart */}
              {universityData.length > 0 && (
                <div className="p-6 rounded-2xl border bg-card shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/15">
                      <Building2 className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">Top Universities by User Count</h4>
                      <p className="text-xs text-muted-foreground">Institutions with the most platform registrations</p>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={universityData} layout="vertical" margin={{ left: 20, right: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical stroke="hsl(var(--muted))" strokeOpacity={0.4} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={130} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--foreground))', fontWeight: 500 }} />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--accent))', fillOpacity: 0.04 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="glass-card border px-3 py-2 rounded-xl shadow-xl text-sm">
                                  <p className="text-xs text-muted-foreground mb-0.5">{payload[0].payload.name}</p>
                                  <p className="font-bold">{payload[0].value} users</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </ScrollReveal>
          )}

          {/* ---- ADMINS TAB ---- */}
          {activeTab === "admins" && (
            <>
              {/* Search */}
              <ScrollReveal>
                <div className="relative mb-6">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or university..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl border bg-card/80 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </ScrollReveal>

              {/* Pending Approvals */}
              <ScrollReveal delay={100}>
                <div className="rounded-2xl border border-amber-500/20 bg-card overflow-hidden mb-6 shadow-sm">
                  <div className="px-5 py-4 border-b border-amber-500/15 bg-gradient-to-r from-amber-500/6 to-transparent">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-amber-500/15">
                          <ShieldAlert className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">Pending Login Approvals</h3>
                          <p className="text-xs text-muted-foreground">Approve to grant university admin access</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {filteredPendingAdmins.length} pending
                      </span>
                    </div>
                  </div>

                  {loading ? (
                    <div className="py-12 flex items-center justify-center text-muted-foreground text-sm gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Loading...
                    </div>
                  ) : filteredPendingAdmins.length === 0 ? (
                    <div className="py-12 text-center">
                      <ShieldCheck className="w-8 h-8 text-green-500 mx-auto mb-3 opacity-70" />
                      <p className="text-sm font-medium text-muted-foreground">
                        {searchQuery ? "No results match your search." : "No pending approvals — you're all caught up!"}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {filteredPendingAdmins.map((admin) => (
                        <div key={admin.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/20 transition-colors group">
                          {/* Avatar */}
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center font-semibold text-amber-600 dark:text-amber-400 text-sm">
                            {admin.full_name ? admin.full_name[0].toUpperCase() : admin.email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-sm truncate">{admin.full_name || "—"}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide">Pending</span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                              <span>{admin.email}</span>
                              {admin.college_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{admin.college_name}</span>}
                            </div>
                            <div className="mt-1">
                              {admin.wallet_address ? (
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                  {admin.wallet_address.slice(0, 8)}...{admin.wallet_address.slice(-6)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-destructive/70">No wallet connected</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => void handleVerifyAdmin(admin.id)}
                              disabled={verifyingId === admin.id || deletingId !== null}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 shadow-sm"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              {verifyingId === admin.id ? "Approving..." : "Approve Login"}
                            </button>
                            <button
                              onClick={() => void handleDeleteUser(admin.id)}
                              disabled={deletingId === admin.id || verifyingId !== null}
                              title="Reject & Delete"
                              className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 border border-transparent hover:border-destructive/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* Verified Personnel */}
              <ScrollReveal delay={150}>
                <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
                  <div className="px-6 py-5 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/15">
                          <ShieldCheck className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">Verified Personnel</h3>
                          <p className="text-xs text-muted-foreground">System administrators with active credentials</p>
                        </div>
                      </div>
                      <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/15">
                        {allVerifiedPersonnel.length} active
                      </span>
                    </div>
                  </div>

                  {allVerifiedPersonnel.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">
                      {searchQuery ? "No results match your search." : "No verified personnel found."}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-x divide-border/50">
                      {allVerifiedPersonnel.map((admin) => (
                        <div key={admin.id} className="px-6 py-5 flex items-start gap-4 hover:bg-muted/10 transition-colors group">
                          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400/20 to-accent/20 border border-green-500/15 flex items-center justify-center font-bold text-green-600 dark:text-green-400 text-lg shadow-sm group-hover:scale-105 transition-transform">
                            {admin.full_name ? admin.full_name[0].toUpperCase() : admin.email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm text-foreground truncate">{admin.full_name || "—"}</span>
                              {admin.role === "SUPERADMIN" ? (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-black uppercase tracking-widest">Superadmin</span>
                              ) : (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-bold uppercase tracking-widest border border-green-500/15">Admin</span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3 opacity-70" />
                                <span className="truncate">{admin.email}</span>
                              </div>
                              {admin.college_name && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                  <Building2 className="w-3 h-3 opacity-70" />
                                  <span>{admin.college_name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 pt-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Joined {new Date(admin.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                          </div>
                          {admin.role !== "SUPERADMIN" && (
                            <button
                              onClick={() => void handleDeleteUser(admin.id)}
                              disabled={deletingId === admin.id}
                              title="Remove Admin"
                              className="flex-shrink-0 p-2 rounded-xl text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            </>
          )}

          {/* ---- STUDENTS TAB ---- */}
          {activeTab === "students" && (
            <ScrollReveal delay={100}>
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search students by name, email, or university..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border bg-card/80 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Summary */}
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-accent/10 border border-accent/15">
                  <GraduationCap className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <span className="font-semibold text-sm">
                    {searchQuery ? `${filteredStudents.length} of ${studentList.length}` : studentList.length} Students
                  </span>
                  <span className="text-muted-foreground text-xs ml-2">
                    across {Object.keys(filteredStudents.reduce((a, s) => { if (s.college_name) a[s.college_name] = 1; return a; }, {} as Record<string, number>)).length} universities
                  </span>
                </div>
              </div>

              {loading ? (
                <div className="py-16 flex items-center justify-center text-muted-foreground text-sm gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border bg-card">
                  <GraduationCap className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchQuery ? "No students match your search." : "No students registered yet."}
                  </p>
                </div>
              ) : (
                <>
                  {/* University-grouped cards */}
                  {!searchQuery ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(
                        filteredStudents.reduce((acc, student) => {
                          const college = student.college_name || "Unassigned";
                          if (!acc[college]) acc[college] = [];
                          acc[college].push(student);
                          return acc;
                        }, {} as Record<string, typeof studentList>)
                      ).sort(([, a], [, b]) => b.length - a.length).map(([college, students]) => (
                        <Dialog key={college}>
                          <DialogTrigger asChild>
                            <button className="text-left p-5 rounded-2xl border bg-card hover:border-accent/30 hover:shadow-md transition-all group cursor-pointer w-full">
                              <div className="flex items-start justify-between mb-4">
                                <div className="p-2.5 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors border border-accent/10">
                                  <Building2 className="w-5 h-5 text-accent" />
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                              </div>
                              <h3 className="font-semibold text-sm line-clamp-2 mb-2">{college}</h3>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold tracking-tight">{students.length}</span>
                                <span className="text-xs text-muted-foreground">{students.length === 1 ? 'student' : 'students'}</span>
                              </div>
                              {/* Mini progress pill */}
                              <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-accent/60 transition-all"
                                  style={{ width: `${(students.length / studentList.length) * 100}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-muted-foreground mt-1">
                                {((students.length / studentList.length) * 100).toFixed(1)}% of total
                              </div>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-accent" />
                                {college}
                                <span className="ml-1 text-sm font-normal text-muted-foreground">({students.length} students)</span>
                              </DialogTitle>
                            </DialogHeader>
                            <div className="overflow-y-auto flex-1 mt-2 -mx-6 px-6">
                              <div className="divide-y divide-border/50">
                                {students.map((stu) => (
                                  <div key={stu.id} className="py-3 flex items-center gap-3 group hover:bg-muted/10 rounded-lg px-2 -mx-2 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs flex-shrink-0">
                                      {stu.full_name ? stu.full_name[0].toUpperCase() : stu.email[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium truncate">{stu.full_name || "—"}</div>
                                      <div className="text-xs text-muted-foreground flex gap-2">
                                        <span>{stu.email}</span>
                                        {stu.prn_number && <span className="font-mono">PRN: {stu.prn_number}</span>}
                                      </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex-shrink-0">{new Date(stu.created_at).toLocaleDateString()}</div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); void handleDeleteUser(stu.id); }}
                                      disabled={deletingId === stu.id}
                                      className="flex-shrink-0 p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                                      title="Delete Student"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  ) : (
                    // Flat list when searching
                    <div className="rounded-2xl border bg-card overflow-hidden">
                      <div className="divide-y divide-border/50">
                        {filteredStudents.map((stu) => (
                          <div key={stu.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-muted/10 transition-colors group">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs flex-shrink-0">
                              {stu.full_name ? stu.full_name[0].toUpperCase() : stu.email[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{stu.full_name || "—"}</div>
                              <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0">
                                <span>{stu.email}</span>
                                {stu.college_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{stu.college_name}</span>}
                                {stu.prn_number && <span className="font-mono">PRN: {stu.prn_number}</span>}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground flex-shrink-0">{new Date(stu.created_at).toLocaleDateString()}</div>
                            <button
                              onClick={() => void handleDeleteUser(stu.id)}
                              disabled={deletingId === stu.id}
                              className="flex-shrink-0 p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperadminDashboard;
