# Altrium — Technical Audit Report

**Audit type:** Whitebox code review + architecture review + dependency inspection.
**Audit scope:**
- Solidity contracts `AltriumDegreeSBT.sol`, `AltriumRegistry.sol`
- FastAPI backend (`backend/app/**`)
- React frontend (`frontend/src/**`)
- Deployment assets (`docker-compose.yml`, `.env`, `Dockerfile`s)
**Audit excluded:**
- Formal contract verification
- Manual penetration testing
- Load/performance testing
- Third-party dependency CVE scan (recommend `npm audit` / `pip-audit` / `foundry forge-audit` as separate exercise)

Findings below are numbered `ALT-###` and are cross-referenced in `Vulnerabilties_Bugs.md`.
Severity follows CVSS-inspired qualitative scale: **Critical / High / Medium / Low / Informational**.

---

## 1. Executive summary

The codebase is honest and coherent. The architecture is layered correctly (routes → services → CRUD → models). The custodial product bet is real. The smart contracts follow OpenZeppelin v5 idioms and avoid the common footguns (no unchecked external calls, no unbounded loops, no `tx.origin` checks).

The two most important findings are **architectural, not code-level**:

1. **The backend is not authoritative over chain state.** All minting flows through the browser; the backend trusts whatever `tx_hash` the frontend reports, verified only lazily on read. This is the single largest production risk (`ALT-018`).
2. **The smart contracts have no automated tests.** Foundry is configured, `test/` is empty. A paid third-party audit is strongly recommended before any mainnet or paid pilot use (`ALT-019`).

After the P0/P1 hardening pass (documented in `p0p1.md`), 17 issues are closed; 15 remain open. The remaining Critical/High open items are architectural, not injection-class bugs.

---

## 2. Smart-contract findings

### AltriumDegreeSBT.sol

| ID | Severity | Finding |
|---|---|---|
| AUD-SC-01 | **Medium** | **Soulbound enforcement is correct** but relies on `_update` allowing `to == address(0)` (burn). `burnDegree` permits either `MINTER_ROLE` *or* `VERIFIER_ROLE` to burn. VERIFIER_ROLE is granted to every university admin. Any admin can therefore burn **any** credential globally, not just credentials they minted. Consider restricting burn to `MINTER_ROLE` only, or to admins of the issuing institution via a per-credential ACL |
| AUD-SC-02 | **Medium** | `setVerified` allows flipping `verified` on a non-revoked token but does not check that the caller is the original issuer. Any `VERIFIER_ROLE` holder can mark any credential verified. In a multi-university deployment, University A can verify University B's degrees. Add `require(degreeByTokenId[tokenId].issuedBy == msg.sender)` or track per-university authority |
| AUD-SC-03 | **Low** | `DegreeRecord.issuedBy` is captured at mint time; not updated on role revocation. A degree minted by an admin who is later removed from `UNIVERSITY_ROLE` still shows their address forever. This is likely desired (audit trail) but should be documented |
| AUD-SC-04 | **Low** | `mintDegree` reverts with `"degree exists"` if the `collegeIdHash` is already minted. Good — prevents duplicate mint. But `burnDegree` deletes `_tokenIdByCollegeIdHash[collegeIdHash]` so the same collegeIdHash can be re-minted after burn. Intended as "reset", but callers should know duplicate `degreeHash` is now allowed |
| AUD-SC-05 | **Informational** | Events are well-indexed. `DegreeMinted` indexes `tokenId`, `collegeIdHash`, `issuedBy` — all three are the natural filter keys for subgraphs. Nothing to change |
| AUD-SC-06 | **Informational** | No `Pausable`. If a mint-spam attack or a subtle logic bug is discovered on mainnet, you cannot pause issuance. Consider inheriting OZ `Pausable` and gating `mintDegree` / `revokeDegree` behind `whenNotPaused` |

### AltriumRegistry.sol

