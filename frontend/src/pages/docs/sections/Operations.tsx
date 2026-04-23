import { DocPage, K, Sub, Ul } from "../_shared";

const Operations = () => (
  <DocPage
    kicker="Operations"
    title="Running Altrium in production"
    summary="What you need to know about environments, logging, and the database once you've moved past localhost."
  >
    <Sub id="environments" title="Environments">
      <p>
        The <K>ENVIRONMENT</K> env var (<K>dev</K>, <K>staging</K>,{" "}
        <K>prod</K>) drives a boot-time guard in <K>app/main.py</K> that
        refuses to start with unsafe combinations (e.g.{" "}
        <K>ALLOW_SELF_SERVE_PASSWORD_RESET=true</K> in prod).
      </p>
    </Sub>

    <Sub id="logs" title="Logs & observability">
      <p>
        Structured JSON logs go to stdout; correlate by <K>request_id</K>{" "}
        (injected by middleware). In production forward them to any logs sink
        (Datadog, CloudWatch, Loki, etc.).
      </p>
    </Sub>

    <Sub id="database" title="Database">
      <p>Indexes created on startup by Beanie:</p>
      <Ul>
        <li><K>User.email</K> — unique</li>
        <li><K>User.prn_number</K> — unique, sparse</li>
        <li><K>Credential.student_id</K></li>
        <li><K>BlacklistedToken.expires_at</K> — TTL</li>
      </Ul>
    </Sub>

    <Sub id="backups" title="Backups">
      <p>
        Because the chain stores the cryptographic anchor for every credential,
        restoring Mongo from a snapshot doesn't rewrite history — the chain
        authoritatively confirms whether a token still exists. Back up the
        uploads directory separately; it holds the original PDFs.
      </p>
    </Sub>
  </DocPage>
);

export default Operations;
