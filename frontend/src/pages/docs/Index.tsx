import { Link } from "react-router-dom";
import { ArrowRight, Rocket, Code2, Blocks, Shield, ShieldCheck, Sparkles } from "lucide-react";

import { DocPage, palette, DOC_GROUPS } from "./_shared";

const HIGHLIGHTS = [
  { icon: Rocket, title: "Quickstart", to: "/docs/quickstart", body: "Spin up the full stack in 15 minutes with Docker." },
  { icon: Code2, title: "API Reference", to: "/docs/api-reference", body: "Every REST endpoint, auth requirements, and rate limits." },
  { icon: Blocks, title: "Smart Contracts", to: "/docs/smart-contracts", body: "Registry & SBT ABI surface, deployment workflow." },
  { icon: Shield, title: "Security", to: "/docs/security", body: "Auth, RBAC, PDF validation, transport hardening." },
];

const DocsIndex = () => (
  <DocPage
    kicker="Documentation"
    title="Build, run, and integrate Altrium."
    summary="Altrium is a full-stack platform for issuing tamper-proof academic credentials as Soulbound Tokens on Ethereum. These docs walk you through the whole thing — from the first docker compose up to minting a degree, verifying it as an employer, and extending the API."
  >
    {/* Highlight grid */}
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

    {/* Section index */}
    <div className="mt-8">
      <div className={`text-[11px] uppercase tracking-[0.14em] ${palette.textMuted} font-semibold mb-3`}>
        Browse by area
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
                    Coming soon
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

    {/* CTA */}
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
            Ready to verify a credential?
          </h3>
          <p className={`mt-1 text-[13.5px] ${palette.textMuted}`}>
            Employers can look up any Altrium-issued degree by PRN — no account required.
          </p>
        </div>
        <Link
          to="/verify"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${palette.accentBg} text-white text-[13.5px] font-medium hover:opacity-90 transition-opacity`}
        >
          Go to /verify
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  </DocPage>
);

export default DocsIndex;
