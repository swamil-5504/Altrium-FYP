import { DocPage, Sub, palette, Ul, InfoCard } from "../_shared";

const Introduction = () => (
  <DocPage
    kicker="Introduction"
    title="What is Altrium?"
    summary="A full-stack, blockchain-powered degree-verification platform. Universities issue tamper-proof academic credentials as Soulbound Tokens (SBTs) on Ethereum Sepolia; employers verify them in seconds — no intermediaries, no forgeries, no phone calls."
  >
    <Sub id="at-a-glance" title="At a glance">
      <div className="grid sm:grid-cols-2 gap-3">
        <InfoCard title="Frontend" body="React 18 + TypeScript, Vite, Tailwind, Reown AppKit, ethers v6." />
        <InfoCard title="Backend" body="FastAPI (async), Pydantic v2, Beanie ODM on MongoDB." />
        <InfoCard title="Blockchain" body="Solidity 0.8.x, Foundry, OpenZeppelin, Sepolia testnet." />
        <InfoCard title="Infra" body="Docker Compose — one command boots mongo, backend, frontend." />
      </div>
    </Sub>

    <Sub id="why-blockchain" title="Why blockchain credentials?">
      <Ul>
        <li>
          <strong className={palette.text}>Immutable provenance.</strong> Once
          minted, a degree record cannot be silently edited or erased.
        </li>
        <li>
          <strong className={palette.text}>Non-transferable (soulbound).</strong>{" "}
          SBTs cannot be sold or gifted — a credential always belongs to the
          original student.
        </li>
        <li>
          <strong className={palette.text}>Public verifiability.</strong> Any
          employer can check a credential without a login by querying the
          public API or reading the chain.
        </li>
        <li>
          <strong className={palette.text}>Revocable by issuer.</strong> The
          issuing university can revoke a degree on-chain if issued in error —
          the audit trail is preserved.
        </li>
      </Ul>
    </Sub>

    <Sub id="key-concepts" title="Key concepts">
      <Ul>
        <li>
          <strong className={palette.text}>PRN (Permanent Registration Number)</strong> — canonical student identifier. Employers verify by PRN.
        </li>
        <li>
          <strong className={palette.text}>SBT</strong> — Soulbound Token. An ERC-721-style credential with transfer disabled.
        </li>
        <li>
          <strong className={palette.text}>UNIVERSITY_ROLE</strong> — on-chain role granted by the Registry. Only holders can mint degrees.
        </li>
        <li>
          <strong className={palette.text}>Verified Admin</strong> — a University Admin whose off-chain identity has been approved by the Super Admin.
        </li>
      </Ul>
    </Sub>

    <Sub id="who-is-this-for" title="Who are these docs for?">
      <Ul>
        <li><strong className={palette.text}>Operators</strong> deploying Altrium for a university or consortium.</li>
        <li><strong className={palette.text}>Integrators</strong> wiring the public verification endpoint into HR or ATS tooling.</li>
        <li><strong className={palette.text}>Contributors</strong> extending the contracts, backend, or UI.</li>
        <li><strong className={palette.text}>Auditors</strong> reviewing the security posture before production use.</li>
      </Ul>
    </Sub>
  </DocPage>
);

export default Introduction;
