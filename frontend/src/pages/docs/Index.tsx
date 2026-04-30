import { Link } from "react-router-dom";
import { ArrowRight, Rocket, Code2, Blocks, Shield, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DocPage, palette, getDocGroups } from "./_shared";

const DocsIndex = () => {
  const { t } = useTranslation();
  const DOC_GROUPS = getDocGroups(t);
  const HIGHLIGHTS = [
    { icon: Rocket, title: t("docsUi.links.quickstart.label"), to: "/docs/quickstart", body: t("docsUi.highlights.quickstart") },
    { icon: Code2, title: t("docsUi.links.apiReference.label"), to: "/docs/api-reference", body: t("docsUi.highlights.apiReference") },
    { icon: Blocks, title: t("docsUi.links.smartContracts.label"), to: "/docs/smart-contracts", body: t("docsUi.highlights.smartContracts") },
    { icon: Shield, title: t("docsUi.links.security.label"), to: "/docs/security", body: t("docsUi.highlights.security") },
  ];

  return (
    <DocPage
      kicker={t("docsUi.documentation")}
      title={t("docsUi.indexTitle")}
      summary={t("docsUi.indexSummary")}
    >
      <div className="grid sm:grid-cols-2 gap-3 not-prose">
        {HIGHLIGHTS.map(({ icon: Icon, title, to, body }) => (
          <Link
            key={to}
            to={to}
            className={`group rounded-xl p-5 border ${palette.border} ${palette.panel} hover:${palette.accentBorder} transition-all hover:-translate-y-0.5`}
          >
            <div className={`h-9 w-9 rounded-lg ${palette.accentSoft} flex items-center justify-center mb-3`}>
              <Icon className={`h-4 w-4 ${palette.accent}`} />
            </div>
            <div className={`text-[15px] font-semibold ${palette.text} flex items-center gap-1`}>
              {title}
              <ArrowRight className={`h-3.5 w-3.5 ${palette.textFaint} group-hover:${palette.accent} transition-colors opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5`} />
            </div>
            <div className={`text-[13.5px] ${palette.textMuted} mt-1.5 leading-relaxed`}>{body}</div>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <div className={`text-[11px] uppercase tracking-[0.14em] ${palette.textMuted} font-semibold mb-3`}>
          {t("docsUi.browseByArea")}
        </div>
        <div className="space-y-5">
          {DOC_GROUPS.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.id} className={`rounded-xl border ${palette.border} ${palette.panel} p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`h-4 w-4 ${palette.accent}`} />
                  <h3 className={`text-[15px] font-semibold ${palette.text}`}>{g.label}</h3>
                  {g.id === "coming-soon" && (
                    <span className={`ml-1 inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded ${palette.accentSoft} ${palette.accent} font-medium`}>
                      <Sparkles className="h-3 w-3" />
                      {t("docsUi.comingSoon")}
                    </span>
                  )}
                </div>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {g.links.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        className={`block rounded-lg px-3 py-2 -mx-1 ${palette.textMuted} hover:${palette.panelSoft} hover:${palette.text} transition-colors`}
                      >
                        <div className={`text-[13.5px] font-medium ${palette.text}`}>{l.label}</div>
                        {l.description && (
                          <div className={`text-[12.5px] ${palette.textMuted} mt-0.5 leading-snug`}>
                            {l.description}
                          </div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className={`mt-10 rounded-2xl border ${palette.border} p-6 ${palette.panel} relative overflow-hidden`}
      >
        <div
          className={`absolute -top-16 -right-16 w-48 h-48 rounded-full ${palette.accentSoft} blur-3xl pointer-events-none`}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className={`h-10 w-10 rounded-lg ${palette.accentSoft} flex items-center justify-center shrink-0`}>
            <ShieldCheck className={`h-5 w-5 ${palette.accent}`} />
          </div>
          <div className="flex-1">
            <h3 className={`text-[17px] font-semibold ${palette.text}`}>
              {t("docsUi.readyToVerify")}
            </h3>
            <p className={`mt-1 text-[13.5px] ${palette.textMuted}`}>
              {t("docsUi.verifyCtaDescription")}
            </p>
          </div>
          <Link
            to="/verify"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${palette.accentBg} text-white text-[13.5px] font-medium hover:opacity-90 transition-opacity`}
          >
            {t("docsUi.goToVerify")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </DocPage>
  );
};

export default DocsIndex;
