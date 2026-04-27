import { Link } from "react-router-dom";

import { Callout, CodeBlock, DocPage, Ol, Sub, palette } from "../_shared";
import { useDocsContent } from "../content";

const Walkthroughs = () => {
  const page = useDocsContent().pages.walkthroughs;
  const verifyIntroParts = page.sections.employerVerification.intro.split("/verify");

  return (
    <DocPage kicker={page.kicker} title={page.title} summary={page.summary}>
      <Sub id="flow-registration" title={page.sections.registration.title}>
        <Ol>
          {page.sections.registration.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Ol>
      </Sub>

      <Sub id="flow-admin-approval" title={page.sections.adminApproval.title}>
        <Ol>
          {page.sections.adminApproval.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Ol>
      </Sub>

      <Sub id="flow-wallet" title={page.sections.connectWallet.title}>
        <Ol>
          {page.sections.connectWallet.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Ol>
        <Callout>{page.sections.connectWallet.callout}</Callout>
      </Sub>

      <Sub id="flow-submission" title={page.sections.studentSubmission.title}>
        <CodeBlock
          lang="http"
          code={`POST /api/v1/degrees
Authorization: Bearer <student-jwt>
Content-Type: application/json

{
  "degree_name": "Bachelor of Technology",
  "course": "Computer Engineering",
  "graduation_year": 2025,
  "grade": "A+"
}

# then upload the PDF:
POST /api/v1/degrees/{credential_id}/document
Content-Type: multipart/form-data
file=@degree.pdf`}
        />
      </Sub>

      <Sub id="flow-mint" title={page.sections.mintSbt.title}>
        <Ol>
          {page.sections.mintSbt.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </Ol>
      </Sub>

      <Sub id="flow-verify" title={page.sections.employerVerification.title}>
        <p>
          {verifyIntroParts[0]}
          <Link to="/verify" className={`${palette.accent} hover:underline`}>
            /verify
          </Link>
          {verifyIntroParts[1]}
        </p>
        <CodeBlock
          lang="http"
          code={`GET /api/v1/degrees/public?prn_number=BT21CSE001

# Response (200 OK)
[
  {
    "id": "...",
    "degree_name": "Bachelor of Technology",
    "course": "Computer Engineering",
    "graduation_year": 2025,
    "status": "MINTED",
    "sbt_token_id": 42,
    "tx_hash": "0x...",
    "revoked": false
  }
]`}
        />
        <p className="text-[12.5px]">{page.sections.employerVerification.note}</p>
      </Sub>

      <Sub id="flow-revoke" title={page.sections.revokeDegree.title}>
        <p>{page.sections.revokeDegree.body}</p>
      </Sub>
    </DocPage>
  );
};

export default Walkthroughs;
