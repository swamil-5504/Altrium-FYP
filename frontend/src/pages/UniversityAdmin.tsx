import React, { useEffect, useMemo, useState } from "react";
import { generateSVG, getTierInfo } from "@/utils/svgGenerator";
import { ethers, type Eip1193Provider } from "ethers";
import { toast } from "sonner";
import axios from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Blocks, Clock, Eye, Shield, XCircle, Wallet, Upload, HelpCircle, Users, GraduationCap, AlertTriangle } from "lucide-react";

import { Link } from "react-router-dom";

type CredentialStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Credential {
  id: string;
  title: string;
  description?: string | null;
  metadata_json?: Record<string, unknown> | null;
  prn_number?: string | null;
  status: CredentialStatus;
  token_id?: number | null;
  tx_hash?: string | null;
  has_document?: boolean;
  college_name?: string | null;
  created_at: string;
}

interface Student {
  id: string;
  email: string;
  full_name: string | null;
  role: "ADMIN" | "STUDENT";
  college_name: string | null;
  wallet_address: string | null;
  prn_number: string | null;
  is_active: boolean;
  created_at: string;
}

// Provide the deployed registry address via environment:
// - VITE_REGISTRY_ADDRESS
// Docker should pass it once you have the on-chain deployment.
const CONTRACT_REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS || "";
// TEMP: Bypass blockchain minting and only approve in backend.
const BYPASS_BLOCKCHAIN_APPROVAL = false;

