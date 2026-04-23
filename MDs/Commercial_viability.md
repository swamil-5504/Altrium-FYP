# Commercial Viability Assessment — Altrium

**Perspective:** Potential buyer evaluating Altrium as either (a) a one-time enterprise licence or (b) a SaaS subscription for the EdTech stack.
**Time horizon:** 12–24 months.

---

## 1. The product in one paragraph

Altrium is a blockchain-anchored, custodial credential-issuance platform for higher-education institutions. A university admin issues a student's degree as a non-transferable ERC-721 ("Soulbound Token") via a MetaMask-signed transaction; the student never needs a wallet. Employers verify degrees through a public portal that cross-checks a Mongo-stored PDF + hash against the on-chain record. Because the token is soulbound, it cannot be sold; because revocation is on-chain, a future employer can always see the current status.

Everything on the datasheet (`ALTRIUM_OVERVIEW.md`) actually exists in code — that's genuinely uncommon in Web3 EdTech pitches, which usually ship a demo video and a Figma file.

## 2. Who pays for this?

### Primary buyer
- **Private universities and autonomous deemed-to-be universities**, especially those with ≥3 000 students / year, a brand-reputation incentive, and a budget line for "anti-fraud" or "digital transformation".
- India TAM: ~1 200 universities + ~43 000 affiliated colleges (AISHE 2022). Realistic serviceable market in the first 24 months: ~200 institutions able to pay, willing to pilot on-chain credentials.
- Global TAM: larger, but sales cycle gets harder — EU needs EIDAS conformance, US needs FERPA alignment.

### Adjacent buyers
- **Professional-exam bodies** (CA, CFA, ICAI, bar councils) — smaller credential volume, higher per-issue willingness to pay.
- **Corporate training / certification providers** (Coursera-style enterprises, bootcamps). Fastest yes, lowest price point.
- **Government-skill missions** (Skill India, NSDC partners) — large volume, slow procurement, likely RFP-driven.

### Non-buyers (clarify upfront)
- Fully public-funded state universities: budget-bound, usually mandated to use government portals (e.g. DigiLocker in India, EDEXA in EU), rarely sourcing new SaaS.
- K-12 schools: credential volume is too low to justify blockchain overhead.

## 3. Willingness to pay — a sanity check

Comparable products and their pricing anchor:

| Comparable | Delivery | Approximate price point |
|---|---|---|
| **DigiLocker / NAD (IN)** | Govt. free | ₹0 (reference) |
| **Hyland Credentials / Learning Machine / Blockcerts** | Open standard, self-host or consulting | USD 25–60k setup + ops |
| **Accredify (SG)** | SaaS | USD 2–15 / credential tier |
| **MIT Digital Credentials Consortium (DCC)** | Standards, open source | free, but integration labour heavy |
| **Certif-ID / Truecopy / TruScholar (IN)** | SaaS | ₹20–60 per credential, custom onboarding fee |

### Proposed Altrium pricing (defensible)

| Tier | Target | Model | Price (INR) | Price (USD) |
|---|---|---|---|---|
| **Pilot** (capped @ 500 credentials) | First 5 universities | One-time | ₹1 50 000 | ~$1 800 |
| **Institution** (≤ 15 000 credentials / yr) | Single university, single subdomain | Annual | ₹7–12 lakh | ~$8 500–14 500 |
| **Group** (multi-college / board) | State-board / university group | Annual | ₹25–40 lakh | ~$30–48 k |
| **Enterprise / one-time licence** | Buy the code + 12 mo support | Lump sum | ₹60 lakh – ₹1.2 cr | ~$72–145 k |

Do **not** price per credential on L1 Ethereum — gas costs dominate margin. Price per credential only after L2 migration (see §5).

## 4. Unit economics — back-of-envelope

### Cost per credential issued (chain)

| Chain | Cost (2024 gas, rough) | Comment |
|---|---|---|
| Ethereum mainnet | ₹250 – ₹2 500 | **Unsellable at subscription prices** |
| Polygon PoS | ₹0.05 – ₹0.50 | Viable |
| Base / Arbitrum / OP | ₹0.10 – ₹2 | Viable |
| Sepolia (test) | ₹0 | Dev only |

At Polygon PoS pricing and even a conservative ₹30/credential SaaS charge, gross margin on chain-ops is ~99%. At mainnet pricing, margin is negative. **L2 migration is a commercial precondition, not a nice-to-have.**

### Cost per credential issued (infra, excluding chain)

| Component | Monthly cost (pilot, 1k/mo) | At scale (100k/mo) |
|---|---|---|
| Compute (FastAPI, 2 vCPU) | ₹3 000 | ₹25 000 (HPA 6–8 pods) |
| MongoDB Atlas M10 | ₹5 000 | ₹40 000 (M30 replica set) |
| Redis (rate-limit) | ₹1 500 | ₹6 000 |
| S3-compatible PDF store | ₹500 | ₹4 000 |
| Observability (OTel + Grafana Cloud free → paid) | ₹0 | ₹15 000 |
| Transactional email (SES / Postmark) | ₹300 | ₹6 000 |
| **Total** | **~₹10 300/mo** | **~₹96 000/mo** |

Per credential at pilot (1 000/mo): **₹10.3 base cost + ₹0.30 chain = ₹10.6**.
Per credential at scale (100 000/mo): **₹0.96 + ₹0.30 = ₹1.26**.

## 5. Commercial blockers

Ranked by "will a procurement team actually sign":

