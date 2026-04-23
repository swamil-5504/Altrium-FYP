# Altrium vs. "Blockchain-Driven Automation for Degree Certificate Authentication" (IEEE paper by Bhamare, Kulkarni, Purnaye, Patil, Thokal, Kulkarni — MIT-WPU)

**Purpose:** Honest side-by-side. Where Altrium is ahead, where the paper is ahead, and where both are in the same place.

---

## 1. TL;DR

The IEEE paper is a **research prototype description**: it sets up a hashing-and-smart-contract framework, shows a 7-step workflow diagram, and enumerates future work (student login, biometrics, analytics, mobile app).

Altrium is a **full-stack production-shaped implementation** of the same core idea, plus several deliberate design choices the paper did not consider (soulbound tokens, on-chain SVG, custodial UX, dual-contract RBAC, on-chain revocation).

**Core idea overlap:** ~70%. Altrium is a superset in implementation, *and* makes a few product bets the paper explicitly didn't.

**What the paper does better:** it is published, peer-reviewed, and has an academic citation trail. Altrium has none of that. If your buyer is a university asking "where's the paper", Altrium currently has no answer.

---

## 2. What both are trying to solve

Identical problem statement in both: academic-certificate forgery and manual verification overhead. Both systems:

- Use Ethereum + Solidity smart contracts.
- Use Keccak-256 for certificate hashing.
- Store hash on chain + full data in a conventional DB.
- Verify by rehashing and comparing.

So at the 30 000-ft layer these are the same project.

---

## 3. Direct feature comparison

| Capability | IEEE paper | Altrium | Who wins |
|---|---|---|---|
| **Status / maturity** | Conceptual; Java backend + smart contracts diagrammed | Full-stack, running, Dockerised; 62 backend e2e tests pass | **Altrium** |
| **Chain** | Ethereum (network not specified) | Sepolia deployed; contracts at committed addresses | Parity |
| **Hashing** | Keccak-256 over concatenated fields (PRN, name, degree, course, year, CGPA) | Keccak-256 over `prn + "-" + college` for the index, plus a separate `degreeHash` for payload integrity | **Altrium** — two hashes give both an index and a tamper seal; paper collapses them into one |
| **Token standard** | Not specified (the paper talks about "hashes on chain", not tokens) | ERC-721 URIStorage, soulbound via `_update` override | **Altrium** — actual NFT semantics, Etherscan/MetaMask-visible, token-level revocation |
| **Soulbound** | Not discussed | Enforced at contract level (non-transferable) | **Altrium** |
| **Revocation** | Not discussed | On-chain `revokeDegree` emits permanent event; token is not burned so history is preserved | **Altrium** |
| **Custodial model** | Admin-only uploading, but no clear stance on student wallets | Explicit: student never owns a wallet; admin custodians mint | **Altrium** — the *paper lists this as future work* ("introduction of a student login system, allowing students to directly access their profiles") |
| **On-chain SVG** | Not discussed | Dynamic SVG generation per CGPA tier (Gold/Emerald/Merit) | **Altrium** |
| **Bulk CSV upload** | Yes (explicitly described) | Yes (`BulkUploadDegrees.tsx` exists) | Parity |
| **Single-entry upload** | Yes | Yes | Parity |
| **Verification flow** | Re-hash on verifier side, compare to chain | Same, plus tx-receipt decoding, plus employer-portal public directory | **Altrium** |
| **RBAC** | "University admin" as a role (no further detail) | 4 roles (STUDENT/ADMIN/SUPERADMIN/EMPLOYER) + 2 on-chain roles (`UNIVERSITY_ROLE`, `VERIFIER_ROLE`) + a legal-verification gate + wallet-connection gate | **Altrium** |
| **Auth** | Login system described generically | JWT access + refresh with `typ` claim, TTL-indexed blacklist, refresh revocation on logout, rate-limited | **Altrium** |
| **Password policy** | Not discussed | 12+ chars, upper/lower/digit/symbol enforced | **Altrium** |
| **PDF validation** | Not discussed | MIME + `%PDF-` magic + full `pypdf` parse + 10 MiB streamed cap | **Altrium** |
| **Automated tests** | Not discussed | 62 backend pytest e2e tests ✅; 0 Solidity tests ❌; 0 frontend tests ❌ | **Altrium**, but with gaps |
| **Throughput / latency numbers** | Paper cites ECBC benchmark (34.95 TPS query, 32.23 TPS upload, 4.21 s query, 2.05 s open latency) as reference | No load testing performed | **Paper** — at least has a number to cite |
| **Research gap addressed** | Explicitly enumerates 5 gaps (standards, scalability, DB integration, comprehensiveness, cost) | Addresses #3 (sits on MongoDB + FastAPI, ACID off-chain ✓) and partially #4 (comprehensive UX ✓); doesn't address #1 (standards) or #5 (cost modelling) | Parity-ish |
| **Multi-institution support** | Implied | Yes — each admin is linked to a `college_name`; dual-contract RBAC supports N universities | **Altrium** |
| **Future work listed** | Student login, biometric, multi-lang, email, analytics, cloud, mobile | Altrium has student login + dashboards; email is **stubbed**; no biometric, no multi-lang, no native mobile; Docker Compose ≠ cloud-native | Altrium ships 1 of 7 listed "future" items, paper ships 0 |
| **Publication / peer review** | IEEE-formatted, references 22 prior works | Zero publications | **Paper** |
| **Production deploy** | None described | Sepolia deployment + Docker Compose + 62 e2e tests | **Altrium** |
| **Gas-cost analysis** | Mentioned as a research gap | **Not addressed.** L1-mainnet costs will sink the product; no L2 migration plan yet | Neither |
| **Privacy on chain** | Hash-only storage is treated as sufficient | Same — `keccak(prn + "-" + college)` is pseudonymous. Vulnerable to brute-forcing the pre-image given a small PRN keyspace. Neither project addresses this | Neither |

