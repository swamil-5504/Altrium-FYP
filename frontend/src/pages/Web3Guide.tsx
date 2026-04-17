import React from "react";
import { Navbar } from "@/components/Navbar";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Shield, ExternalLink, MousePointer2, Wallet, Coins, Settings, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Web3Guide: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="pt-24 pb-20">
                <div className="container mx-auto px-4 max-w-4xl relative">
                    <button
                        onClick={() => navigate('/university')}
                        className="absolute top-0 right-4 md:right-0 p-2 z-50 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        aria-label="Close guide"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <ScrollReveal>
                        <div className="mb-12 text-center mt-6">
                            <div className="inline-flex p-3 rounded-2xl bg-accent/10 text-accent mb-4">
                                <Shield className="w-8 h-8" />
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">Web3 Onboarding Guide</h1>
                            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                Everything you need to know about setting up MetaMask and managing institutional degree minting on the blockchain.
                            </p>
                        </div>
                    </ScrollReveal>

                    <div className="grid gap-8">
                        {/* Step 1: Installation */}
                        <ScrollReveal delay={100}>
                            <div className="p-8 rounded-2xl border bg-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Wallet className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">1</span>
                                        <h2 className="text-xl font-bold">Install MetaMask</h2>
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
                        <ScrollReveal delay={200}>
                            <div className="p-8 rounded-2xl border bg-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Settings className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">2</span>
                                        <h2 className="text-xl font-bold">Switch to Sepolia Testnet</h2>
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
                        <ScrollReveal delay={300}>
                            <div className="p-8 rounded-2xl border bg-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Coins className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">3</span>
                                        <h2 className="text-xl font-bold">Get Test ETH</h2>
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
                        <ScrollReveal delay={400}>
                            <div className="p-8 rounded-2xl border bg-card relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <MousePointer2 className="w-32 h-32" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">4</span>
                                        <h2 className="text-xl font-bold">The Minting Flow</h2>
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
};

export default Web3Guide;
