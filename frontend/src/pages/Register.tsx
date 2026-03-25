import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, UserPlus, Mail, KeyRound, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"STUDENT" | "EMPLOYER" | "ADMIN">("STUDENT");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, fullName, role);
      toast.success("Account created!");

      if (role === "ADMIN") navigate("/university");
      else if (role === "STUDENT") navigate("/student");
      else navigate("/verify");
    } catch (err: unknown) {
      const detail =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      toast.error(detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none' stroke='%23000' stroke-width='.5'/%3E%3C/svg%3E")`,
        }}
      />

      <Link
        to="/"
        className="absolute top-8 left-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="w-full max-w-md bg-card border rounded-2xl p-8 surface-elevated z-10 animate-fade-in shadow-xl focus-within:ring-1 focus-within:ring-accent transition-all duration-300">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
          <UserPlus className="w-6 h-6 text-accent" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Create Account</h2>
        <p className="text-muted-foreground text-sm mb-6">Register your role within the network.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Select Your Role</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all appearance-none"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
              >
                <option value="STUDENT">STUDENT</option>
                <option value="EMPLOYER">EMPLOYER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="As on your official records"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="Ex. mail@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium mt-6 hover:opacity-90 transition-opacity active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none flex justify-center items-center gap-2"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

