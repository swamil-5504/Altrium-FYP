import { Languages } from "lucide-react";

import { CodeBlock } from "../_shared";
import { useDocsContent } from "../content";
import ComingSoon from "./_ComingSoon";

const LanguageSupport = () => {
  const page = useDocsContent().pages.comingSoon.languageSupport;

  return (
    <ComingSoon
      title={page.title}
      tagline={page.tagline}
      intro={page.intro}
      Icon={Languages}
      features={[...page.features]}
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
-> [ "en", "hi-IN", "ja-JP", "ar-AE", "ru-RU", "zh-CN", ... ]`}
        />
      }
    />
  );
};

export default LanguageSupport;