| ID | Severity | Finding |
|---|---|---|
| AUD-SC-07 | **High** | `addUniversity` calls `grantRole(UNIVERSITY_ROLE, universityAdmin)` without `_grantRole`, meaning it relies on OZ's `grantRole` which itself requires the Registry to hold `UNIVERSITY_ROLE`'s admin role. `UNIVERSITY_ROLE`'s admin defaults to `DEFAULT_ADMIN_ROLE`. The caller already has `DEFAULT_ADMIN_ROLE` — so this works. **But**: the Registry also calls `degreeSBT.grantRole(degreeSBT.VERIFIER_ROLE(), universityAdmin)`. For that to succeed, the Registry address must itself hold `DEFAULT_ADMIN_ROLE` on the SBT contract. The `Resolved.md` file confirms this was a production incident and had to be fixed with `fix_contract_roles.py`. Bake this into the deploy script, don't leave it as a manual step |
| AUD-SC-08 | **Medium** | No safety check that `_degreeSBT` actually implements the `AltriumDegreeSBT` interface. If `setContracts` is called with a wrong address, `uploadDegree` will revert deep in the call stack with an opaque error. Consider `ERC165.supportsInterface` check |
| AUD-SC-09 | **Medium** | `uploadDegree` passes `msg.sender` as both `issuedBy` and `recipient`. The university admin is both the issuer and the custodian of the SBT. This is consistent with the custodial model, but students have no way to later "claim" their token to a personal wallet. If that's a future requirement, design the migration now |
| AUD-SC-10 | **Low** | `removeUniversity` revokes roles but doesn't iterate the admin's previously issued degrees. Those remain minted and verified. Document this invariant explicitly |

### Missing (high-importance)

- **No test file under `contracts/test/`** (AUD-SC-11, **High**). Foundry is configured; `forge test` runs zero cases. An unauthenticated read of `getDegree`, a revoked-then-verified attempt, a double-mint, a non-admin `addUniversity`, a soulbound-transfer attempt — all should be automated tests before a paid pilot.
- **No invariants**. `invariant_soulbound`, `invariant_revoked_cannot_be_verified`, `invariant_tokenIdByCollegeIdHash_round_trips` are obvious candidates.

---

## 3. Backend findings

### 3.1 AuthN / AuthZ

| ID | Severity | Finding | Status |
|---|---|---|---|
| AUD-BE-01 | Critical | Stale JWT → `UUID(user_id)` → 500 → masked as CORS error | ✅ fixed (`deps/auth.py`) |
| AUD-BE-02 | High | Access/refresh tokens interchangeable (no `typ` claim) | ✅ fixed |
| AUD-BE-03 | High | Unverified admins could mint/revoke via `/degrees/*` | ✅ fixed |
| AUD-BE-04 | High | Refresh tokens not blacklisted on logout | ✅ fixed |
| AUD-BE-05 | High | Login rate limit 50/min — useless against credential stuffing | ✅ fixed (5/min) |
| AUD-BE-06 | Medium | `/auth/register` discloses "Email already registered" → account enumeration | 🔴 open |
| AUD-BE-07 | Medium | JWT in `sessionStorage` — XSS exfiltration risk | 🔴 open |
| AUD-BE-08 | Medium | SlowAPI in-process memory — ineffective beyond 1 pod | 🔴 open |
| AUD-BE-09 | Low | HS256 symmetric keys; RS256 + key rotation recommended | 🔴 open |

### 3.2 Input validation

| ID | Severity | Finding | Status |
|---|---|---|---|
| AUD-BE-10 | High | `PATCH /users/me/wallet` took `body: dict`, bypassing regex | ✅ fixed (`WalletPatchRequest`) |
| AUD-BE-11 | Medium | No password policy | ✅ fixed (min 12, complexity) |
| AUD-BE-12 | Medium | `prn_number` unvalidated — feeds on-chain keccak | ✅ fixed (`^[A-Za-z0-9\-]{3,32}$`) |
| AUD-BE-13 | Medium | `full_name`, `college_name`, `title`, `description`, `token_id` unvalidated | ✅ fixed |
| AUD-BE-14 | Low | No upper bound on `metadata_json` payload size | 🔴 open |

### 3.3 File handling

| ID | Severity | Finding | Status |
|---|---|---|---|
| AUD-BE-15 | High | PDF upload: trusted `Content-Type`, scanned only first 1 MiB, no size cap | ✅ fixed (magic bytes + 10 MiB cap + full scan) |
| AUD-BE-16 | High | `/auth/{id}/verification-document` had zero PDF validation | ✅ fixed |
| AUD-BE-17 | Low | Uploaded files named `uploads/{credential_id}.pdf` — UUID is unpredictable, but `uploads/` must never be served statically | 🔴 (documentation) |

### 3.4 Data integrity

| ID | Severity | Finding | Status |
|---|---|---|---|
| AUD-BE-18 | High | `UserResponse` inherited `EmailStr` + wallet regex → legacy `email="admin"` or `wallet_address=""` broke every list endpoint | ✅ fixed |
| AUD-BE-19 | High | `BlacklistedToken` had a non-TTL index; tokens never expired from storage | ✅ fixed |
| AUD-BE-20 | Medium | Catch-all `Exception` handler masks every error as 500. Still an anti-pattern even after the CORS-header patch | 🔴 open |
| AUD-BE-21 | Medium | No database migration strategy. Schema additions to `User` will require manual backfill | 🔴 open |

### 3.5 Operational

