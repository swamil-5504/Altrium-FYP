import { CodeBlock, DocPage, InfoCard, Sub } from "../_shared";
import { useDocsContent } from "../content";

const Architecture = () => {
  const page = useDocsContent().pages.architecture;

  return (
    <DocPage kicker={page.kicker} title={page.title} summary={page.summary}>
      <Sub id="stack-overview" title={page.sections.stackOverview.title}>
        <div className="grid sm:grid-cols-2 gap-3">
          {page.sections.stackOverview.cards.map(([title, body]) => (
            <InfoCard key={title} title={title} body={body} />
          ))}
        </div>
      </Sub>

      <Sub id="data-model" title={page.sections.dataModel.title}>
        <p>{page.sections.dataModel.intro}</p>
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

      <Sub id="request-flow" title={page.sections.requestFlow.title}>
        <p>{page.sections.requestFlow.body}</p>
        <CodeBlock
          lang="text"
          code={`Browser (React)
   |  1. POST /api/v1/degrees             (student submits)
   v
FastAPI -> MongoDB   (row with status=PENDING)
   |
   |  2. Admin reviews, clicks "Mint"
   v
React -> MetaMask -> AltriumDegreeSBT.mintDegree()
   |                                |
   |                                v
   |                            Sepolia chain (event emitted)
   v
PATCH /api/v1/degrees/{id}/status  (status=MINTED, tx_hash, token_id)

Employer: GET /api/v1/degrees/public?prn_number=...   (no auth)`}
        />
      </Sub>

      <Sub id="trust-boundary" title={page.sections.trustBoundary.title}>
        <p>{page.sections.trustBoundary.body}</p>
      </Sub>
    </DocPage>
  );
};

export default Architecture;
