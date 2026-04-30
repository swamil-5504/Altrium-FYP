import { Mail } from "lucide-react";

import { CodeBlock } from "../_shared";
import { useDocsContent } from "../content";
import ComingSoon from "./_ComingSoon";

const EmailService = () => {
  const page = useDocsContent().pages.comingSoon.emailService;

  return (
    <ComingSoon
      title={page.title}
      tagline={page.tagline}
      intro={page.intro}
      Icon={Mail}
      features={[...page.features]}
      plannedApi={
        <CodeBlock
          lang="http"
          code={`# Admin-facing: preview a template before shipping
GET /api/v1/notifications/templates/degree_minted/preview
Authorization: Bearer <superadmin-jwt>

# Platform event that triggers a send (internal)
POST /api/v1/notifications/dispatch
{
  "event": "degree_minted",
  "to_user_id": "...",
  "context": {
    "degree_name": "B.Tech Computer Engineering",
    "tx_hash": "0x...",
    "token_id": 42
  }
}`}
        />
      }
    />
  );
};

export default EmailService;
