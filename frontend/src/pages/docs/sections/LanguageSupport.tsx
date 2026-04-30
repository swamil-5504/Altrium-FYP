import { DocPage, K, Sub, Ul, CodeBlock } from "../_shared";

const LanguageSupport = () => (
  <DocPage
    kicker="Platform ops"
    title="Language & Script Support"
    summary="Altrium supports full UI localisation with English, Hindi (हिन्दी), and Marathi (मराठी) — switchable at runtime from the navbar."
  >
    <Sub id="overview" title="Overview">
      <p>
        Altrium ships with a first-class internationalisation (i18n) pipeline powered by{" "}
        <strong>i18next</strong> and <strong>react-i18next</strong>. Every user-facing string in the
        application — navbar, footer, dashboards, forms, toasts, and the entire documentation site —
        is translated and loaded from structured JSON locale bundles.
      </p>
    </Sub>

    <Sub id="supported-languages" title="Supported Languages">
      <Ul>
        <li><strong>English</strong> — Default fallback language.</li>
        <li><strong>हिन्दी (Hindi)</strong> — Full UI translation.</li>
        <li><strong>मराठी (Marathi)</strong> — Full UI translation.</li>
      </Ul>
      <p className="mt-3">
        Users can switch languages at any time using the <strong>language selector</strong> in the
        top navbar. The selection is persisted in <K>localStorage</K> under the key{" "}
        <K>app-language</K> and automatically restored on the next visit.
      </p>
    </Sub>

    <Sub id="how-it-works" title="How It Works">
      <p>
        The i18n system is initialised in <K>src/i18n/config.ts</K> and uses browser-based
        language detection with a localStorage fallback chain:
      </p>
      <CodeBlock
        lang="text"
        code={`Detection order:  localStorage → navigator
Fallback:         en (English)
Storage key:      app-language`}
      />
      <p className="mt-3">
        All locale bundles live in <K>src/locales/</K> as flat JSON files:
      </p>
      <Ul>
        <li><K>en.json</K> — English strings (~370 keys)</li>
        <li><K>hi.json</K> — Hindi strings (~370 keys)</li>
        <li><K>mr.json</K> — Marathi strings (~370 keys)</li>
      </Ul>
    </Sub>

    <Sub id="adding-a-language" title="Adding a New Language">
      <p>To add a new language (e.g. Gujarati):</p>
      <Ul>
        <li>Copy <K>src/locales/en.json</K> to <K>src/locales/gu.json</K> and translate all values.</li>
        <li>Import the new bundle in <K>src/i18n/config.ts</K> and add it to the <K>resources</K> object.</li>
        <li>Add the language option to the navbar language selector component.</li>
      </Ul>
      <CodeBlock
        lang="typescript"
        code={`// src/i18n/config.ts
import gu from '@/locales/gu.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
  gu: { translation: gu },  // ← new
};`}
      />
    </Sub>

    <Sub id="transliteration" title="Transliteration Convention">
      <p>
        For technical terms that don't have a natural Hindi/Marathi equivalent (like "Quickstart",
        "Dashboard", "Blockchain"), we transliterate the English word into Devanagari script. For
        example:
      </p>
      <Ul>
        <li><strong>Quickstart</strong> → क्विकस्टार्ट</li>
        <li><strong>Dashboard</strong> → डॅशबोर्ड</li>
        <li><strong>Blockchain</strong> → ब्लॉकचेन</li>
        <li><strong>Telegram Bot</strong> → टेलिग्राम बॉट</li>
      </Ul>
      <p className="mt-3">
        This ensures consistency across translations and avoids mixing Roman and Devanagari
        scripts within the same sentence.
      </p>
    </Sub>

    <Sub id="coverage" title="Translation Coverage">
      <p>
        Every section of the application uses <K>useTranslation()</K> from react-i18next. The
        following areas are fully translated:
      </p>
      <Ul>
        <li>Navbar & Footer</li>
        <li>Login & Registration forms</li>
        <li>Student Dashboard (submissions, forms, toasts)</li>
        <li>University Admin Dashboard (tables, actions, toasts)</li>
        <li>Superadmin Dashboard (overview, tabs, actions)</li>
        <li>Documentation site (sidebar, index, all content pages)</li>
        <li>Error messages & validation feedback</li>
      </Ul>
    </Sub>
  </DocPage>
);

export default LanguageSupport;