---

## 4. What the paper does that Altrium should copy

1. **Academic citation trail.** 22 references, formal literature review, research-gap framing. Altrium has marketing copy; not the same credibility with university procurement committees. **Action: publish a whitepaper and/or conference paper. Even a workshop paper at IJCAI / NeurIPS-W / ICDECS / similar would move sales conversations.**

2. **Throughput numbers**. The paper at least *cites* comparable systems (34.95 TPS at ECBC). Altrium has no load-test baseline. **Action: run k6 or Locust against the mint endpoint at 10 / 100 / 1 000 / 10 000 TPS and publish the numbers.**

3. **Explicit research-gap discussion.** Forces you to own what you don't do. Altrium's marketing collateral is strengths-only; a realistic gaps section builds trust with technical buyers.

4. **Integration-with-legacy framing.** Paper's Fig. 3 shows a Java portal server as a distinct layer, with the blockchain as a bolt-on. This framing is what university CTOs actually want to hear — "you don't have to replace your existing system". Altrium's pitch currently sounds like a replacement.

## 5. What Altrium does that the paper explicitly doesn't

1. **Soulbound enforcement.** The paper never mentions transferability. A naïve re-implementation following the paper verbatim would produce tradable degree NFTs — a product disaster.

2. **Token-level revocation with on-chain audit trail.** The paper shows hash-matching; says nothing about "what happens if the university rescinds a degree". In real life, rescissions happen (academic misconduct, fraud, mistaken issuance). Altrium's `revokeDegree` emits a permanent event — the paper has no answer.

3. **Custodial UX.** The paper's workflow assumes a student will at some point log in and access their certificate. It does not solve "what if the student loses their wallet / cannot afford gas / is a 40-year-old alumnus in 2035 with no crypto experience". Altrium's custodial bet makes this a non-issue.

4. **Employer portal.** Paper describes a "verifier" role that manually enters PRN + name. Altrium ships a full employer-facing UI (`EmployerVerify.tsx`) with automated hash-match, on-chain status check, and "integrity turns red if tampered" feedback.

