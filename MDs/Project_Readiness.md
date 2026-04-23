# Project Readiness Assessment — Altrium

**Prepared by:** External technical due-diligence review
**Scope:** Full-stack (Solidity contracts, FastAPI backend, React frontend, Docker deploy)
**Verdict in one line:** *Functionally complete MVP with recent security hardening. Ready for a pilot deployment at 1–2 partner universities; not ready for an open multi-tenant SaaS launch without the follow-ups listed in §7.*

---

## 1. Readiness scorecard

| Dimension | Score | Evidence |
|---|---|---|
| Feature completeness | **8 / 10** | SBT mint/verify/revoke/burn; custodial model; bulk CSV; employer portal; public lookup; PDF generation with QR; dual-contract RBAC all implemented |
| Code quality (backend) | **7 / 10** | Clear service layering; Pydantic v2; Beanie ODM; type hints; clean routers. Some dead code paths and a catch-all `Exception` handler mask errors |
| Code quality (contracts) | **7.5 / 10** | OpenZeppelin v5, AccessControl, soulbound via `_update` override, revocation preserves history. No unit tests (`.t.sol`) |
| Code quality (frontend) | **6.5 / 10** | TS + React + Tailwind; clean components. Zero real tests (only a deleted example). Errors handled inconsistently before the recent fixes |
| Security posture | **7.5 / 10 (post-P0/P1/T3)** | Strong after the hardening pass documented in `p0p1.md`. Before those fixes it was ~4/10. T3 tightened further: TTL-index reconciliation, case-insensitive email, honest dev-mode reset flow |
| Testing | **5 / 10** | 62 backend e2e tests pass. No smart-contract tests. No frontend tests. No load tests |
| Observability / ops | **3 / 10** | Logging configured, but no metrics, no tracing, no SLO dashboard, no alerting |
| Deployment maturity | **5 / 10** | Docker Compose works locally. No CI/CD, no Helm/Terraform, no infra-as-code for production, no secrets manager integration |
| Documentation | **7 / 10** | `ALTRIUM_OVERVIEW.md`, `Status.md`, `Resolved.md`, `p0p1.md` (with T3 addendum), `Audit_Report.md`, `Vulnerabilties_Bugs.md`, `Commercial_viability.md`, `Comparison_report.md`. Still missing: API reference beyond OpenAPI, runbook, SLA doc |
| **Overall — pilot readiness** | **7.2 / 10** | Safe for a controlled pilot; password policy + in-app reset give legacy-user migration a clean path |
| **Overall — SaaS readiness** | **5.5 / 10** | Not safe to onboard arbitrary universities without §7 items |

---

## 2. What works today (verified)

- **Soulbound degree SBT.** `AltriumDegreeSBT._update` reverts on any non-mint / non-burn transfer. Tokens cannot be sold or moved — exactly what the product promises.
- **Dual-contract RBAC.** `AltriumRegistry` holds `UNIVERSITY_ROLE`, `AltriumDegreeSBT` holds `VERIFIER_ROLE` and `MINTER_ROLE`. `addUniversity()` grants both in one call. Registry holds `DEFAULT_ADMIN_ROLE` on SBT (confirmed in `Resolved.md` after the fix).
- **On-chain revocation with history preservation.** `revokeDegree` sets flags + emits `DegreeRevoked`; the token is **not** burned so the revocation is permanently inspectable on Etherscan. This is a genuinely meaningful differentiator (see `Comparison_report.md`).
- **Back-end JWT auth + RBAC** (STUDENT / ADMIN / SUPERADMIN / EMPLOYER), wallet gating, verification-state gating.
- **E2E tested happy paths** — 62 tests covering register → login → refresh → logout → submit → approve → mint → public lookup → revoke → reset (per `Status.md`).
- **PDF handling.** After the P0 pass: MIME + magic-byte + full pypdf parse + 10 MiB streamed cap.
- **Bulk CSV import on admin UI** (present in `UniversityAdmin.tsx` / referenced `BulkUploadDegrees.tsx`).
- **Custodial UX.** Student never signs a transaction; admin mints on their behalf. This is the defining product bet.
- **Self-serve password reset (dev mode).** `POST /auth/forgot-password` + `POST /auth/change-password` with live password-strength UI. Gated by `ALLOW_SELF_SERVE_PASSWORD_RESET`; prod-boot guard refuses to start with the flag on. Lets legacy pre-policy accounts migrate without SMTP.
- **Case-insensitive email.** All user-email reads/writes go through a `.strip().lower()` normaliser, so case drift between registration and login no longer causes silent 401s.
- **Idempotent index migrations.** `_reconcile_blacklist_indexes` drops legacy non-TTL indexes before `init_beanie`, so schema-level index changes don't crash-loop the backend on deploy.

## 3. What does not work / is stubbed

- **No backend ↔ blockchain write path.** Frontend mints via ethers.js and POSTs the `tx_hash` to the backend; backend verifies via `_verify_blockchain_transaction`. Good for read-verification, but the backend cannot *initiate* a mint if the admin is offline or rejects the MetaMask prompt. There's no queue, no retry, no nonce management.
- **No email delivery.** Registration, approval, revocation — none of these send transactional email today. Intentional for the current dev phase: test accounts use non-deliverable domains (`*.edu.in`, `altrium.com`). Re-enabling means SMTP + an email-token password-reset flow, which will replace the in-app self-serve reset.
- **No frontend tests.** `frontend/src/test/` was deleted; only `example.test.ts` remains.
- **No Solidity tests.** Foundry is present; `contracts/test/` is empty. Zero unit or invariant coverage for $-at-stake code.
- **Rate limiter runs in-memory.** SlowAPI with `get_remote_address` keyfunc. Fine on a single container; breaks entirely when horizontally scaled.
- **Logging is plain text.** No structured JSON logs, no correlation IDs. Investigations will be painful.
- **Dev `.env` has committed `PRIVATE_KEY` and `SECRET_KEY` defaults.** The prod-config guard now refuses to boot with these, but they exist in the repo and git history.