1. **Smart-contract audit.** No serious enterprise buyer signs off on an unaudited contract holding their student credentials. Budget for a paid audit (Trail of Bits / OpenZeppelin / local equivalent): **₹6–25 lakh**, 4–8 weeks.
2. **No ISO 27001 / SOC 2 story.** Larger universities, especially abroad, will demand at least a Type 1 report or a clear roadmap to one. Prep: **6–9 months**.
3. **No data-residency posture.** DPDP Act 2023 (India) will require local storage for personal data. Current Mongo deployment has no region story.
4. **Key custody.** "Where does the Superadmin private key live" needs a defensible answer (KMS / HSM / Fireblocks / threshold signatures). A `.env` file is not one.
5. **No SSO integration.** Universities use Okta, Azure AD, Google Workspace. Altrium today has username/password only. SAML / OIDC is required for many procurement checklists.
6. **No integration path to existing student-info systems.** ERP/SIS vendors include Ellucian, Oracle Campus, Academia ERP. Without a CSV → SIS connector story, every institution is bespoke onboarding.
7. **No on-chain-cost model visible to the customer.** They will ask "who pays gas?" on week one. A bundled-pricing answer is fine, but it must be concrete.

## 6. Strategic moat — how defensible is this?

Factors Altrium has working for it:
- **Custodial UX**: the vast majority of Web3 credentialing projects dump wallet complexity on the student. Altrium's decision to put wallets only on the admin side is a genuine product insight, not a feature. Measurable adoption lift.
- **Dynamic on-chain SVG**: the certificate image lives in the contract storage; not in an IPFS dangling pointer. When Opensea or Etherscan fetch `tokenURI`, they get a self-rendering image. This is a demoable "wow" factor in sales calls.
- **Soulbound by design**: cannot be listed on NFT marketplaces. Removes a narrative risk ("is my degree a speculative asset?") that confuses both parents and administrators.
- **Revocation-preserves-history**: not all comparable products do this. Valuable for employers auditing past decisions.

Factors Altrium does **not** have:
- **No patent moat.** The technical ideas are public (ERC-5192, EIP-4671, Blockcerts etc.). A competitor can clone the UX in 90 days.
- **No network effect** yet. The value of a credential is proportional to the number of employers that recognize it. Until Altrium signs employer partners, this is a chicken-and-egg problem.
- **No regulatory moat.** UGC / AICTE haven't designated any blockchain provider. If they do, and it's a competitor, you're out.

Durable defensibility comes from:
- **Distribution partnerships** (e.g. university consortia, government skill missions).
- **Custodial-model brand trust** — be the "Stripe for academic credentials" in buyer perception.
- **Employer-side tooling**: a verified directory employers actually use. Once that network tips, switching cost is high.

## 7. Competitive landscape (India-first)

| Competitor | Angle | Relative strength |
|---|---|---|
| **DigiLocker / NAD** | Govt. incumbent, free, mandated rails | Altrium loses on cost; wins on UX, revocation semantics, and "your brand, your cert" |
| **TruScholar** | Indian SaaS, similar pitch | Altrium wins on soulbound + dynamic SVG; TruScholar has more customers today |
| **Certif-ID / LegitDoc** | Indian SaaS | Parity on features; Altrium's code quality (post-hardening) and test suite are better than most competitors' demoed products |
| **Hyland (Learning Machine)** | Global, mature, Blockcerts-based | Altrium wins on cost and modernization; Hyland wins on gravitas for Tier-1 universities |
| **Accredify (SG/global)** | Mature SaaS, ISO-certified | Altrium wins on price; loses on compliance badges |

Net: Altrium is a credible mid-market entrant. It is not a category-winner yet.

## 8. Go-to-market recommendations (if bought)

1. **Lock-in 2 lighthouse universities for a paid pilot at the ₹1.5 L price point.** Use the pilot to harden ALT-018 (backend mint queue) with real production load.
2. **Commission a contract audit immediately.** The audit report is a sales asset that closes the next 10 deals.
3. **Migrate to Polygon PoS or Base for production.** Sepolia is a technical proof; a pricing model needs an L2.
4. **Publish a "Trust Center" page**: contract addresses, audit report, uptime, privacy policy. This alone moves enterprise conversations by weeks.
5. **Integrate Azure AD / Google Workspace SSO.** Mandatory for Tier-1 universities abroad.
6. **Build an employer-facing free tier.** Employer verification should be free forever, paid only by the issuing university. This creates the two-sided network.
7. **Sign an EdTech distribution partner.** Ellucian, Academia ERP, or a state-board systems integrator — selling direct to 43 000 Indian colleges one at a time will not work.

## 9. Valuation-relevant observations

If a strategic acquirer was valuing Altrium today:
- **Asset value (code + trademarks + domain + Sepolia deployment):** ~₹30–60 lakh. The P0/P1 hardening just increased this materially.
- **Acqui-hire value:** depends on team retention; not quantified here.
- **Revenue-multiple value:** n/a — no ARR yet.
- **Strategic-option value:** the main story. Whoever signs the first government credential mandate wins a 5–10× multiple. Altrium is credibly positioned to compete for it; not uniquely positioned.

## 10. Bottom line

Altrium is a **pragmatic, shippable product with genuine UX insight and mid-tier technical quality**. The soulbound-plus-custodial combination is commercially sound. The biggest commercial blockers are not technical — they're institutional (audit, compliance, key custody, SSO). None are insurmountable within 90 days.

- As a **one-time licence** with 12 months of support: fair price ₹60 lakh – ₹1.2 cr, assuming the buyer is a vendor who can shoulder the §5 items themselves.
- As a **SaaS product**: viable if you spend 6 months on §5 and §8 items first. Attempting to sell SaaS today against Accredify / TruScholar without ISO 27001 will surface the gaps publicly.

Recommend: pilot-first, audit-next, SaaS-third.
