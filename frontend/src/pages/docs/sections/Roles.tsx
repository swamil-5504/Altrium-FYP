import { ShieldCheck, Building2, GraduationCap, Briefcase } from "lucide-react";

import { DocPage, Sub, palette } from "../_shared";
import { useDocsContent } from "../content";

const iconMap = {
  superadmin: ShieldCheck,
  "university-admin": Building2,
  student: GraduationCap,
  employer: Briefcase,
} as const;

const Roles = () => {
  const page = useDocsContent().pages.roles;

  return (
    <DocPage kicker={page.kicker} title={page.title} summary={page.summary}>
      {page.items.map(([id, title, body]) => {
        const Icon = iconMap[id];
        return (
          <Sub key={id} id={id} title={title}>
            <div
              className={`flex gap-3 items-start rounded-xl p-4 border ${palette.border} ${palette.panel}`}
            >
              <div
                className={`h-9 w-9 shrink-0 rounded-lg ${palette.accentSoft} flex items-center justify-center`}
              >
                <Icon className={`h-4 w-4 ${palette.accent}`} />
              </div>
              <p className="pt-1">{body}</p>
            </div>
          </Sub>
        );
      })}
    </DocPage>
  );
};

export default Roles;
