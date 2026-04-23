import { ShieldCheck, Building2, GraduationCap, Briefcase } from "lucide-react";

import { DocPage, Sub, palette } from "../_shared";

const ROLES: {
  id: string;
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  body: string;
}[] = [
  {
    id: "superadmin",
    title: "Super Admin",
    Icon: ShieldCheck,
    body:
      "Platform operator. Approves or rejects University Admin registration requests, can delete any user, and is the only role that can flip is_legal_admin_verified. Signs the on-chain grantRole(UNIVERSITY_ROLE, …) transaction once the admin has connected a wallet.",
  },
  {
    id: "university-admin",
    title: "University Admin",
    Icon: Building2,
    body:
      "Represents an issuing institution. Reviews student submissions, connects an EVM wallet via MetaMask (EIP-55 checksum-normalised), and signs the on-chain mint. Can revoke credentials post-issuance.",
  },
  {
    id: "student",
    title: "Student",
    Icon: GraduationCap,
    body:
      "Submits a degree PDF and metadata (course, grade, year) for their registered college. Once the admin mints, the student sees the on-chain token id and transaction hash on their dashboard.",
  },
  {
    id: "employer",
    title: "Employer",
    Icon: Briefcase,
    body:
      "No account required. Enters a student PRN (or email) on /verify and receives an authoritative response including the SBT token id and issuing university.",
  },
];

const Roles = () => (
  <DocPage
    kicker="User Roles"
    title="Who does what"
    summary="Altrium separates on-chain authority (only university wallets can mint) from off-chain identity (the Super Admin controls who becomes a university wallet in the first place). Four roles, each with a bounded surface area."
  >
    {ROLES.map(({ id, title, Icon, body }) => (
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
    ))}
  </DocPage>
);

export default Roles;