| ID | Severity | Finding | Status |
|---|---|---|---|
| AUD-BE-22 | High | `backend/.env` committed with real Sepolia `PRIVATE_KEY` and default `SECRET_KEY="change-me-in-production"`. Production-config guard refuses to boot with these in production — good — but the secret is still in git | 🔴 open (rotate + `git filter-repo`) |
| AUD-BE-23 | High | No backend ↔ chain reconciliation. Trust in frontend-supplied `tx_hash` | 🔴 open (ALT-018) |
| AUD-BE-24 | Medium | `CORSMiddleware(allow_credentials=True, allow_origins=["*"])` default is a spec violation and was actively hitting users in dev | ✅ fixed via config guard |
| AUD-BE-25 | Medium | No request-ID, no structured logs | 🔴 open |
| AUD-BE-26 | Low | `limiter.py` uses `get_remote_address`, which returns the proxy IP if behind a load balancer without `X-Forwarded-For` parsing. Use SlowAPI's `Forwarded` helper or trust a header | 🔴 open |

### 3.6 Security headers

| ID | Severity | Finding | Status |
|---|---|---|---|
| AUD-BE-27 | Medium | No HSTS / X-CTO / X-Frame-Options / Referrer-Policy / CSP / COOP / CORP | ✅ fixed (`security_headers.py`) |

---

## 4. Frontend findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| AUD-FE-01 | High | FastAPI 422 `detail` arrays were passed to `toast.error()` → React error #31 on every validation failure. Crashed the login/register pages | ✅ fixed via `extractErrorMessage` |
| AUD-FE-02 | Medium | JWT stored in `sessionStorage`. XSS exposure | 🔴 open |
| AUD-FE-03 | Medium | Axios interceptor on 401 → full page reload to `/login`. Loses unsaved state. Fine for an MVP; not fine for a document-editing feature you'll eventually add | 🔴 open |
| AUD-FE-04 | Low | No test coverage beyond a trivial `example.test.ts` (deleted) | 🔴 open |
| AUD-FE-05 | Low | Dialog missing `DialogDescription` | ✅ fixed |
| AUD-FE-06 | Low | Password-register form had no client-side policy hint | ✅ fixed |
| AUD-FE-07 | Informational | WalletConnect/AppKit emits `<svg width="" height="">` rendering errors in the console. Upstream — unfixable from our code | ℹ️ |

---

## 5. Deployment / infra findings

| ID | Severity | Finding |
|---|---|---|
| AUD-OPS-01 | **High** | Single-node Mongo with Docker volume. No replica set, no backups. Disaster-recovery RTO is "whatever it takes to rebuild from scratch" |
| AUD-OPS-02 | **Medium** | No HTTPS in `docker-compose.yml`. Production deploy will need a reverse-proxy layer (Caddy / Traefik / Nginx + ACME). HSTS header only activates under HTTPS |
| AUD-OPS-03 | **Medium** | No CI. Engineers can push broken code. Recommend: GH Actions with pytest + forge test + docker-build + ESLint |
| AUD-OPS-04 | **Medium** | No image signing, no SBOM. Not required for pilot; required for enterprise procurement |
| AUD-OPS-05 | **Low** | `docker-compose.yml` exposes Mongo `27017` only inside the compose network — good — but does not configure auth. An attacker who reaches `mongo:27017` from any other container has unauthenticated DB access. Enable Mongo auth |
| AUD-OPS-06 | **Low** | Frontend `Dockerfile` bakes `VITE_*` env vars at build time. Rebuilding per environment (staging/prod) is required. No multi-stage environment handling documented |

---

## 6. Dependency posture (spot check)

| Package | Observation |
|---|---|
| `fastapi` | Recent. No known CVEs at review time |
| `pyjose` / `passlib` | `passlib` is minimally maintained (last release 2020). Consider migrating to `argon2-cffi` + `PyJWT` for long-term health |
| `pypdf` 3.16 | `pypdf` 4.x is current. Upgrade path straightforward |
| `beanie` / `motor` | Actively maintained |
| `web3` (Python) | Ensure ≥ 6.x for EIP-1559 support |
| Frontend — `@reown/appkit` | Upstream SVG-render bug present (see AUD-FE-07). Check release notes for fix |
| Frontend — `ethers` v6 | Current. Good |
| Frontend — `react`, `vite` | Current |

Run `pip-audit` and `npm audit --production` in CI to formalise this.

---

## 7. Positive findings (worth calling out)

