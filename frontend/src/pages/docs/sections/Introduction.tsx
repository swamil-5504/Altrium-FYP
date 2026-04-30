import { DocPage, Sub, palette, Ul, InfoCard } from "../_shared";
import { useDocsContent } from "../content";

const Introduction = () => {
  const page = useDocsContent().pages.introduction;

  return (
    <DocPage kicker={page.kicker} title={page.title} summary={page.summary}>
      <Sub id="at-a-glance" title={page.sections.atAGlance.title}>
        <div className="grid sm:grid-cols-2 gap-3">
          {page.sections.atAGlance.cards.map(([title, body]) => (
            <InfoCard key={title} title={title} body={body} />
          ))}
        </div>
      </Sub>

      <Sub id="why-blockchain" title={page.sections.whyBlockchain.title}>
        <Ul>
          {page.sections.whyBlockchain.items.map(([lead, body]) => (
            <li key={lead}>
              <strong className={palette.text}>{lead}</strong> {body}
            </li>
          ))}
        </Ul>
      </Sub>

      <Sub id="key-concepts" title={page.sections.keyConcepts.title}>
        <Ul>
          {page.sections.keyConcepts.items.map(([lead, body]) => (
            <li key={lead}>
              <strong className={palette.text}>{lead}</strong> {body}
            </li>
          ))}
        </Ul>
      </Sub>

      <Sub id="who-is-this-for" title={page.sections.whoIsThisFor.title}>
        <Ul>
          {page.sections.whoIsThisFor.items.map(([lead, body]) => (
            <li key={lead}>
              <strong className={palette.text}>{lead}</strong> {body}
            </li>
          ))}
        </Ul>
      </Sub>
    </DocPage>
  );
};

export default Introduction;
