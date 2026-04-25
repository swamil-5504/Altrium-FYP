import React, { useState, useEffect } from "react";

import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, UserPlus, Mail, KeyRound, Building2, FileText, Eye, EyeOff, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import axios from "@/api/axios";



export default function Register() {
  const [searchParams] = useSearchParams();
  const roleFromQuery = searchParams.get("role") === "ADMIN" ? "ADMIN" : "STUDENT";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState<"STUDENT" | "ADMIN">(roleFromQuery);
  const [prnNumber, setPrnNumber] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState<string[]>([]);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await axios.get("/users/universities");
        setUniversities(response.data);
      } catch (err) {
        console.error("Failed to fetch universities", err);
      }
    };
    void fetchUniversities();
  }, []);


  const { register, login } = useAuth();
  const navigate = useNavigate();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();



    if (role === "ADMIN" && !file) {
      toast.error("Proof of Affiliation document is required for University Admins.");
      return;
    }

    setLoading(true);
    try {
      const user = await register(email, password, fullName, role, collegeName, undefined, prnNumber, telegramId);

      if (role === "ADMIN" && file && user?.id) {
        const formData = new FormData();
        formData.append("file", file);
        await axios.post(`/auth/${user.id}/verification-document`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Registration submitted! Pending platform admin verification.");
        navigate("/pending-verification");
      } else {
        toast.success("Account created!");
        navigate("/student");
      }
    } catch (err: unknown) {
      console.error("Registration error:", err);
      let errorMessage = "Registration failed";

      if (typeof err === "object" && err && "response" in err) {
        const responseData = (err as any).response?.data;
        if (responseData) {
          if (typeof responseData.detail === "string") {
            errorMessage = responseData.detail;
          } else if (Array.isArray(responseData.detail)) {
            errorMessage = responseData.detail[0]?.msg || "Validation error";
          } else if (responseData.message) {
            errorMessage = responseData.message;
          }
        }
      }
      toast.error(errorMessage);
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

        <h2 className="text-2xl font-bold mb-2">{role === "ADMIN" ? "Create Admin Account" : "Create Student Account"}</h2>
        <p className="text-muted-foreground text-sm mb-6">Register your role within the network.</p>

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
            <label className="text-sm font-medium">University / College Name</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              {role === "STUDENT" ? (
                <select
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent appearance-none transition-all cursor-pointer"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  required
                >
                  <option value="" disabled>Choose your university</option>
                  {universities.map((uni) => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="Ex. Altrium University"
                />
              )}
            </div>
          </div>



          {role === "STUDENT" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">PRN Number</label>
              <input
                value={prnNumber}
                onChange={(e) => setPrnNumber(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Ex. 2021000123"
              />
            </div>
          )}

          {role === "ADMIN" && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Proof of Affiliation (PDF)</label>
                <label className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-accent hover:bg-accent/5 transition cursor-pointer text-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : "Click to upload ID or Letter"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </>
          )}

          {role === "STUDENT" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-2">
                Telegram ID for Alerts
                <div className="group relative">
                  <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[10px] rounded border shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    Get your ID from @userinfobot on Telegram.
                  </div>
                </div>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                placeholder="Ex. 1081709963"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                ⚠️ IMPORTANT: Click <b>START</b> on <a href="https://t.me/Altrium_Notification_Bot" target="_blank" rel="noreferrer" className="text-accent hover:underline">@Altrium_Notification_Bot</a> and keep it <b>UNMUTED</b> to receive your degree alerts.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email Address</label>
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
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-9 pr-12 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium mt-6 hover:opacity-90 transition-opacity active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none flex justify-center items-center gap-2"
          >
            {loading ? "Please wait..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to={`/login?role=${role}`} className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

