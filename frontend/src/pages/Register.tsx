import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, UserPlus, Mail, KeyRound, Building2, Wallet, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ethers, type Eip1193Provider } from "ethers";
import axios from "@/api/axios";

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const roleFromQuery = searchParams.get("role") === "ADMIN" ? "ADMIN" : "STUDENT";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [role, setRole] = useState<"STUDENT" | "ADMIN">(roleFromQuery);
  const [prnNumber, setPrnNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast.error("MetaMask is not installed!");
      return;
    }
    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      setWalletAddress(signer.address);
      toast.success("Wallet connected!");
    } catch (error) {
      toast.error("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "ADMIN" && !walletAddress) {
      toast.error("Connecting your wallet is required for University Admins.");
      return;
    }
    if (role === "ADMIN" && !file) {
      toast.error("Proof of Affiliation document is required for University Admins.");
      return;
    }

    setLoading(true);
    try {
      const user = await register(email, password, fullName, role, collegeName, walletAddress, prnNumber);

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
              <input
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                placeholder="Ex. Altrium University"
              />
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
                <label className="text-sm font-medium">Institution Wallet</label>
                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border bg-background text-sm font-medium hover:bg-muted transition"
                >
                  <Wallet className="w-4 h-4 text-muted-foreground" />
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect MetaMask"}
                </button>
              </div>

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
          <Link to={`/login?role=${role}`} className="text-accent font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