- Pydantic v2 is used consistently; no mix of v1 / v2 idioms.
- `Beanie` Document models cleanly separate from `Pydantic` schemas.
- Services layer is genuinely a service layer — business logic isn't leaking into routers.
- Soulbound enforcement via OZ v5's `_update` override is the *right* pattern (many projects still use the deprecated `_beforeTokenTransfer`).
- Revocation flag + event — not burn — is the correct design: preserves history, satisfies employer auditability forever.
- TypeScript is strict; frontend has typed interfaces for API objects.
- The recent P0/P1 hardening pass was thorough, not cosmetic. Token-type claims, TTL indexes, and streamed PDF parsing are all production-grade fixes.

---

## 8. Overall audit verdict

| Tier | Verdict |
|---|---|
| **Ship to a pilot customer** | ✅ Yes, after ALT-018 (backend mint queue) has an interim mitigation (weekly reconciliation script) and ALT-019 (contract test suite) has at least happy-path coverage |
| **Ship as SaaS to arbitrary universities** | ❌ Not until the Open/High items in §3 and §5 are closed |
| **Sell as a one-time enterprise licence** | ✅ Yes — with a schedule of the open items attached as a contractual remediation plan |
| **Run on Ethereum mainnet** | ❌ Not until a paid third-party contract audit (budget ₹6–25 L) has passed |

---

## 9. Recommended remediation sequencing (30-60-90)

**30 days**
- ALT-018 mitigation: scheduled reconciliation job (Mongo ↔ on-chain events).
- AUD-SC-11: Foundry test suite covering happy paths + invariants.
- AUD-BE-22: rotate `PRIVATE_KEY` / `SECRET_KEY`, scrub git history.
- AUD-OPS-01: Mongo replica set + nightly backup to object storage.
- AUD-BE-06: non-enumerating register response.

**60 days**
- ALT-018 proper: backend-authoritative mint with a queue.
- Paid contract audit kickoff.
- AUD-BE-08: Redis-backed SlowAPI.
- AUD-OPS-03: CI (GH Actions).
- AUD-BE-07: JWT → HttpOnly cookie + CSRF.

**90 days**
- Complete audit, land remediations.
- AUD-SC-02 per-issuer verification scoping.
- AUD-OPS-02: HTTPS reverse proxy + HSTS active.
- Onboard first paying pilot.

---

**Audit closed** pending re-review after each remediation batch.

---

## Addendum — Post-release (T3) review

Re-inspected after the T3 hotfix round. New / updated findings:

| ID | Severity | Finding | Status |
|---|---|---|---|
| AUD-OPS-07 | **High** | Mongo index-options conflict crash-looped the backend during the TTL rollout (`IndexOptionsConflict`, code 85). Any schema-level index change on an existing collection needs a drop-before-create step or it will take production down on deploy | ✅ fixed via `_reconcile_blacklist_indexes` in lifespan; reusable pattern for future index migrations |
| AUD-BE-28 | **Medium** | Email equality checks were case-sensitive — legitimate login attempts could 401 after a case-inconsistent registration / reset | ✅ fixed — `UserCRUD._norm_email` normalises on read and write |
| AUD-BE-29 | **Medium** | Forgot-password endpoint returned a silent 204 regardless of success, removing dev-diagnostic feedback. Acceptable in production (enumeration defence) but confusing during testing | ✅ fixed — dev-mode 404 with explicit `"No account found with that email"`; production behaviour unchanged because the whole endpoint 404s when `ALLOW_SELF_SERVE_PASSWORD_RESET=false` |
| AUD-OPS-08 | **Low** | `config.py` default `SUPERADMIN_PASSWORD="123"` was a footgun for any fresh checkout without `.env`. Prod-boot guard caught it but dev would happily seed an insecure account | ✅ fixed — default now `"Altrium123!Dev"` (policy-compliant); `"REPLACE_ME_IN_ENV"` added to `INSECURE_PASSWORDS` |
| AUD-BE-30 | **Medium** | Legacy accounts (registered before the password policy) had no self-serve path to rotate their password because no SMTP was configured and email-token reset was out of scope | ✅ fixed — in-app `POST /auth/forgot-password` (gated by `ALLOW_SELF_SERVE_PASSWORD_RESET`) and `POST /auth/change-password`. Dev-only by construction; prod-boot guard refuses to start with the flag on |
| AUD-FE-08 | Informational | New `PasswordStrengthChecklist` component gives live visual feedback on the five complexity rules; used on register + forgot-password pages | ✅ (UX polish, not a flaw) |

### Audit verdict after T3

Pilot-readiness posture unchanged (still ✅). SaaS-readiness posture
unchanged (still ❌ pending ALT-018, ALT-019, observability, secrets
manager). Nothing in T3 regressed earlier findings; T3 closed ALT-037
through ALT-042 and added one defensive reusable pattern (index
reconciliation at startup) for future migrations.

**Addendum closed.**
