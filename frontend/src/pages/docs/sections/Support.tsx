import { Link } from "react-router-dom";
import { ChevronRight, FileQuestion } from "lucide-react";

import { DocPage, Sub, Ul, palette } from "../_shared";
import { useDocsContent } from "../content";

const Support = () => {
  const page = useDocsContent().pages.support;

  return (
    <DocPage kicker={page.kicker} title={page.title} summary={page.summary}>
      <Sub id="troubleshooting" title={page.sections.troubleshooting.title}>
        <Ul>
          {page.sections.troubleshooting.items.map(([lead, body]) => (
            <li key={lead}>
              <strong className={palette.text}>{lead}</strong> {body}
            </li>
          ))}
        </Ul>
      </Sub>

      <Sub id="faq" title={page.sections.faq.title}>
        <div className="space-y-3">
          {page.sections.faq.items.map(([q, a]) => (
            <details
              key={q}
              className={`group rounded-xl border ${palette.border} ${palette.panel} overflow-hidden`}
            >
              <summary
                className={`cursor-pointer flex items-center gap-3 px-4 py-3 text-[14px] font-medium ${palette.text} list-none hover:${palette.accentSoft} transition-colors`}
              >
                <FileQuestion className={`h-4 w-4 ${palette.accent} shrink-0`} />
                <span className="flex-1">{q}</span>
                <ChevronRight className={`h-4 w-4 ${palette.textFaint} transition-transform group-open:rotate-90`} />
              </summary>
              <p className={`px-4 pb-4 text-[13.5px] ${palette.textMuted} leading-relaxed`}>{a}</p>
            </details>
          ))}
        </div>
      </Sub>

      <Sub id="contact" title={page.sections.contact.title}>
        <Ul>
          <li>
            {page.sections.contact.items[0]}:{" "}
            <a
              href="https://github.com/swamil-5504/Altrium-FYP/issues"
              target="_blank"
              rel="noreferrer"
              className={`${palette.accent} hover:underline`}
            >
              swamil-5504/Altrium-FYP
            </a>
          </li>
          <li>{page.sections.contact.items[1]}</li>
          <li>
            {page.sections.contact.items[2]}:{" "}
            <Link to="/guide" className={`${palette.accent} hover:underline`}>
              Web3 Guide
            </Link>
          </li>
        </Ul>
      </Sub>
    </DocPage>
  );
};

export default Support;
