import { Link } from "react-router-dom";
import { Blocks, GraduationCap, Building2, Search, ExternalLink, Github, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card">
      {/* Main footer grid */}
      <div className="container mx-auto px-4 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand column */}
          <div className="md:col-span-2 flex flex-col gap-5">
            <Link to="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-8 h-8 rounded-lg shadow-inner flex items-center justify-center overflow-hidden">
                {/* Light mode logo */}
                <img src="/altrium_light.png" alt="Altrium" className="w-full h-full object-cover block dark:hidden" />
                {/* Dark mode logo */}
                <img src="/altrium_dark.png" alt="Altrium" className="w-full h-full object-cover hidden dark:block" />
              </div>
              <span className="font-bold text-lg tracking-tight">Altrium</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Product column */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("footer.platform")}</p>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  to="/student"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-accent/70 group-hover:text-accent transition-colors" />
                  {t("footer.studentPortal")}
                </Link>
              </li>
              <li>
                <Link
                  to="/login?role=ADMIN"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <Building2 className="w-3.5 h-3.5 text-accent/70 group-hover:text-accent transition-colors" />
                  {t("footer.universityAdmin")}
                </Link>
              </li>
              <li>
                <Link
                  to="/verify"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <Search className="w-3.5 h-3.5 text-accent/70 group-hover:text-accent transition-colors" />
                  {t("footer.verifyDegree")}
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <Shield className="w-3.5 h-3.5 text-accent/70 group-hover:text-accent transition-colors" />
                  {t("footer.registerInstitution")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources column */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("footer.resources")}</p>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href="https://sepolia.etherscan.io"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  aria-label={t("footer.aria.sepolia")}
                >
                  <Blocks className="w-3.5 h-3.5 text-accent/70 group-hover:text-accent transition-colors" />
                  {t("footer.sepolia")}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a
                  href="https://metamask.io"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  aria-label={t("footer.aria.metamask")}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-accent/70 group-hover:text-accent transition-colors" />
                  {t("footer.metamask")}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/swamil-5504/Altrium-FYP"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                  aria-label={t("footer.aria.github")}
                >
                  <Github className="w-3.5 h-3.5 text-accent/70 group-hover:text-accent transition-colors" />
                  {t("footer.github")}
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>

            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {t("footer.copyright", { year: currentYear })}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Blocks className="w-3 h-3 text-accent" />
            <span>{t("footer.bottomLine")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
