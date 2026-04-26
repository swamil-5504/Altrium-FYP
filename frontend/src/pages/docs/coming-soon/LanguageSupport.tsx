import { Languages } from "lucide-react";

import { CodeBlock } from "../_shared";
import ComingSoon from "./_ComingSoon";

const LanguageSupport = () => (
  <ComingSoon
    title="Language & Script Support"
    tagline="Full i18n for the app surface plus non-Latin script rendering on issued credentials — so a student's name appears exactly as it does on their government ID."
    intro="Altrium will ship a first-class localisation pipeline: UI strings translated per-locale via ICU message format, locale-aware date and number formatting, and — crucially — proper rendering of Devanagari, Cyrillic, CJK, Arabic, and other non-Latin scripts inside the minted credential PDF and the watermark footer. Right-to-left layouts are supported end-to-end."
    Icon={Languages}
    features={[
      "ICU-based translations for the app shell, dashboards, and error messages.",
      "Per-user locale preference (set during registration, switchable from profile).",
      "Automatic fallback chain — e.g., hi-IN → hi → en — so partial translations never break the UI.",
      "Non-Latin-capable PDF renderer for credentials — Devanagari, Cyrillic, CJK, Arabic, Hebrew.",
      "RTL layout support for Arabic and Hebrew without manual CSS overrides.",
      "Contributor workflow: pull requests against locale JSON files gate-checked by a schema linter.",
    ]}
    plannedApi={
      <CodeBlock
        lang="http"
        code={`# Set a user's preferred locale
PATCH /api/v1/users/me/locale
{ "locale": "hi-IN" }

# Emit a localised credential PDF
GET /api/v1/degrees/{id}/document?locale=ja-JP

# Contributor: list supported locales
GET /api/v1/i18n/locales
-> [ "en", "hi-IN", "ja-JP", "ar-AE", "ru-RU", "zh-CN", … ]`}
      />
    }
  />
);

export default LanguageSupport;
