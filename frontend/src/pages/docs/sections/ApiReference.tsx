import { CodeBlock, DocPage, Endpoint, K, Sub, palette } from "../_shared";

const ApiReference = () => (
  <DocPage
    kicker="API Reference"
    title="REST over HTTPS"
    summary="Every Altrium endpoint, its role requirements, and its rate limits. Auto-generated OpenAPI docs are served at /docs (Swagger) and /redoc."
  >
    <Sub id="overview" title="Overview">
      <p>
        Base URL: <K>http://localhost:8000</K> in development, your
        production hostname otherwise. All routes are namespaced under{" "}
        <K>/api/v1</K>. Responses are JSON unless the endpoint serves a
        binary (currently only <K>GET /degrees/{`{id}`}/document</K>,
        which streams <K>application/pdf</K>).
      </p>
    </Sub>

    <Sub id="authentication" title="Authentication">
      <p>
        Bearer-token auth. After login, include the access token on every
        protected request:
      </p>
      <CodeBlock
        lang="http"
        code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…`}
      />
      <p>
        Access tokens expire after <K>ACCESS_TOKEN_EXPIRE_MINUTES</K>{" "}
        (default 30). Refresh via <K>POST /api/v1/auth/refresh</K>. On
        logout, both tokens are blacklisted in MongoDB with a TTL index matching
        each token's real <K>exp</K>.
      </p>
    </Sub>

    <Sub id="errors-and-limits" title="Errors & rate limits">
      <p>
        Errors follow FastAPI's convention:{" "}
        <K>{`{ "detail": "Message" }`}</K>.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {[
          ["400", "Validation failed"],
          ["401", "Missing / expired / blacklisted token"],
          ["403", "Role or verification check failed"],
          ["404", "Resource not found"],
          ["409", "Duplicate (e.g. PRN already registered)"],
          ["429", "Rate limited"],
        ].map(([k, v]) => (
          <div
            key={k}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${palette.border} ${palette.panel}`}
          >
            <code className={`text-[12px] font-mono ${palette.accent}`}>{k}</code>
            <span className={`text-[13px] ${palette.textMuted}`}>{v}</span>
          </div>
        ))}
      </div>
      <p className="text-[12.5px]">
        Auth: <K>5/min</K> login, <K>10/min</K> register, <K>30/min</K>{" "}
        refresh. Public verification: <K>30/min</K>. Uploads: <K>20/min</K>.
      </p>
    </Sub>

    <Sub id="auth-endpoints" title="Auth endpoints">
      <Endpoint method="POST" path="/api/v1/auth/register" auth="public · 10/min">
        Creates a user. Body: <K>{`{ email, password, full_name, role, college_name?, prn_number? }`}</K>.
      </Endpoint>
      <Endpoint method="POST" path="/api/v1/auth/login" auth="public · 5/min">
        Returns <K>{`{ access_token, refresh_token, token_type }`}</K>.
      </Endpoint>
      <Endpoint method="POST" path="/api/v1/auth/refresh" auth="public · 30/min">
        Body: <K>{`{ refresh_token }`}</K>. Returns a new token pair.
      </Endpoint>
      <Endpoint method="POST" path="/api/v1/auth/forgot-password" auth="dev-only · 5/min">
        Disabled in production. Always returns 204 to avoid account enumeration.
      </Endpoint>
      <Endpoint method="POST" path="/api/v1/auth/change-password" auth="Bearer · 10/min">
        Body: <K>{`{ old_password, new_password }`}</K>. 204 on success.
      </Endpoint>
      <Endpoint
        method="POST"
        path="/api/v1/auth/{user_id}/verification-document"
        auth="Bearer · 20/min"
      >
        Multipart upload of the admin verification PDF. Caller must be the user themselves or a Super Admin.
      </Endpoint>
      <Endpoint method="POST" path="/api/v1/auth/logout" auth="Bearer">
        Blacklists the access token from the header and the refresh token from the body.
      </Endpoint>
    </Sub>

    <Sub id="users-endpoints" title="Users endpoints">
      <Endpoint method="GET" path="/api/v1/users/universities" auth="public">
        Unique list of college names with at least one verified admin.
      </Endpoint>
      <Endpoint method="GET" path="/api/v1/users/me" auth="Bearer">
        Returns the current user's profile.
      </Endpoint>
      <Endpoint method="GET" path="/api/v1/users/" auth="Verified admin">
        Returns every user. Used by the admin dashboard.
      </Endpoint>
      <Endpoint method="POST" path="/api/v1/users/verify-admin/{user_id}" auth="Super Admin">
        Flips <K>is_legal_admin_verified=true</K> and grants <K>UNIVERSITY_ROLE</K> on-chain if a wallet is connected.
      </Endpoint>
      <Endpoint method="PATCH" path="/api/v1/users/me/wallet" auth="Verified admin">
        Body: <K>{`{ wallet_address }`}</K>. Checksum-normalised and pushed to the Registry via <K>addUniversity()</K>.
      </Endpoint>
      <Endpoint method="GET" path="/api/v1/users/my-students" auth="Verified admin">
        Returns every student enrolled in the admin's college.
      </Endpoint>
      <Endpoint method="DELETE" path="/api/v1/users/{user_id}" auth="Super Admin">
        Hard-deletes a user. Returns 204.
      </Endpoint>
    </Sub>

    <Sub id="degrees-endpoints" title="Degrees endpoints">
      <Endpoint method="POST" path="/api/v1/degrees/" auth="Student">
        Create a submission (status starts at <K>PENDING</K>).
      </Endpoint>
      <Endpoint method="GET" path="/api/v1/degrees/" auth="Bearer">
        List credentials scoped to the caller — students see theirs, admins see their college's, superadmin sees all.
      </Endpoint>
      <Endpoint method="GET" path="/api/v1/degrees/public" auth="public · 30/min">
        Query param: <K>prn_number</K>. No auth — the employer path.
      </Endpoint>
      <Endpoint method="GET" path="/api/v1/degrees/{credential_id}" auth="Bearer">
        Single credential, permission-scoped like the list endpoint.
      </Endpoint>
      <Endpoint method="PATCH" path="/api/v1/degrees/{credential_id}/status" auth="Admin + wallet">
        Body: new <K>CredentialStatus</K>. Used after the on-chain mint succeeds.
      </Endpoint>
      <Endpoint method="PATCH" path="/api/v1/degrees/{credential_id}" auth="Admin + wallet">
        Update fields (e.g., <K>tx_hash</K>, <K>sbt_token_id</K>).
      </Endpoint>
      <Endpoint method="DELETE" path="/api/v1/degrees/{credential_id}" auth="Admin + wallet">
        Hard-delete a credential.
      </Endpoint>
      <Endpoint method="PATCH" path="/api/v1/degrees/{credential_id}/revoke" auth="Admin + wallet">
        Mark an issued credential as revoked.
      </Endpoint>
      <Endpoint method="POST" path="/api/v1/degrees/{credential_id}/reset" auth="Admin + wallet">
        Reset a submission to <K>PENDING</K> after an on-chain burn (test phase).
      </Endpoint>
      <Endpoint method="POST" path="/api/v1/degrees/{credential_id}/document" auth="Bearer · 20/min">
        Multipart upload of the degree PDF. Only the owning student or their admin can upload.
      </Endpoint>
      <Endpoint method="GET" path="/api/v1/degrees/{credential_id}/document" auth="Bearer">
        Streams the PDF with an on-chain-audit footer watermark applied when permitted.
      </Endpoint>
    </Sub>
  </DocPage>
);

export default ApiReference;
