import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound, Mail, Loader2 } from "lucide-react";


import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import axios from "@/api/axios";


export default function Login() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<"STUDENT" | "ADMIN">(searchParams.get("role") === "ADMIN" ? "ADMIN" : "STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);



  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin();
  };

  const performLogin = async () => {
    setLoading(true);
    try {
      await login(email, password, false);

      const me = await axios.get("/users/me");
      const userRole = me.data.role as "ADMIN" | "STUDENT";

      if (userRole !== role) {
        await logout();
        toast.error(`You are a ${userRole}, but you tried to login as a ${role}.`);
        toast.error(`You are a ${userRole}, but you tried to login as a ${role}.`);
        return;
      }

      toast.success("Successfully logged in!");

      if (userRole === "ADMIN") navigate("/university");
      else navigate("/student");
    } catch (err: unknown) {
      const detail =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;

      if (detail && detail.includes("pending verification")) {
        navigate("/pending-verification");
        return;
      }

      toast.error(detail || "Login failed");
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
          <KeyRound className="w-6 h-6 text-accent" />
        </div>

        <h2 className="text-2xl font-bold mb-2">{role === "ADMIN" ? "Admin Login" : "Student Login"}</h2>
        <p className="text-muted-foreground text-sm mb-6">Sign in to access your portal.</p>

        <div className="flex bg-muted p-1 rounded-lg mb-6">
          <button
            type="button"
            onClick={() => setRole("STUDENT")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === "STUDENT" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setRole("ADMIN")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === "ADMIN" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            University Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">


          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
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
                placeholder="Enter your password"
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
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link to={`/register?role=${role}`} className="text-accent font-medium hover:underline">
            <Link to={`/register?role=${role}`} className="text-accent font-medium hover:underline">
              Register here
            </Link>
        </div>
      </div>
    </div>
  );
}

