import { CodeBlock, DocPage, Endpoint, Sub, palette } from "../_shared";
import { useDocsContent } from "../content";

const ApiReference = () => {
  const page = useDocsContent().pages.apiReference;

  return (
    <DocPage kicker={page.kicker} title={page.title} summary={page.summary}>
      <Sub id="overview" title={page.sections.overview.title}>
        <p>{page.sections.overview.body}</p>
      </Sub>

      <Sub id="authentication" title={page.sections.authentication.title}>
        <p>{page.sections.authentication.intro}</p>
        <CodeBlock
          lang="http"
          code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
        />
        <p>{page.sections.authentication.body}</p>
      </Sub>

      <Sub id="errors-and-limits" title={page.sections.errors.title}>
        <p>{page.sections.errors.intro}</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {page.sections.errors.codes.map(([k, v]) => (
            <div
              key={k}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${palette.border} ${palette.panel}`}
            >
              <code className={`text-[12px] font-mono ${palette.accent}`}>{k}</code>
              <span className={`text-[13px] ${palette.textMuted}`}>{v}</span>
            </div>
          ))}
        </div>
        <p className="text-[12.5px]">{page.sections.errors.note}</p>
      </Sub>

      <Sub id="auth-endpoints" title={page.sections.authEndpoints.title}>
        {page.sections.authEndpoints.items.map(([method, path, auth, body]) => (
          <Endpoint key={`${method}:${path}`} method={method} path={path} auth={auth}>
            {body}
          </Endpoint>
        ))}
      </Sub>

      <Sub id="users-endpoints" title={page.sections.usersEndpoints.title}>
        {page.sections.usersEndpoints.items.map(([method, path, auth, body]) => (
          <Endpoint key={`${method}:${path}`} method={method} path={path} auth={auth}>
            {body}
          </Endpoint>
        ))}
      </Sub>

      <Sub id="degrees-endpoints" title={page.sections.degreesEndpoints.title}>
        {page.sections.degreesEndpoints.items.map(([method, path, auth, body]) => (
          <Endpoint key={`${method}:${path}`} method={method} path={path} auth={auth}>
            {body}
          </Endpoint>
        ))}
      </Sub>
    </DocPage>
  );
};

export default ApiReference;
