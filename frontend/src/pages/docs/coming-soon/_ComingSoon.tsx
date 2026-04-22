import { Link } from "react-router-dom";
import { ArrowRight, Bell, Sparkles } from "lucide-react";

import { DocPage, Sub, palette, Ul } from "../_shared";

type Props = {
  kicker?: string;
  title: string;
  tagline: string;
  intro: string;
  Icon: React.ComponentType<{ className?: string }>;
  features: string[];
  plannedApi?: React.ReactNode;
  eta?: string;
};

const ComingSoon = ({ kicker = "Coming soon", title, tagline, intro, Icon, features, plannedApi, eta = "Planned for the next major release." }: Props) => (
  <DocPage kicker={kicker} title={title} summary={tagline}>
    {/* Hero card */}
    <div
      className={`relative overflow-hidden rounded-2xl border ${palette.border} ${palette.panel} p-6`}
    >
      <div
        className={`absolute -top-20 -right-20 w-56 h-56 rounded-full ${palette.accentSoft} blur-3xl pointer-events-none`}
      />
      <div className="relative flex items-start gap-4">
        <div
          className={`h-12 w-12 shrink-0 rounded-xl ${palette.accentSoft} flex items-center justify-center`}
        >
          <Icon className={`h-5 w-5 ${palette.accent}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-[10.5px] uppercase tracking-wider px-2 py-0.5 rounded-md ${palette.accentSoft} ${palette.accent} font-semibold`}
            >
              <Sparkles className="h-3 w-3" />
              Not yet shipped
            </span>
            <span className={`text-[11.5px] ${palette.textFaint}`}>{eta}</span>
          </div>
          <p className={`mt-3 text-[14.5px] ${palette.textMuted} leading-[1.7]`}>{intro}</p>
        </div>
      </div>
    </div>

    <Sub id="whats-planned" title="What's planned">
      <Ul>
        {features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </Ul>
    </Sub>

    {plannedApi && (
      <Sub id="planned-api" title="Planned API surface">
        {plannedApi}
      </Sub>
    )}

    <Sub id="stay-in-the-loop" title="Stay in the loop">
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border ${palette.border} ${palette.panel} p-4`}
      >
        <Bell className={`h-4 w-4 ${palette.accent}`} />
        <p className="flex-1 text-[13.5px]">
          Follow progress on{" "}
          <a
            href="https://github.com/swamil-5504/Altrium-FYP"
            target="_blank"
            rel="noreferrer"
            className={`${palette.accent} hover:underline`}
          >
            GitHub
          </a>{" "}
          — milestones and changelog entries land there first.
        </p>
        <Link
          to="/docs"
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12.5px] font-medium ${palette.accentBg} text-white hover:opacity-90 transition-opacity`}
        >
          Back to docs home
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Sub>
  </DocPage>
);

export default ComingSoon;