5. **Multi-university RBAC as an explicit contract.** The paper mentions universities as a role; Altrium has a two-contract system (`Registry` + `DegreeSBT`) with `addUniversity` granting both roles atomically. This is the design you'd write *after* running the paper in production and hitting a partial-permission bug (`Resolved.md` documents exactly this incident in Altrium's own history).

6. **Legal-verification + wallet-connection gates.** A registered admin cannot mint until (a) the superadmin has legally verified them and (b) they've connected an EVM wallet. The paper has a single on/off admin role.

7. **Modern stack.** FastAPI + Pydantic v2 + Beanie + React + Vite + Tailwind + Shadcn + ethers v6 + Foundry. The paper's Fig. 3 shows Java + a generic portal server — not wrong, but significantly more dated.

## 6. Where both are equally weak

1. **Privacy.** `keccak(prn + "-" + college)` is pseudonymous, not anonymous. A small PRN keyspace (e.g. a 4-digit roll-number inside a known college) is brute-forceable. Neither project addresses this. A per-student random salt in off-chain storage would fix it; both systems would benefit from it.

2. **Gas cost.** Paper lists cost as a "research gap". Altrium has no L2 migration plan. At L1 prices, neither design is economically viable at scale.

3. **Right to be forgotten.** On-chain immutability vs GDPR / DPDP Act. Neither project has a disclosure or mitigation strategy.

4. **Key custody.** Paper doesn't discuss who holds the university admin's private key. Altrium keeps it in `.env`. Both need an HSM / KMS / threshold-sig answer.

5. **Mobile.** Paper lists it as future work. Altrium has no native mobile app — the web app is mobile-responsive but not installable.

## 7. Where the paper is ahead (besides publication)

Few places, honestly:

- **Throughput baseline** (referenced, not measured).
- **Research-gap framing** (rhetorical, not technical).
- **Diagrammed integration with a legacy Java portal** — this is a *posture* win, not a code win.

The paper does not demonstrate features Altrium lacks. It describes a subset of what Altrium ships.

## 8. Positioning summary

| Axis | Altrium position vs paper |
|---|---|
| Feature surface | **Superset** |
| Implementation maturity | **Far ahead** (code runs; paper is descriptive) |
| Academic legitimacy | **Behind** — no publication |
| Empirical benchmarks | **Behind** — no TPS numbers |
| Privacy / cost / GDPR | **Tie** — both weak |
| Smart-contract safety | **Ahead on design, behind on proof** (no audit, no Foundry tests) |
| Novel product bets | **Ahead** (soulbound, custodial, on-chain SVG, revocation-with-history) |

## 9. Strategic recommendation

Treat the IEEE paper as a **market-validation signal**, not a competitor. Three academics and three students at MIT-WPU wrote an 8-page case for exactly what Altrium has already built. That is buying-intent research.

Actions:

1. **Cite the paper in your sales collateral.** Position Altrium as the productionisation of the research direction.
2. **Write a 6-page counter-paper** ("Altrium: From Hashes to Soulbound Tokens with Institutional Custody") addressing the paper's listed research gaps, with benchmark numbers. Submit to IEEE or ACM SIGEDU.
3. **Approach the paper's authors** at MIT-WPU. They're a natural pilot candidate: they wrote the thesis; you built the product.
4. **Benchmark and publish.** The paper's 34.95 TPS reference is a low bar. If Altrium can demonstrably beat it, that's a marketing moment.
5. **Address the gaps you share:** commission a salt-based privacy scheme, pick an L2, write the GDPR clause.

---

**Bottom line:** Altrium is what the paper's "Future Scope" section would produce if the authors had another two years, a front-end team, and a production engineer. That's a compliment. It also means the space is not defensible by implementation alone — a second team following the same blueprint will reach parity in 6–9 months. Altrium's durable edge is speed to market, the custodial-model brand, and whoever signs the first institutional customer.
