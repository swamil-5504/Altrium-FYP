import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

import axios from "@/api/axios";
import {
  PasswordStrengthChecklist,
  isPasswordValid,
} from "@/components/PasswordStrengthChecklist";
import { extractErrorMessage } from "@/utils/errors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordOk = isPasswordValid(password);
  const match = password.length > 0 && password === confirm;
  const canSubmit = email.length > 0 && passwordOk && match && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await axios.post("/auth/forgot-password", {
        email,
        new_password: password,
      });
      toast.success(
        "If that account exists, its password has been updated. You can now sign in.",
      );
      navigate("/login");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Reset failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <Link
        to="/login"
        className="absolute top-8 left-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Sign In
      </Link>

      <div className="w-full max-w-md bg-card border rounded-2xl p-8 shadow-xl z-10 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
          <KeyRound className="w-6 h-6 text-accent" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Reset your password</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Enter the email address you signed up with and choose a new password.
          The change takes effect immediately.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">New Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={12}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              />
            </div>
            <PasswordStrengthChecklist password={password} className="pt-1" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className={`w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all ${
                  confirm.length > 0 && !match ? "border-red-500" : ""
                }`}
              />
            </div>
            {confirm.length > 0 && !match && (
              <p className="text-xs text-red-500">Passwords don't match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium mt-6 hover:opacity-90 transition-opacity active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Updating…
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-6">
          Tip: this dev-mode reset doesn't verify your email. In production
          you'll receive a one-time link instead.
        </p>
      </div>
    </div>
  );
}
