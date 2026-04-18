import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import axios from "@/api/axios";
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Shield, ShieldAlert, ShieldCheck, UserCog, Users, Trash2, BarChart3, Clock, CheckCircle, GraduationCap, Building2, TrendingUp } from "lucide-react";
import {
  PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [userRes, credRes] = await Promise.all([
        axios.get("/users"),
        axios.get("/degrees") // Superadmin can fetch all
      ]);
      setUsers(userRes.data);
      setCredentials(credRes.data);
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

  // Chart Data Processing
  const roleData = [
    { name: 'Students', value: studentList.length, color: 'hsl(var(--accent))' },
    { name: 'Admins', value: verifiedAdmins.length + pendingAdmins.length, color: 'hsl(var(--primary))' },
    { name: 'Superadmins', value: superadmins.length, color: 'hsl(var(--muted-foreground))' },
  ];

  const statusData = [
    { name: 'Pending', value: credentials.filter(c => c.status === 'PENDING').length, color: '#f59e0b' },
    { name: 'Approved', value: credentials.filter(c => c.status === 'APPROVED').length, color: '#10b981' },
    { name: 'Rejected', value: credentials.filter(c => c.status === 'REJECTED').length, color: '#ef4444' },
  ];

  // Group registrations by date
  const registrationsByDate = users.reduce((acc: any, user) => {
    const date = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const growthData = Object.entries(registrationsByDate).map(([date, count]) => ({
    date,
    count: count as number,
  })).slice(-7); // Last 7 days/entries

  // University Distribution - Cleaned and expanded
  const uniDist = users.reduce((acc: any, user) => {
    const name = user.college_name?.trim();
    // Basic filter: ignore emails or very short names that might be junk data
    if (name && !name.includes('@') && name.length > 2) {
      acc[name] = (acc[name] || 0) + 1;
    }
    return acc;
  }, {});

  const universityData = Object.entries(uniDist)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Show top 10 instead of 5

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
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Overview Data
            </button>
            <button
              onClick={() => setActiveTab("admins")}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "admins"
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
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "students"
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

              {/* Charts Perspective - Professional Analytics Layer */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                
                {/* User Roles Pie Chart */}
                <div className="p-8 rounded-[2rem] border bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm overflow-hidden shadow-xl shadow-accent/5">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                        <Users className="w-5 h-5 text-accent" />
                      </div>
                      <h4 className="font-bold text-lg tracking-tight">Ecosystem Distribution</h4>
                    </div>
                  </div>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={roleData}
                          cx="50%"
                          cy="50%"
                          stroke="none"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {roleData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color} 
                              className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="glass-card border px-4 py-3 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{payload[0].name}</p>
                                  <p className="text-xl font-bold">{payload[0].value} <span className="text-sm font-normal text-muted-foreground">Users</span></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          iconType="circle" 
                          formatter={(value) => <span className="text-xs font-medium text-muted-foreground ml-1">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Registration Pipeline (Area) */}
                <div className="p-8 rounded-[2rem] border bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm overflow-hidden shadow-xl shadow-accent/5">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-lg tracking-tight">Network Growth Velocity</h4>
                  </div>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={growthData}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" strokeOpacity={0.5} />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }} 
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="glass-card border px-4 py-3 rounded-2xl shadow-2xl">
                                  <p className="text-[10px] font-black text-accent uppercase mb-1 tracking-tighter">{label}</p>
                                  <p className="text-lg font-bold">{payload[0].value} Registrations</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(var(--accent))" 
                          strokeWidth={4} 
                          fillOpacity={1} 
                          fill="url(#colorCount)" 
                          animationDuration={2000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Degree Status Breakdown - Premium Elevation */}
                <div className="p-8 rounded-[2rem] border bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm overflow-hidden shadow-xl shadow-accent/5">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                      <GraduationCap className="w-5 h-5 text-accent" />
                    </div>
                    <h4 className="font-bold text-lg tracking-tight">On-Chain Credentialing Status</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-auto lg:h-[280px] content-center">
                    {statusData.map((stat) => {
                      const total = credentials.length || 1;
                      const percentage = (stat.value / total) * 100;
                      const Icon = stat.name === 'Approved' ? CheckCircle : stat.name === 'Pending' ? Clock : ShieldAlert;
                      
                      return (
                        <div key={stat.name} className="relative p-7 rounded-[2rem] border bg-card/40 hover:bg-card/60 transition-all hover:scale-[1.02] duration-300 group cursor-default shadow-sm border-white/5">
                          {/* Animated background bar */}
                          <div 
                            className="absolute bottom-0 left-0 h-1.5 transition-all duration-1000 ease-out opacity-40 group-hover:opacity-100" 
                            style={{ width: `${percentage}%`, backgroundColor: stat.color, filter: `drop-shadow(0 0 8px ${stat.color})` }}
                          />
                          
                          <div className="flex items-center justify-between mb-5">
                            <div className="p-3 rounded-2xl shadow-inner bg-black/5 dark:bg-white/5">
                              <Icon className="w-6 h-6" style={{ color: stat.color }} />
                            </div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">{stat.name}</span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-5xl font-black tracking-tighter" style={{ color: stat.color }}>{stat.value}</div>
                            <div className="text-xs font-semibold text-muted-foreground/80">Credentials</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                 {/* University Impact - Horizontal Refinement */}
                 <div className="p-8 rounded-[2rem] border bg-gradient-to-b from-card/80 to-card/40 backdrop-blur-sm overflow-hidden shadow-xl shadow-accent/5">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-bold text-lg tracking-tight">Top Performing Universities</h4>
                  </div>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={universityData} 
                        layout="vertical" 
                        margin={{ left: 10, right: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--muted))" strokeOpacity={0.3} />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={120}
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', fontWeight: 600 }} 
                        />
                        <Tooltip 
                          cursor={{ fill: 'hsl(var(--accent))', fillOpacity: 0.05 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="glass-card border px-4 py-3 rounded-2xl shadow-2xl">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{payload[0].payload.name}</p>
                                  <p className="text-lg font-bold">{payload[0].value} <span className="text-sm font-normal text-muted-foreground">Active Users</span></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar 
                          dataKey="count" 
                          fill="hsl(var(--primary))" 
                          radius={[0, 10, 10, 0]} 
                          barSize={24}
                        >
                          {universityData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`hsl(var(--accent), ${1 - (index * 0.1)})`}
                              className="hover:opacity-80 transition-opacity"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
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
