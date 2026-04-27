import { DocPage, Sub, Ul } from "../_shared";
import { useDocsContent } from "../content";

const Operations = () => {
  const page = useDocsContent().pages.operations;

  return (
    <DocPage kicker={page.kicker} title={page.title} summary={page.summary}>
      <Sub id="environments" title={page.sections.environments.title}>
        <p>{page.sections.environments.body}</p>
      </Sub>

      <Sub id="logs" title={page.sections.logs.title}>
        <p>{page.sections.logs.body}</p>
      </Sub>

      <Sub id="database" title={page.sections.database.title}>
        <p>{page.sections.database.intro}</p>
        <Ul>
          {page.sections.database.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Ul>
      </Sub>

      <Sub id="backups" title={page.sections.backups.title}>
        <p>{page.sections.backups.body}</p>
      </Sub>
    </DocPage>
  );
};

export default Operations;
