import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";

export default function PendingVerification() {
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
                className="absolute top-8 left-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition z-20"
            >
                <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>

            <div className="w-full max-w-md bg-card border rounded-2xl p-8 surface-elevated z-10 animate-fade-in shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent/20 via-accent to-accent/20 animate-pulse" />

                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6 relative">
                    <Clock className="w-8 h-8 text-accent animate-pulse" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-background rounded-full flex items-center justify-center border border-muted">
                        <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-3">Verification Pending</h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                    Your institution details and proof of affiliation have been submitted securely.
                    Platform administrators are currently reviewing your application.
                </p>

                <div className="p-4 rounded-xl bg-muted/50 border mb-8 text-sm text-left relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
                    <p className="text-foreground font-medium mb-1 pl-2">What happens next?</p>
                    <ul className="text-muted-foreground space-y-2 pl-2">
                        <li>1. Manual verification of your documents</li>
                        <li>2. On-chain instantiation of your University Role</li>
                        <li>3. Full access to your dashboard</li>
                    </ul>
                </div>

                <Link
                    to="/login?role=ADMIN"
                    className="w-full inline-flex justify-center items-center gap-2 py-2.5 rounded-lg border border-border bg-background text-foreground font-medium hover:bg-muted transition active:scale-[0.98]"
                >
                    Return to Login
                </Link>
            </div>
        </div>
    );
}
