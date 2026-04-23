import { Mail } from "lucide-react";

import { CodeBlock } from "../_shared";
import ComingSoon from "./_ComingSoon";

const EmailService = () => (
  <ComingSoon
    title="Email Service"
    tagline="Transactional notifications and templated mail — from registration confirmations to mint receipts — backed by a pluggable provider."
    intro="Altrium's current flows assume the student and admin are sitting in front of the app. The upcoming Email Service will send signed, branded messages for every key event: registration, approval decisions, mint confirmations with Etherscan links, revocation notices, and password resets. Providers (SES, Postmark, Resend, or SMTP) plug in behind a single interface."
    Icon={Mail}
    features={[
      "Signed, template-driven emails for registration, approval, mint, revoke, and password reset.",
      "Pluggable transport: SES, Postmark, Resend, or raw SMTP via one env flag.",
      "Per-template dark/light renders with the Altrium brand system.",
      "Delivery retries with exponential backoff and a dead-letter queue visible to the Super Admin.",
      "Webhook ingress for bounce/complaint handling — auto-suppress addresses that hard-bounce.",
      "Audit log of every message sent, scoped by user and by event type.",
    ]}
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
  "to_user_id": "…",
  "context": {
    "degree_name": "B.Tech Computer Engineering",
    "tx_hash": "0x…",
    "token_id": 42
  }
}`}
      />
    }
  />
);

export default EmailService;
