import { CodeBlock, DocPage, InfoCard, Sub } from "../_shared";

const Architecture = () => (
  <DocPage
    kicker="Architecture"
    title="How Altrium fits together"
    summary="Four layers — React frontend, FastAPI backend, MongoDB store, Solidity contracts — cooperate over a single REST interface and a pair of on-chain contracts."
  >
    <Sub id="stack-overview" title="Stack overview">
      <div className="grid sm:grid-cols-2 gap-3">
        <InfoCard title="Frontend" body="React 18 + TypeScript, Vite, Tailwind, Reown AppKit, ethers v6." />
        <InfoCard title="Backend" body="FastAPI (async), Pydantic v2, Beanie ODM, slowapi rate limiting." />
        <InfoCard title="Database" body="MongoDB 6 (document store, TTL index for blacklisted tokens)." />
        <InfoCard title="Auth" body="JWT access + refresh tokens, bcrypt password hashing, RBAC." />
        <InfoCard title="Blockchain" body="Solidity 0.8.x, Foundry, OpenZeppelin AccessControl, Sepolia." />
        <InfoCard title="Infra" body="Docker Compose — three services: mongo, backend, frontend." />
      </div>
    </Sub>

    <Sub id="data-model" title="Data model">
      <p>Two primary collections drive the whole domain:</p>
      <CodeBlock
        lang="ts"
        code={`// User
{
  id: UUID,
  email: string,
  password_hash: string,
  role: "SUPERADMIN" | "ADMIN" | "STUDENT",
  full_name: string,
  college_name?: string,         // ADMIN and STUDENT
  prn_number?: string,           // STUDENT only, unique
  wallet_address?: string,       // EIP-55 checksum, EVM-only
  is_legal_admin_verified: boolean,
  verification_document_path?: string,
  created_at: datetime,
  updated_at: datetime,
}

// Credential (degree)
{
  id: UUID,
  student_id: UUID,
  issuing_admin_id?: UUID,
  degree_name: string,
  course: string,
  graduation_year: number,
  grade?: string,
  status: "PENDING" | "APPROVED" | "REJECTED" | "MINTED",
  document_path?: string,
  sbt_token_id?: number,         // set after on-chain mint
  tx_hash?: string,
  revoked: boolean,
  revoked_at?: datetime,
  created_at: datetime,
  updated_at: datetime,
}`}
      />
    </Sub>

    <Sub id="request-flow" title="Request flow — mint a degree">
      <p>
        A mint request traverses all four layers. The React app asks MetaMask
        to sign the on-chain transaction; the backend records the resulting
        hash and token id; the contract emits a <code>DegreeMinted</code>{" "}
        event; any employer can then verify the SBT off the public endpoint or
        by reading the chain directly.
      </p>
      <CodeBlock
        lang="text"
        code={`Browser (React)
   │  1. POST /api/v1/degrees             (student submits)
   ▼
FastAPI ─► MongoDB   (row with status=PENDING)
   │
   │  2. Admin reviews, clicks "Mint"
   ▼
React ─► MetaMask ─► AltriumDegreeSBT.mintDegree()
   │                                │
   │                                ▼
   │                            Sepolia chain (event emitted)
   ▼
PATCH /api/v1/degrees/{id}/status  (status=MINTED, tx_hash, token_id)

Employer: GET /api/v1/degrees/public?prn_number=...   (no auth)`}
      />
    </Sub>

    <Sub id="trust-boundary" title="Trust boundary">
      <p>
        The on-chain mint is the system's source of truth. Even a fully
        compromised backend cannot forge a credential without also holding{" "}
        <code>UNIVERSITY_ROLE</code> on the Registry contract. Conversely, the
        backend is the source of truth for <em>off-chain</em> state — PDF
        documents, pending submissions, and revocation metadata visible to
        employers.
      </p>
    </Sub>
  </DocPage>
);

export default Architecture;
