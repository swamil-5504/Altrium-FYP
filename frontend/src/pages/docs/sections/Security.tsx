import { DocPage, K, Sub, Ul } from "../_shared";

const Security = () => (
  <DocPage
    kicker="Security"
    title="Defense in depth"
    summary="Altrium layers authentication, authorisation, upload hygiene, and strict transport headers. The on-chain mint is the ultimate integrity anchor — the backend cannot silently forge credentials."
  >
    <Sub id="security-model" title="Security model">
      <Ul>
        <li>Every mutating endpoint requires a valid JWT and passes through an RBAC dependency.</li>
        <li>The on-chain mint is the source of truth — a compromised backend cannot forge a credential without also holding <K>UNIVERSITY_ROLE</K>.</li>
        <li>Uploads are content-sniffed, magic-byte-validated, and size-capped before touching disk.</li>
        <li>Strict security headers (CSP, X-Frame-Options, Referrer-Policy, HSTS) applied via middleware.</li>
      </Ul>
    </Sub>

    <Sub id="jwt-and-sessions" title="JWT & sessions">
      <p>
        HS256, 30-minute access tokens, 7-day refresh tokens. Logout persists
        both JWTs into the <K>BlacklistedToken</K> collection until each
        token's real <K>exp</K>; the MongoDB TTL index reaps them
        automatically.
      </p>
    </Sub>

    <Sub id="rbac" title="RBAC">
      <p>Five FastAPI dependencies enforce role checks:</p>
      <Ul>
        <li><K>get_current_user</K> — any authenticated user</li>
        <li><K>require_role(UserRole.X)</K> — exact role match</li>
        <li><K>require_verified_admin</K> — role=ADMIN + <K>is_legal_admin_verified</K></li>
        <li><K>require_admin_with_wallet</K> — verified admin + a wallet on file</li>
        <li>Superadmin checks use <K>require_role(SUPERADMIN)</K></li>
      </Ul>
    </Sub>

    <Sub id="pdf-validation" title="PDF validation">
      <p><K>app/services/pdf_validation.py</K> enforces:</p>
      <Ul>
        <li>Exact magic-byte prefix <K>%PDF-</K></li>
        <li>Maximum file size (default 10 MB)</li>
        <li>MIME header must be <K>application/pdf</K></li>
        <li>Stripped metadata on download for student-facing copies</li>
      </Ul>
    </Sub>

    <Sub id="rate-limits" title="Rate limits">
      <p>
        Per-IP rate limits are applied via <K>slowapi</K> on sensitive routes.
        See the <a href="/docs/api-reference#errors-and-limits" className="underline">API reference</a> for the full table.
      </p>
    </Sub>
  </DocPage>
);

export default Security;
