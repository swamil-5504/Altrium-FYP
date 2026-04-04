import React, { useEffect, useMemo, useState } from "react";
import { ethers, type Eip1193Provider } from "ethers";
import { toast } from "sonner";
import axios from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Blocks, Clock, Eye, Shield, XCircle, Wallet } from "lucide-react";

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
  created_at: string;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

// Provide the deployed registry address via environment:
// - VITE_REGISTRY_ADDRESS
// Docker should pass it once you have the on-chain deployment.
const CONTRACT_REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS || "";

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
  const { isAuthenticated } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  const [mintingById, setMintingById] = useState<Record<string, boolean>>({});

  const pendingCredentials = useMemo(
    () => credentials.filter((c) => c.status === "PENDING"),
    [credentials],
  );

  useEffect(() => {
    void fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/degrees");
      setCredentials(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load submissions.");
    } finally {
      setLoading(false);
    }
  };

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
      toast.success("Wallet connected successfully!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to connect wallet";
      toast.error(message);
    } finally {
      setIsConnecting(false);
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
    if (!CONTRACT_REGISTRY_ADDRESS) {
      toast.error("Missing VITE_REGISTRY_ADDRESS (deployed AltriumRegistry address).");
      return;
    }

    if (!window.ethereum) {
      toast.error("MetaMask is not installed!");
      return;
    }

    if (!credential.prn_number) {
      toast.error("PRN number is missing for this submission.");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please login as an admin to mint.");
      return;
    }

    setMintingById((prev) => ({ ...prev, [credential.id]: true }));
    const loadingToast = toast.loading(`Minting SBT for ${credential.prn_number} on Sepolia...`);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const registryContract = new ethers.Contract(CONTRACT_REGISTRY_ADDRESS, registryAbi, signer);
      const degreeSbtInterface = new ethers.Interface(degreeSbtAbi);

      // collegeIdHash = keccak256(utf8(prn_number))
      const collegeIdHash = ethers.keccak256(ethers.toUtf8Bytes(credential.prn_number));

      // degreeHash = keccak256(utf8(JSON.stringify(studentBasicsPayload)))
      const m = (credential.metadata_json ?? {}) as Record<string, unknown>;
      const studentBasicsPayload = {
        studentName: typeof m.studentName === "string" ? m.studentName : "",
        passingYear: typeof m.passingYear === "string" ? m.passingYear : "",
        entryYear: typeof m.entryYear === "string" ? m.entryYear : "",
        cgpa: typeof m.cgpa === "string" ? m.cgpa : "",
        credits: typeof m.credits === "string" ? m.credits : "",
        degreeTitle: credential.title,
        degreeDescription: credential.description ?? "",
      };

      const degreeHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(studentBasicsPayload)));

      // tokenURI is an off-chain pointer; for demo we keep it deterministic.
      const degreeURI = `ipfs://degree/${credential.prn_number}`;

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

      // Persist to backend: status=APPROVED, tx_hash=receipt.transactionHash, token_id=tokenId
      await axios.patch(`/degrees/${credential.id}`, {
        status: "APPROVED",
        tx_hash: receipt.transactionHash,
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
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg bg-card text-foreground font-medium text-sm hover:bg-muted transition active:scale-[0.98] disabled:opacity-50"
                >
                  <Wallet className="w-4 h-4" />
                  {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect MetaMask"}
                </button>
              </div>
            </div>
          </ScrollReveal>

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
                                  className={`p-1.5 rounded-md transition-colors ${
                                    cred.has_document
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
                                  {mintingById[cred.id] ? "Minting..." : "Mint & Approve"}
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
        </div>
      </div>

    </div>
  );
};

export default UniversityAdmin;
