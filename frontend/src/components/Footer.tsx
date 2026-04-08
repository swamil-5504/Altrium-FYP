import { Link } from "react-router-dom";
import { Blocks, GraduationCap, Building2, Search, ExternalLink, Github, Shield } from "lucide-react";

export const Footer = () => (
  <footer className="border-t bg-card py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md flex items-center justify-center overflow-hidden">
            <img src="/altrium.jpg" alt="Altrium" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Altrium. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Blocks className="w-3 h-3 text-accent" />
            <span>Academic Integrity, Anchored on the Blockchain.</span>
          </div>
        </div>
      </div>
  </footer>
);
};
