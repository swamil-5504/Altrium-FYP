import { Link } from "react-router-dom";

import { Callout, CodeBlock, DocPage, K, Ol, Sub, palette } from "../_shared";

const Walkthroughs = () => (
  <DocPage
    kicker="Walkthroughs"
    title="End-to-end flows"
    summary="Concrete, copy-pastable walkthroughs for every major user journey. Each flow lists the exact endpoints and contract calls involved."
  >
    <Sub id="flow-registration" title="Register & onboard">
      <Ol>
        <li>Open <K>/register</K>.</li>
        <li>Pick a role (Student or University Admin).</li>
        <li>Students pick a college from the dropdown populated by <K>GET /api/v1/users/universities</K>.</li>
        <li>Admins additionally upload a verification PDF via <K>POST /api/v1/auth/{`{user_id}`}/verification-document</K>.</li>
        <li>Admins are redirected to <K>/pending-verification</K> until a Super Admin approves them.</li>
      </Ol>
    </Sub>

    <Sub id="flow-admin-approval" title="Admin approval">
      <Ol>
        <li>Super Admin visits <K>/superadmin</K>.</li>
        <li>Opens the pending admin and reviews the PDF.</li>
        <li>Clicks <em>Approve</em> → backend calls <K>POST /api/v1/users/verify-admin/{`{id}`}</K>.</li>
        <li>If the admin already has a wallet connected, the backend also submits <K>grantRole(UNIVERSITY_ROLE, wallet)</K> on-chain.</li>
      </Ol>
    </Sub>

    <Sub id="flow-wallet" title="Connect wallet">
      <Ol>
        <li>Verified admin opens <K>/university</K>.</li>
        <li>Clicks <em>Connect Wallet</em> — Reown AppKit opens MetaMask on Sepolia.</li>
        <li>Frontend PATCHes <K>/api/v1/users/me/wallet</K> with the checksum address.</li>
        <li>Backend persists the address and, if not already granted, calls <K>addUniversity()</K> on the Registry.</li>
      </Ol>
      <Callout>
        Only EVM (0x-prefixed 20-byte hex) wallets are accepted. The schema
        validator rejects Solana, Bitcoin, and Cosmos addresses outright.
      </Callout>
    </Sub>

    <Sub id="flow-submission" title="Student submission">
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

    <Sub id="flow-mint" title="Mint an SBT">
      <Ol>
        <li>Admin reviews submission on <K>/university</K>.</li>
        <li>Clicks <em>Mint</em>. Frontend calls <K>AltriumDegreeSBT.mintDegree(studentWallet, metadataURI)</K> via ethers + MetaMask.</li>
        <li>On success, frontend PATCHes <K>/api/v1/degrees/{`{id}`}/status</K> with <K>status=MINTED</K>, the transaction hash, and the token id.</li>
        <li>Student sees the minted credential on <K>/student</K> with a link to the Sepolia explorer.</li>
      </Ol>
    </Sub>

    <Sub id="flow-verify" title="Employer verification">
      <p>
        Employers do not need to register. They open{" "}
        <Link to="/verify" className={`${palette.accent} hover:underline`}>
          /verify
        </Link>{" "}
        and paste a PRN.
      </p>
      <CodeBlock
        lang="http"
        code={`GET /api/v1/degrees/public?prn_number=BT21CSE001

# Response (200 OK)
[
  {
    "id": "…",
    "degree_name": "Bachelor of Technology",
    "course": "Computer Engineering",
    "graduation_year": 2025,
    "status": "MINTED",
    "sbt_token_id": 42,
    "tx_hash": "0x…",
    "revoked": false
  }
]`}
      />
      <p className="text-[12.5px]">
        Rate-limited to 30 requests/minute per IP to prevent scraping of the student directory.
      </p>
    </Sub>

    <Sub id="flow-revoke" title="Revoke a degree">
      <p>
        If a degree was issued in error, the admin can revoke it from the
        dashboard. This triggers{" "}
        <K>PATCH /api/v1/degrees/{`{id}`}/revoke</K>, which flips{" "}
        <K>revoked=true</K> and (optionally) burns the SBT on-chain. The record
        stays visible to employers, who see the <K>revoked</K> flag clearly.
      </p>
    </Sub>
  </DocPage>
);

export default Walkthroughs;
