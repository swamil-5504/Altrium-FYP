import { Link } from "react-router-dom";
import { ChevronRight, FileQuestion } from "lucide-react";

import { DocPage, K, Sub, Ul, palette } from "../_shared";

const FAQ: [string, string][] = [
  ["Does the employer need a wallet?", "No. Verification is a plain HTTP GET — no keys, no login."],
  ["Can a student sell or transfer their SBT?", "No. Transfers revert at the contract level — that's what makes it soulbound."],
  ["What chain is this on?", "Sepolia testnet. The architecture is chain-agnostic; switching to Polygon or an L2 only requires redeploying the two contracts and updating the env vars."],
  ["How is personal data handled?", "Only the minimum — name, email, PRN, college, and the degree PDF. Nothing is written on-chain except an opaque metadata URI and the student wallet."],
  ["Is the API stable?", "The /api/v1 prefix signals the current major. Breaking changes will move to /api/v2 with at least one minor overlap."],
];

const Support = () => (
  <DocPage
    kicker="Support"
    title="Get unstuck"
    summary="Troubleshooting for the most common issues, an FAQ, and the channels where you can get help."
  >
    <Sub id="troubleshooting" title="Troubleshooting">
      <Ul>
        <li><strong className={palette.text}>MetaMask stuck on wrong network.</strong> Ensure you're on Sepolia (chain id <K>0xaa36a7</K>). The app requests a network switch on connect.</li>
        <li><strong className={palette.text}>Mint transaction reverts.</strong> The admin wallet likely lacks <K>UNIVERSITY_ROLE</K>. Super Admin must re-approve, or the deployer wallet must call <K>addUniversity()</K> manually.</li>
        <li><strong className={palette.text}>401 on every request.</strong> Token expired. Call <K>/api/v1/auth/refresh</K> or log in again.</li>
        <li><strong className={palette.text}>Upload rejected.</strong> File is either non-PDF, corrupted, or &gt; 10 MB.</li>
        <li><strong className={palette.text}>Docker port in use.</strong> Stop local Mongo/Vite/Uvicorn or edit <K>docker-compose.yml</K>.</li>
      </Ul>
    </Sub>

    <Sub id="faq" title="FAQ">
      <div className="space-y-3">
        {FAQ.map(([q, a]) => (
          <details
            key={q}
            className={`group rounded-xl border ${palette.border} ${palette.panel} overflow-hidden`}
          >
            <summary
              className={`cursor-pointer flex items-center gap-3 px-4 py-3 text-[14px] font-medium ${palette.text} list-none hover:${palette.accentSoft} transition-colors`}
            >
              <FileQuestion className={`h-4 w-4 ${palette.accent} shrink-0`} />
              <span className="flex-1">{q}</span>
              <ChevronRight className={`h-4 w-4 ${palette.textFaint} transition-transform group-open:rotate-90`} />
            </summary>
            <p className={`px-4 pb-4 text-[13.5px] ${palette.textMuted} leading-relaxed`}>{a}</p>
          </details>
        ))}
      </div>
    </Sub>

    <Sub id="contact" title="Contact & community">
      <Ul>
        <li>
          GitHub issues:{" "}
          <a
            href="https://github.com/swamil-5504/Altrium-FYP/issues"
            target="_blank"
            rel="noreferrer"
            className={`${palette.accent} hover:underline`}
          >
            swamil-5504/Altrium-FYP
          </a>
        </li>
        <li>Security reports: email the maintainers rather than opening a public issue.</li>
        <li>
          Web3 help:{" "}
          <Link to="/guide" className={`${palette.accent} hover:underline`}>
            Web3 Guide
          </Link>{" "}
          covers MetaMask setup, Sepolia faucets, and wallet troubleshooting.
        </li>
      </Ul>
    </Sub>
  </DocPage>
);

export default Support;
