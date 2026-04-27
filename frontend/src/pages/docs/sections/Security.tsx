import { DocPage, Sub, Ul } from "../_shared";
import { useDocsContent } from "../content";

const Security = () => {
  const page = useDocsContent().pages.security;

  return (
    <DocPage kicker={page.kicker} title={page.title} summary={page.summary}>
      <Sub id="security-model" title={page.sections.securityModel.title}>
        <Ul>
          {page.sections.securityModel.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Ul>
      </Sub>

      <Sub id="jwt-and-sessions" title={page.sections.jwt.title}>
        <p>{page.sections.jwt.body}</p>
      </Sub>

      <Sub id="rbac" title={page.sections.rbac.title}>
        <p>{page.sections.rbac.intro}</p>
        <Ul>
          {page.sections.rbac.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Ul>
      </Sub>

      <Sub id="pdf-validation" title={page.sections.pdfValidation.title}>
        <p>{page.sections.pdfValidation.intro}</p>
        <Ul>
          {page.sections.pdfValidation.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Ul>
      </Sub>

      <Sub id="rate-limits" title={page.sections.rateLimits.title}>
        <p>{page.sections.rateLimits.body}</p>
      </Sub>
    </DocPage>
  );
};

export default Security;