## 4. Tech stack audit

| Layer | Choice | Fit |
|---|---|---|
| Contracts | Solidity 0.8.20, OZ v5, Foundry | Industry standard. Good choice |
| Chain | Ethereum / Sepolia | Reasonable for pilot. Production gas costs on L1 Ethereum mainnet will be painful for bulk imports — consider L2 (Base / Arbitrum / Polygon PoS) |
| Backend | FastAPI + Beanie (Mongo) + Motor | Appropriate. Async-safe |
| Frontend | React 18 + TS + Vite + Tailwind + Shadcn | Modern, maintainable |
| Wallet | MetaMask via Reown AppKit | Fine. Regex now rejects non-EVM wallets at the PATCH boundary |
| Auth | JWT HS256 + refresh + blacklist | Solid after P0 (typed tokens, TTL blacklist, refresh revocation). One rung below industry best (HS256 vs RS256 — single-key compromise is total) |
| Deploy | Docker Compose | Fine for dev, single-host pilot |

## 5. Architecture risk register

| Risk | Likelihood | Impact | Mitigation on hand |
|---|---|---|---|
| Backend–chain desync (tx confirmed on-chain but DB write failed, or vice versa) | **High** | **High** | Partial — backend only records what the frontend reports; no reconciliation job |
| Frontend ethers.js build drift vs contract ABI | Medium | Medium | Manual ABI copy in users.py and services; no codegen pipeline |
| L1 gas-fee spike during bulk mint | High | Medium | None. No L2 fallback |
| Mongo single-point failure | Medium | High | None; no replica set configured in `docker-compose.yml` |
| Private key in env escapes to logs | Low | Critical | None. Needs KMS / HSM integration |
| Vendor lock-in on Reown AppKit analytics | Low | Low | Ad-blockers already mute the telemetry |

## 6. Compliance touch-points (to investigate before commercial launch)

- **FERPA (US) / DPDP Act (IN) / GDPR (EU)** — Altrium stores student PII (name, PRN, email, CGPA). On-chain, only `keccak(prn + "-" + college)` is written, which is *pseudonymous* but not GDPR-safe by itself if the PRN is reversible from leaked off-chain data. Need a formal DPIA.
- **AICTE / UGC norms (India)** — degree-issuance automation regulations. Check whether the digital-only flow satisfies state education board requirements.
- **EIDAS (EU)** — for eventual EU expansion, qualified electronic signatures may be needed.
- **Right to be forgotten** — if a student invokes it, the on-chain hash cannot be deleted. Your privacy policy must disclose this.

## 7. Blockers before production (ranked)

1. **Backend-authoritative minting.** Introduce a `web3_service` that signs and submits transactions server-side, using a queue (e.g. `arq`, `rq`, or Celery + Redis) and transaction-receipt reconciliation. Frontend shouldn't be the custodian of chain writes.
2. **Smart-contract test suite.** At least: happy-path mint/verify/revoke/burn, soulbound-transfer reversion, role-enforcement reverts, revocation-history invariants. Foundry fuzz for edge cases. Target ≥90% branch coverage.
3. **Pick an L2 for production.** Mainnet Ethereum at ₹500–₹3 000 / mint is a non-starter for even a 1 000-student cohort. Base / Polygon PoS at sub-cent cost is mandatory.
4. **Secrets manager.** `.env` → AWS Secrets Manager / HashiCorp Vault / Doppler. The prod-config guard catches known-insecure values; it doesn't actually rotate them.
5. **Key custody plan.** Who holds the superadmin PRIVATE_KEY? What's the recovery story if it's lost? Today it's a string in `.env`.
6. **CI/CD.** GitHub Actions for: backend pytest, frontend typecheck/lint/build, Foundry test, Docker image build with SBOM, signed image push.
7. **Structured logging + metrics.** OpenTelemetry → any backend (Grafana Cloud, Datadog, Honeycomb). Tie logs to request ids. At minimum: request latency, error rate, mint success rate, on-chain gas spend.
8. **Replica-set Mongo + backups.** Current compose runs a single Mongo container with a Docker volume. Zero disaster-recovery story.
9. **Email service** — integrate SendGrid / SES / Postmark. Approval-pending students need a trigger. Also replaces the dev-only in-app password reset (`ALLOW_SELF_SERVE_PASSWORD_RESET`) with a proper email-token flow; the prod-boot guard will refuse to start until this is done.
10. **Frontend test coverage** — Playwright smoke for the five critical flows (login, register, wallet-connect, mint, verify).

## 8. What to pilot first (if you bought this today)

A **single university, single department**, with:
- A hard cap of ~500 credentials in the pilot period.
- Deployment on Sepolia or Polygon Amoy until the L2 choice is made.
- Weekly Etherscan-vs-Mongo reconciliation until items 1 & 7 from §7 are shipped.
- All five items from `Vulnerabilties_Bugs.md` marked "Still open" either fixed or explicitly accepted by the pilot sponsor.

You'll learn more about the gaps in three weeks of real use than three months of code review.

---

*Assessed against the code state as of the P1 hardening pass + T3 hotfix round (TTL reconciliation, in-app forgot-password, case-insensitive email, superadmin config alignment, legacy-user migration). Re-assess after each major release.*