// Minimal ABIs for minting + reading tokenId.
const registryAbi = [
  {
    type: "function",
    name: "uploadDegree",
    inputs: [
      { name: "collegeIdHash", type: "bytes32" },
      { name: "degreeHash", type: "bytes32" },
      { name: "degreeURI", type: "string" },
    ],
    outputs: [{ name: "tokenId", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "verifyDegree",
    inputs: [
      { name: "collegeIdHash", type: "bytes32" },
      { name: "verified", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeDegree",
    inputs: [{ name: "collegeIdHash", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "burnDegree",
    inputs: [{ name: "collegeIdHash", type: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isDegreeRevoked",
    inputs: [{ name: "collegeIdHash", type: "bytes32" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "degreeSBT",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

const degreeSbtAbi = [
  {
    type: "function",
    name: "tokenIdByCollegeIdHash",
    inputs: [{ name: "collegeIdHash", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "DegreeMinted",
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "collegeIdHash", type: "bytes32" },
      { indexed: true, name: "issuedBy", type: "address" },
      { indexed: false, name: "degreeHash", type: "bytes32" },
      { indexed: false, name: "tokenURI", type: "string" },
    ],
  },
] as const;

const UniversityAdmin: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<"degrees" | "students">("degrees");
  const [loading, setLoading] = useState(true);

  const { open } = useAppKit();
  const { address: walletAddress, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider('eip155');

  const [mintingById, setMintingById] = useState<Record<string, boolean>>({});

  const pendingCredentials = useMemo(
    () => credentials.filter((c) => c.status === "PENDING"),
    [credentials],
  );

  const approvedCredentials = useMemo(
    () => credentials.filter((c) => c.status === "APPROVED"),
    [credentials],
  );

  useEffect(() => {
    void fetchCredentials();
  }, [user?.id]);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const [credRes, studRes] = await Promise.all([
        axios.get("/degrees"),
        axios.get("/users/my-students"),
      ]);
      setCredentials(credRes.data);
      setStudents(studRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      await open();
    } catch (error: unknown) {
      toast.error("Failed to open wallet modal");
    }
  };

  const handleReject = async (credentialId: string) => {
    try {
      await axios.patch(`/degrees/${credentialId}`, { status: "REJECTED" });
      toast.success("Submission rejected.");
      await fetchCredentials();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject submission.");
    }
  };

  const handleRevoke = async (credentialId: string) => {
    // Find the credential's PRN to compute the on-chain collegeIdHash
    const credential = credentials.find(c => c.id === credentialId);
    if (!credential?.prn_number) {
      toast.error("Cannot find PRN for this credential.");
      return;
    }

    const revokeToast = toast.loading("Revoking on-chain...");
    try {
      // --- On-chain revocation first ---
      if (walletProvider && CONTRACT_REGISTRY_ADDRESS) {
        const provider = new ethers.BrowserProvider(walletProvider as any);
        const signer = await provider.getSigner();
        const registryContract = new ethers.Contract(CONTRACT_REGISTRY_ADDRESS, registryAbi, signer);
        const combinedString = `${credential.prn_number}-${credential.college_name}`;
        const collegeIdHash = ethers.keccak256(ethers.toUtf8Bytes(combinedString));
        const tx = await registryContract.revokeDegree(collegeIdHash);
        await tx.wait();
        toast.loading("On-chain revocation confirmed. Updating backend...", { id: revokeToast });
      } else {
        toast.warning("Wallet not connected — revoking on platform only (not on-chain).");
      }

      await axios.patch(`/degrees/${credentialId}/revoke`);
      toast.success("Credential revoked on-chain and on platform.", { id: revokeToast });
      await fetchCredentials();
    } catch (err) {
      console.error(err);
      toast.error("Failed to revoke credential.", { id: revokeToast });
    }
  };

  const handleBurnReset = async (credentialId: string) => {
    const credential = credentials.find(c => c.id === credentialId);
    if (!credential?.prn_number) {
      toast.error("Cannot find PRN for this credential.");
      return;
    }

    const burnToast = toast.loading("Burning NFT on-chain...");
    try {
      // 1. On-chain burn
      if (walletProvider && CONTRACT_REGISTRY_ADDRESS) {
        const provider = new ethers.BrowserProvider(walletProvider as any);
        const signer = await provider.getSigner();
        const registryContract = new ethers.Contract(CONTRACT_REGISTRY_ADDRESS, registryAbi, signer);
        const combinedString = `${credential.prn_number}-${credential.college_name}`;
        const collegeIdHash = ethers.keccak256(ethers.toUtf8Bytes(combinedString));
        const tx = await registryContract.burnDegree(collegeIdHash);
        await tx.wait();
        toast.loading("On-chain burn confirmed. Resetting submission in database...", { id: burnToast });
      } else {
        toast.warning("Wallet not connected — resetting on platform only (not on-chain).");
      }

      // 2. Backend reset
      await axios.post(`/degrees/${credentialId}/reset`);
      toast.success("Credential burned and submission reset to pending.", { id: burnToast });
      await fetchCredentials();
    } catch (err) {
      console.error(err);
      toast.error("Failed to burn/reset credential.", { id: burnToast });
    }
  };

  // ── CSV Bulk Upload ──────────────────────────────────────────────────
  const [csvUploading, setCSVUploading] = useState(false);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCSVUploading(true);
    try {
      const text = await file.text();
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1);

      let minted = 0;
      for (const row of rows) {
        const values = row.split(",").map(v => v.trim());
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ""; });

        // Expected CSV columns: prn_number, student_name, degree_title, passing_year, entry_year, cgpa, credits, description
        if (!obj["prn_number"] || !obj["degree_title"]) continue;

        try {
          await axios.post("/degrees/", {
            title: obj["degree_title"],
            description: obj["description"] || "",
            prn_number: obj["prn_number"],
            metadata_json: {
              studentName: obj["student_name"] || "",
              passingYear: obj["passing_year"] || "",
              entryYear: obj["entry_year"] || "",
              cgpa: obj["cgpa"] || "",
              credits: obj["credits"] || "",
            },
          });
          minted++;
        } catch (rowErr) {
          console.error("Row failed:", obj, rowErr);
        }
      }

      toast.success(`CSV imported: ${minted} submission(s) queued for minting.`);
      await fetchCredentials();
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse CSV.");
    } finally {
      setCSVUploading(false);
      e.target.value = "";
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

  const handleMint = async (credential: Credential) => {
    if (!isAuthenticated) {
      toast.error("Please login as an admin to approve.");
      return;
    }

    if (BYPASS_BLOCKCHAIN_APPROVAL) {
      setMintingById((prev) => ({ ...prev, [credential.id]: true }));
      const loadingToast = toast.loading("Approving submission...");
      try {
        await axios.patch(`/degrees/${credential.id}`, {
          status: "APPROVED",
        });
        toast.success("Submission approved (blockchain bypass enabled).");
        await fetchCredentials();
      } catch (err) {
        console.error(err);
        toast.error("Failed to approve submission.");
      } finally {
        toast.dismiss(loadingToast);
        setMintingById((prev) => ({ ...prev, [credential.id]: false }));
      }
      return;
    }

    if (!CONTRACT_REGISTRY_ADDRESS) {
      toast.error("Missing VITE_REGISTRY_ADDRESS (deployed AltriumRegistry address).");
      return;
    }

    if (!walletProvider) {
      toast.error("Wallet is not connected!");
      return;
    }

    if (!credential.prn_number) {
      toast.error("PRN number is missing for this submission.");
      return;
    }

    setMintingById((prev) => ({ ...prev, [credential.id]: true }));
    const loadingToast = toast.loading(`Minting SBT for ${credential.prn_number} on Sepolia...`);

    try {
      const provider = new ethers.BrowserProvider(walletProvider as any);
      const signer = await provider.getSigner();

      const registryContract = new ethers.Contract(CONTRACT_REGISTRY_ADDRESS, registryAbi, signer);
      const degreeSbtInterface = new ethers.Interface(degreeSbtAbi);

      const universityName = user?.college_name || "Altrium University";

      // collegeIdHash = keccak256(utf8(prn_number + universityName))
      const combinedString = `${credential.prn_number}-${universityName}`;
      const collegeIdHash = ethers.keccak256(ethers.toUtf8Bytes(combinedString));

      // degreeHash = keccak256(utf8(JSON.stringify(studentBasicsPayload)))
      const m = (credential.metadata_json ?? {}) as Record<string, unknown>;
      const extractedStudentName = typeof m.studentName === "string" ? m.studentName : (typeof m.name === "string" ? m.name : "Student");
      const studentBasicsPayload = {
        studentName: extractedStudentName,
        passingYear: typeof m.passingYear === "string" ? m.passingYear : "",
        entryYear: typeof m.entryYear === "string" ? m.entryYear : "",
        cgpa: typeof m.cgpa === "string" ? m.cgpa : "",
        credits: typeof m.credits === "string" ? m.credits : "",
        degreeTitle: credential.title,
        degreeDescription: credential.description ?? "",
      };

      const degreeHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(studentBasicsPayload)));

      const cgpaVal = String(m.cgpa || "");
      const { name: tierName, color: tierColor } = getTierInfo(cgpaVal);
      const dynamicImageURI = generateSVG(universityName, credential.title, String(m.passingYear || "N/A"), tierName, tierColor);

      // Create a native ERC721 metadata JSON object to inject directly to the blockchain
      const descriptionText = `${credential.description || "Soulbound academic credential issued via Altrium"}

🎓 Degree: ${credential.title}
🏫 University: ${universityName}
📛 PRN: ${credential.prn_number}
⭐ Tier: ${tierName}
📅 Class of: ${String(m.passingYear || "N/A")}`;
      const metadata = {
        name: `${credential.title} - ${extractedStudentName}`,
        description: descriptionText,
        image: dynamicImageURI,
        attributes: [
          { trait_type: "University", value: universityName },
          { trait_type: "Degree", value: credential.title },
          { trait_type: "CGPA Tier", value: tierName },
          { trait_type: "Graduation Year", value: String(m.passingYear || "N/A") },
          { trait_type: "Soulbound", value: "True" }
        ]
      };

      // Use URL compatible unicode Base64 encoding
      const jsonStr = JSON.stringify(metadata);
      const base64Json = btoa(unescape(encodeURIComponent(jsonStr)));
      const degreeURI = `data:application/json;base64,${base64Json}`;

      const tx = await registryContract.uploadDegree(collegeIdHash, degreeHash, degreeURI);
      const receipt = await tx.wait();

      // Best-effort: verify after mint (requires blockchain role permissions).
      try {
        const verifyTx = await registryContract.verifyDegree(collegeIdHash, true);
        await verifyTx.wait();
      } catch (verifyErr) {
        console.warn("verifyDegree failed:", verifyErr);
        toast.warning("Minted but on-chain verification failed (role mismatch?).");
      }

      // tokenId extraction:
      // - prefer parsing DegreeMinted event
      // - fallback to tokenIdByCollegeIdHash read
      let tokenId: bigint | null = null;
      for (const log of receipt.logs) {
        try {
          const parsed = degreeSbtInterface.parseLog(log);
          if (parsed?.name === "DegreeMinted") {
            tokenId = parsed.args.tokenId as bigint;
            break;
          }
        } catch {
          // Ignore non-matching logs
        }
      }

      if (tokenId === null) {
        const degreeSbtAddress = await registryContract.degreeSBT();
        const degreeSbtContract = new ethers.Contract(degreeSbtAddress, degreeSbtAbi, signer);
        tokenId = await degreeSbtContract.tokenIdByCollegeIdHash(collegeIdHash);
      }

      // Persist to backend: status=APPROVED, tx_hash=tx.hash, token_id=tokenId
      await axios.patch(`/degrees/${credential.id}`, {
        status: "APPROVED",
        tx_hash: tx.hash,
        token_id: Number(tokenId),
      });

      toast.success("SBT minted successfully and submission updated.");
      await fetchCredentials();
    } catch (error: unknown) {
      console.error(error);
      const message =
        typeof error === "object" && error
          ? ("reason" in error ? (error as { reason?: string }).reason : undefined) ||
          ("message" in error ? (error as { message?: string }).message : undefined) ||
          "Minting failed"
          : error instanceof Error
            ? error.message
            : "Minting failed";
      toast.error(message);
    } finally {
      toast.dismiss(loadingToast);
      setMintingById((prev) => ({ ...prev, [credential.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <ScrollReveal>
            <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">College Admin</h1>
                <p className="text-muted-foreground">Review submissions and mint verified degrees to Sepolia.</p>
              </div>

              <div className="flex gap-3">
                {/* CSV Upload */}
                <label className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg bg-card text-foreground font-medium text-sm hover:bg-muted transition active:scale-[0.98] cursor-pointer ${csvUploading ? "opacity-50 pointer-events-none" : ""}`}>
                  <Upload className="w-4 h-4" />
                  {csvUploading ? "Importing..." : "Import CSV"}
                  <input type="file" className="hidden" accept=".csv" onChange={handleCSVUpload} disabled={csvUploading} />
                </label>
                {/* Wallet Status Label */}
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-card text-foreground text-sm font-medium">
                  <Wallet className="w-4 h-4 text-accent" />
                  <span className="font-mono text-xs truncate max-w-[120px]">
                    {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Not Connected"}
                  </span>
                  {!walletAddress && (
                    <button onClick={connectWallet} className="ml-1 text-accent hover:underline text-xs">Connect</button>
                  )}
                </div>

                <Link
                  to="/guide"
                  className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg bg-accent/10 text-accent font-medium text-sm hover:bg-accent/20 transition active:scale-[0.98]"
                >
                  <HelpCircle className="w-4 h-4" />
                  Web3 Guide
                </Link>
              </div>
            </div>

            {/* Wallet Warning */}
            {walletAddress && user?.wallet_address && walletAddress.toLowerCase() !== user.wallet_address.toLowerCase() && (
              <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-500">Wallet Account Mismatch</h4>
                  <p className="text-xs text-amber-500/80 mt-1">
                    MetaMask is connected to <strong>{walletAddress.slice(0, 10)}...</strong>, but this Admin profile is registered to <strong>{user.wallet_address.slice(0, 10)}...</strong>.
                    Transactions will fail unless you switch accounts in MetaMask.
                  </p>
                </div>
              </div>
            )}
          </ScrollReveal>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl">
            <button
              onClick={() => setActiveTab("degrees")}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "degrees"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <GraduationCap className="w-4 h-4" />
              Degree Submissions
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "students"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Users className="w-4 h-4" />
              Students Enrolled
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-accent/10 text-accent">{students.length}</span>
            </button>
          </div>

          {activeTab === "degrees" && (
            <>
              <ScrollReveal delay={100}>
                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="p-4 border-b bg-muted/30">
                    <div className="flex flex-wrap items-center gap-4 justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">Pending submissions</div>
                        <div className="text-2xl font-bold tabular-nums">{pendingCredentials.length}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {loading ? "Loading..." : "Minted submissions are persisted to backend and show up instantly."}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Degree</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">PRN</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-muted-foreground">
                              Loading submissions...
                            </td>
                          </tr>
                        ) : pendingCredentials.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-muted-foreground">
                              No pending submissions.
                            </td>
                          </tr>
                        ) : (
                          pendingCredentials.map((cred) => {
                            const meta = (cred.metadata_json ?? {}) as Record<string, unknown>;
                            const studentName = typeof meta.studentName === "string" ? meta.studentName : "Student";
                            return (
                              <tr key={cred.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="font-medium">{studentName}</div>
                                  <div className="text-xs text-muted-foreground">{new Date(cred.created_at).toLocaleDateString()}</div>
                                </td>
                                <td className="py-3.5 px-4 text-muted-foreground">{cred.title}</td>
                                <td className="py-3.5 px-4 font-mono text-xs">{cred.prn_number}</td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    Pending
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      className={`p-1.5 rounded-md transition-colors ${cred.has_document
                                        ? "hover:bg-muted text-accent"
                                        : "opacity-40 cursor-not-allowed"
                                        }`}
                                      title={cred.has_document ? "View Document" : "No document uploaded"}
                                      onClick={() =>
                                        cred.has_document
                                          ? void handleViewDocument(cred.id)
                                          : toast.info("No document uploaded for this submission.")
                                      }
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>

                                    <button
                                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity active:scale-[0.97] disabled:opacity-50"
                                      onClick={() => void handleMint(cred)}
                                      disabled={!!mintingById[cred.id]}
                                    >
                                      <Blocks className="w-3 h-3" />
                                      {mintingById[cred.id]
                                        ? (BYPASS_BLOCKCHAIN_APPROVAL ? "Approving..." : "Minting...")
                                        : (BYPASS_BLOCKCHAIN_APPROVAL ? "Approve" : "Mint & Approve")}
                                    </button>

                                    <button
                                      className="px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors active:scale-[0.97] disabled:opacity-50"
                                      onClick={() => void handleReject(cred.id)}
                                      disabled={!!mintingById[cred.id]}
                                    >
                                      <XCircle className="inline w-3 h-3 mr-1" />
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </ScrollReveal>

              {/* Approved / Revoke Section */}
              <ScrollReveal delay={150}>
                <div className="rounded-xl border bg-card overflow-hidden mt-6">
                  <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Approved & Minted</div>
                      <div className="text-2xl font-bold tabular-nums">{approvedCredentials.length}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Revoke any credential to mark it invalid on the platform.</div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Degree</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Token ID</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedCredentials.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-muted-foreground">No approved credentials yet.</td>
                          </tr>
                        ) : (
                          approvedCredentials.map((cred) => {
                            const meta = (cred.metadata_json ?? {}) as Record<string, unknown>;
                            const sName = typeof meta.studentName === "string" ? meta.studentName : "Student";
                            return (
                              <tr key={cred.id} className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${(cred as any).revoked ? "opacity-50" : ""}`}>
                                <td className="py-3.5 px-4">
                                  <div className="font-medium">{sName}</div>
                                  <div className="text-xs text-muted-foreground">{cred.prn_number}</div>
                                </td>
                                <td className="py-3.5 px-4 text-muted-foreground">{cred.title}</td>
                                <td className="py-3.5 px-4 font-mono text-xs">{cred.token_id ?? "-"}</td>
                                <td className="py-3.5 px-4">
                                  {(cred as any).revoked
                                    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><XCircle className="w-3 h-3" />Revoked</span>
                                    : <span className="inline-flex items-center gap-1 text-xs font-medium text-accent"><Shield className="w-3 h-3" />Valid</span>}
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {!(cred as any).revoked && (
                                      <button
                                        className="px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs font-medium hover:bg-destructive/20 transition-colors"
                                        onClick={() => void handleRevoke(cred.id)}
                                      >
                                        <XCircle className="inline w-3 h-3 mr-1" />
                                        Revoke
                                      </button>
                                    )}
                                    <button
                                      className="px-3 py-1.5 rounded-md bg-orange-500/10 text-orange-500 text-xs font-medium hover:bg-orange-500/20 transition-colors"
                                      onClick={() => void handleBurnReset(cred.id)}
                                      title="Test only: burns the NFT on-chain and resets submission to pending"
                                    >
                                      <XCircle className="inline w-3 h-3 mr-1" />
                                      Burn & Reset
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
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
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Students enrolled in {user?.college_name}</div>
                    <div className="text-2xl font-bold tabular-nums">{students.length}</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">PRN</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">University</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-muted-foreground">
                            {loading ? "Loading students..." : "No students enrolled yet."}
                          </td>
                        </tr>
                      ) : (
                        students.map((s) => (
                          <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="py-3.5 px-4 font-medium">{s.full_name ?? "—"}</td>
                            <td className="py-3.5 px-4 text-muted-foreground">{s.email}</td>
                            <td className="py-3.5 px-4 font-mono text-xs">{s.prn_number ?? "—"}</td>
                            <td className="py-3.5 px-4 text-muted-foreground">{s.college_name}</td>
                            <td className="py-3.5 px-4 text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</td>
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
      </div >

    </div >
  );
};

export default UniversityAdmin;
