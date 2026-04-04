import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="border-t bg-card py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold">Altrium</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/student" className="hover:text-foreground transition-colors">Student</Link>
          <Link to="/university" className="hover:text-foreground transition-colors">University</Link>
          <Link to="/verify" className="hover:text-foreground transition-colors">Verify</Link>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 Altrium. Powered by Blockchain.
        </p>
      </div>
    </div>
  </footer>
);
