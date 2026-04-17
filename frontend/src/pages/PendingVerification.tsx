import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, ShieldCheck, Shield, ExternalLink, MousePointer2, Wallet, Coins, Settings } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useAuth } from "@/context/AuthContext";
import { useAppKit } from '@reown/appkit/react';
import { toast } from "sonner";

export default function PendingVerification() {
    const navigate = useNavigate();
    const { isPendingVerification, isAuthenticated, refreshUser } = useAuth();
    const { close: closeAppKit } = useAppKit();

    // Close any Reown AppKit wallet modal immediately — this page is for unapproved
    // admins and has no wallet connection UI. AppKit auto-reconnect can fire here
    // because it initializes globally in App.tsx.
    useEffect(() => {
        void closeAppKit();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Poll every 5 seconds to check if superadmin has approved
    useEffect(() => {
        const interval = setInterval(async () => {
            await refreshUser();
        }, 5000);

        return () => clearInterval(interval);
    }, [refreshUser]);

    // When approval comes through, navigate to admin dashboard
    useEffect(() => {
        if (isAuthenticated && !isPendingVerification) {
            toast.success("Superadmin has approved your login!");
            navigate("/university");
        }
    }, [isAuthenticated, isPendingVerification, navigate]);
    return (
        <div className="min-h-screen bg-background">
            {/* Minimal top bar - no Navbar since admin is not logged in */}
            <div className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
                <div className="container mx-auto flex items-center justify-between h-16 px-4">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg shadow-inner flex items-center justify-center overflow-hidden">
                            <img src="/altrium.jpg" alt="Altrium" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-semibold text-lg tracking-tight">Altrium</span>
                    </Link>
                    <Link
                        to="/login?role=ADMIN"
                        className="px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                    >
                        Login
                    </Link>
                </div>
            </div>

            <div className="pt-24 pb-20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <ScrollReveal>
                        <div className="w-full bg-card border rounded-2xl p-8 mb-16 shadow-xl text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/20 via-accent to-accent/20 animate-pulse" />

                            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6 relative">
                                <Clock className="w-8 h-8 text-accent animate-pulse" />
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-background rounded-full flex items-center justify-center border border-muted">
                                    <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold mb-3">Verification Pending</h2>
                            <p className="text-muted-foreground mb-6 leading-relaxed max-w-2xl mx-auto">
                                Your institution details and proof of affiliation have been submitted securely.
                                Platform administrators are currently reviewing your application. Please log in again after some time to check your approval status.
                            </p>

                            <Link
                                to="/login?role=ADMIN"
                                className="inline-flex justify-center items-center gap-2 py-2 px-6 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted transition active:scale-[0.98]"
                            >
                                <ArrowLeft className="w-4 h-4" /> Return to Login
                            </Link>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal delay={100}>
                        <div className="mb-12 text-center">
                            <div className="inline-flex p-3 rounded-2xl bg-accent/10 text-accent mb-4">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">While you wait: Web3 Setup Guide</h2>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Everything you need to know about setting up MetaMask and managing institutional degree minting on the blockchain once approved.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid gap-8">
                        {/* Step 1: Installation */}
                        <ScrollReveal delay={200}>
                            <div className="p-8 rounded-2xl border bg-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Wallet className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">1</span>
                                        <h3 className="text-xl font-bold">Install MetaMask</h3>
                                    </div>
                                    <p className="text-muted-foreground mb-6">
                                        MetaMask is a secure crypto wallet and gateway to blockchain apps. You'll need it to sign and approve degree credentials.
                                    </p>
                                    <ul className="space-y-3 mb-6">
                                        <li className="flex items-start gap-3 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                                            <span>Visit <a href="https://metamask.io" target="_blank" rel="noreferrer" className="text-accent hover:underline font-medium inline-flex items-center gap-1">metamask.io <ExternalLink className="w-3 h-3" /></a> and install the browser extension.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                                            <span>Create a new wallet and <b>securely store your Secret Recovery Phrase</b>. Never share this with anyone!</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Step 2: Network Setup */}
                        <ScrollReveal delay={300}>
                            <div className="p-8 rounded-2xl border bg-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Settings className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">2</span>
                                        <h3 className="text-xl font-bold">Switch to Sepolia Testnet</h3>
                                    </div>
                                    <p className="text-muted-foreground mb-6">
                                        Altrium currently operates on the Sepolia Test Network to ensure cost-free verification during our pilot phase.
                                    </p>
                                    <ul className="space-y-3 mb-6">
                                        <li className="flex items-start gap-3 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                                            <span>Open MetaMask and click the network selector (top-left).</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                                            <span>Toggle <b>"Show test networks"</b> and select <b>Sepolia</b>.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Step 3: Getting Funds */}
                        <ScrollReveal delay={400}>
                            <div className="p-8 rounded-2xl border bg-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Coins className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">3</span>
                                        <h3 className="text-xl font-bold">Get Test ETH</h3>
                                    </div>
                                    <p className="text-muted-foreground mb-6">
                                        Transactions on the blockchain require "Gas" fees. On Sepolia, you can get free test ETH from faucets.
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                                        <a
                                            href="https://sepoliafaucet.com/"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors group/link"
                                        >
                                            <span className="font-medium">Alchemy Faucet</span>
                                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover/link:text-accent" />
                                        </a>
                                        <a
                                            href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors group/link"
                                        >
                                            <span className="font-medium">Google Faucet</span>
                                            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover/link:text-accent" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Step 4: Minting Flow */}
                        <ScrollReveal delay={500}>
                            <div className="p-8 rounded-2xl border bg-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <MousePointer2 className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">4</span>
                                        <h3 className="text-xl font-bold">The Minting Flow</h3>
                                    </div>
                                    <p className="text-muted-foreground mb-6">
                                        Once your wallet is set up and funded, verifying a degree is as simple as a few clicks.
                                    </p>
                                    <div className="space-y-4">
                                        <div className="flex gap-4 p-4 rounded-xl bg-muted/20">
                                            <div className="font-bold text-accent">A</div>
                                            <p className="text-sm">Click <b>"Mint & Approve"</b> on a student's submission in your dashboard.</p>
                                        </div>
                                        <div className="flex gap-4 p-4 rounded-xl bg-muted/20">
                                            <div className="font-bold text-accent">B</div>
                                            <p className="text-sm">MetaMask will pop up. Review the transaction and click <b>"Confirm"</b>.</p>
                                        </div>
                                        <div className="flex gap-4 p-4 rounded-xl bg-muted/20">
                                            <div className="font-bold text-accent">C</div>
                                            <p className="text-sm">Wait for the transaction to complete. The student will receive their Soulbound Token (SBT) instantly.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>
            </div>
        </div>
    );
}
