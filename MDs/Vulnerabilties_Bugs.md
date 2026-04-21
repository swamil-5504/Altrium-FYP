# Vulnerabilities & Bug Inventory — Altrium

**Scope:** security flaws, functional bugs, and latent correctness issues observed in the codebase.
**Legend:**
- Severity: **C** Critical · **H** High · **M** Medium · **L** Low · **I** Informational
- Status: ✅ Fixed · 🟡 Partially fixed · 🔴 Open · ℹ️ Accepted risk

---

## 1. Fixed in P0 / P1 hardening (see `p0p1.md` for diffs)

| # | ID | Severity | Area | Finding | Status |
|---|---|---|---|---|---|
| 1 | ALT-001 | **C** | Auth | `UUID(user_id)` on a stale/malformed JWT raised `ValueError`, upgraded to 500 by the catch-all handler, which also stripped CORS headers. Browser reported "CORS error" masking a real 500 | ✅ |
| 2 | ALT-002 | **C** | Data integrity | Legacy user with `email="admin"` and admins with `wallet_address=""` broke every `GET /users/` because `UserResponse` inherited `EmailStr` + wallet regex. Entire Superadmin dashboard returned 500 | ✅ |
| 3 | ALT-003 | **H** | Config | `SUPERADMIN_EMAIL=admin` failed `EmailStr` validation; superadmin seeder silently crashed on every boot (caught + swallowed) | ✅ |
| 4 | ALT-004 | **H** | AuthZ regression | `/degrees/*` admin-mutation endpoints used `require_role(ADMIN)`, bypassing the legal-verification gate that `/credentials/*` correctly enforced. Unverified admins could mint, revoke, delete | ✅ |
| 5 | ALT-005 | **H** | Token hygiene | Blacklisted tokens used a plain index instead of Mongo TTL → collection grew unbounded; blacklist entry expiry also used a hardcoded 30 min instead of the token's real `exp` | ✅ |
| 6 | ALT-006 | **H** | Token hygiene | Access and refresh tokens had no `typ` claim; any access token could be submitted as a refresh token. Also, logout only blacklisted the access token — stolen refresh tokens outlived logout | ✅ |
| 7 | ALT-007 | **H** | File upload | `degree_service.upload_document` only scanned the first 1 MiB with `pypdf`. No size cap. Trusted client-supplied `Content-Type`. Verification-document upload had **no** PDF validation at all | ✅ |
| 8 | ALT-008 | **H** | Web3 gate | An admin who was legally verified in the DB but had no wallet could still hit mint/revoke endpoints; the on-chain tx would fail with "missing role", wasting gas and producing a bad UX | ✅ |
| 9 | ALT-009 | **H** | Input validation | `PATCH /users/me/wallet` took `body: dict` and read `body.get("wallet_address")` unvalidated — the `WALLET_ADDRESS_PATTERN` defined on `UserBase` was bypassed entirely. A Solana / Cosmos / garbage string would persist | ✅ |
| 10 | ALT-010 | **H** | Password policy | `password: str` accepted any non-empty string. Dev seed password was `"123"` | ✅ |
| 11 | ALT-011 | **M** | Brute force | Login rate-limit was 50/min/IP — 3 000 attempts/hour, essentially unlimited for credential-stuffing | ✅ (5/min) |
| 12 | ALT-012 | **M** | Rate limiting | `/credentials/*`, `/degrees/*/document`, `/auth/{id}/verification-document`, public lookup routes — all unthrottled, trivially scraped or abused | ✅ |
| 13 | ALT-013 | **M** | Production config | `TrustedHostMiddleware(allowed_hosts=["*"])` with a code comment "Should be specific in production". `BACKEND_CORS_ORIGINS` default `["*"]`. Production boots with defaults | ✅ (prod-guard raises `RuntimeError`) |
| 14 | ALT-014 | **M** | Headers | Zero security response headers (no HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, CSP, COOP/CORP) | ✅ |
| 15 | ALT-015 | **M** | Input validation | `prn_number`, `full_name`, `college_name`, `title`, `description`, `token_id` had no format, length, or range constraints. `prn_number` feeds the on-chain `keccak(prn + "-" + college)` — bad input is permanently on-chain | ✅ |
| 16 | ALT-016 | **M** | UX / XSS defence-in-depth | FastAPI 422 validation errors were passed directly to `toast.error()` → React error #31 (`Objects are not valid as a React child`) crashed the login page. Masked real validation failures | ✅ |
| 17 | ALT-017 | **L** | a11y | `DialogContent` in Superadmin "Students per college" had no `DialogDescription`; Radix warned on every open | ✅ |

## 2. Still open — accepted for the pilot but not for SaaS launch

| # | ID | Severity | Area | Finding | Status |
|---|---|---|---|---|---|
| 18 | ALT-018 | **H** | Architecture | **Backend has no authoritative mint path.** Frontend mints via ethers.js; backend stores the tx hash the frontend reports. No on-chain receipt polling, no retry, no queue, no reconciliation. Divergence between Mongo and chain is possible and undetected | 🔴 |
| 19 | ALT-019 | **H** | Testing | Smart contracts have **zero** unit tests. A $-at-stake Solidity code path without `forge test` is an unqualified red flag | 🔴 |
| 20 | ALT-020 | **H** | Secrets | `backend/.env` contains a real Sepolia `PRIVATE_KEY`. Git history likely retains it. If this repo was ever shared publicly, rotate immediately | 🔴 (ops-level) |
| 21 | ALT-021 | **M** | Enumeration | `/auth/register` returns `"Email already registered"` on duplicate → attacker can enumerate accounts. No email verification on signup means anyone can claim any identity | 🔴 |
| 22 | ALT-022 | **M** | Error handling | The catch-all `@app.exception_handler(Exception)` turns every uncaught exception into 500 `"Internal server error"`, hiding root causes. Now CORS-header-safe (fixed in ALT-001 patch) but still a debugging anti-pattern. Prefer specific `RequestValidationError` / `ResponseValidationError` / `pymongo.errors.OperationFailure` handlers | 🔴 |
| 23 | ALT-023 | **M** | XSS surface | JWTs stored in `sessionStorage`. Any XSS (including a dependency supply-chain attack) exfiltrates tokens. Mitigate with `HttpOnly` + `SameSite=Strict` cookies + CSRF token, or a strict CSP tied to the SPA origin | 🔴 |
| 24 | ALT-024 | **M** | Scalability | SlowAPI uses in-process memory as the rate-limit store. Horizontally scaling the backend replicates the counter across pods — effective limit = N × stated limit | 🔴 |
| 25 | ALT-025 | **M** | Observability | No structured logs, no request-IDs, no metrics, no tracing. An incident is debuggable only via `docker logs` | 🔴 |
| 26 | ALT-026 | **L** | Predictable paths | Uploaded PDFs live at `uploads/{credential_id}.pdf`. The ID is a UUID (unpredictable) so IDOR is unlikely, but if `uploads/` is ever served statically, random access becomes possible. Randomise filename + keep bucket private | 🔴 |
| 27 | ALT-027 | **L** | Crypto agility | JWTs signed with HS256 (symmetric). A single-key compromise is total. RS256 + key rotation is a small lift with `python-jose` | 🔴 |
| 28 | ALT-028 | **L** | Contract | `AltriumRegistry.removeUniversity` revokes `UNIVERSITY_ROLE` but doesn't burn previously minted tokens; the admin's old mints remain valid. May be desired — document the behaviour | 🔴 (documentation) |
| 29 | ALT-029 | **L** | Contract | `mintDegree` uses `_safeMint`, which calls `onERC721Received` on contract recipients. If the "recipient" is a contract that reverts, mint fails. Since the recipient is an admin wallet in practice, fine — but don't ever pass a contract address here | ℹ️ |
| 30 | ALT-030 | **I** | PII on chain | `collegeIdHash = keccak256(prn + "-" + college)` is pseudonymous. Given a small PRN keyspace per college (e.g. sequential numbering), an attacker with the college name can brute-force the pre-image trivially. This leaks student ↔ credential linkage. Mitigate with a per-student random salt stored off-chain | 🔴 |
| 31 | ALT-031 | **I** | Right-to-forget | On-chain `degreeHash` cannot be deleted (immutability is the feature). Privacy-policy disclosure required under GDPR / DPDP Act | 🔴 (legal) |

## 3. Functional / non-security bugs observed

| # | ID | Severity | Area | Finding | Status |
|---|---|---|---|---|---|
| 32 | ALT-032 | **M** | WalletConnect SDK | `<svg> attribute width/height: Unexpected end of attribute. Expected length, ""` — upstream Reown AppKit component renders `<svg width="" height="">` briefly. Cosmetic console spam | ℹ️ upstream |
| 33 | ALT-033 | **L** | CORS vs error middleware | Starlette routes `@app.exception_handler(Exception)` through `ServerErrorMiddleware`, which sits *outside* user middleware → CORS headers would normally be lost. Fixed by manually attaching CORS headers in the handler (ALT-001 patch) | ✅ workaround |
| 34 | ALT-034 | **L** | Frontend | `Login.tsx`, `SuperadminDashboard.tsx`, `StudentDashboard.tsx`, `EmployerVerify.tsx` all extracted `response.data.detail` as if it were always a string. Crashed on 422 | ✅ |
| 35 | ALT-035 | **L** | Contract | `AltriumDegreeSBT.burnDegree` deletes the token's `DegreeRecord` and `_tokenIdByCollegeIdHash` mapping before `_burn` — history is gone from storage (still in event log). Intended for "reset" flow but callers should be sure that's what they want | ℹ️ |
| 36 | ALT-036 | **I** | Schema evolution | No migration story for Mongo. Adding a required field to `User` will break deserialization of existing rows (Beanie is lenient but not magical). Document a migration playbook | 🔴 |

## 2b. Post-release (T3) — found and fixed during first end-to-end walk-through

| # | ID | Severity | Area | Finding | Status |
|---|---|---|---|---|---|
| 37 | ALT-037 | **High** | Migration | `BlacklistedToken` TTL-index conversion crash-looped the backend because Mongo refuses to redefine an index (`expires_at_1`) with different options. Symptom: `ERR_CONNECTION_REFUSED` in browser. | ✅ fixed via `_reconcile_blacklist_indexes` in lifespan — drops legacy non-TTL index before `init_beanie`, idempotent on every boot |
| 38 | ALT-038 | **Medium** | AuthN / UX | Email lookups (`UserCRUD.get_by_email`) did case-sensitive exact match. A mixed-case email in DB vs input silently failed to match → forgot-password returned 204 without actually resetting anyone, misleading the operator | ✅ fixed — `UserCRUD._norm_email` strips + lowercases on both reads and writes |
| 39 | ALT-039 | **Low** | UX / dev ergonomics | Forgot-password endpoint returned silent 204 whether or not the email matched, removing enumeration oracle but also removing legitimate feedback during dev testing | ✅ fixed — dev-mode endpoint now returns 404 `"No account found with that email"`; production behaviour (when `ALLOW_SELF_SERVE_PASSWORD_RESET=false`) is still 404 for the whole route |
| 40 | ALT-040 | **Medium** | Data hygiene | Stale superadmin row `email="admin"` (invalid EmailStr, from the pre-fix seed) persisted in Mongo long after the underlying bug was fixed. Caused serialisation failures on `/users/` (originally ALT-002) and confused the current login story | ✅ fixed — row deleted via one-shot Python script during T3.4 |
| 41 | ALT-041 | **Medium** | Password migration | Legacy users registered before the new 12-char policy had passwords that couldn't be rotated by the user (no email flow existed) | ✅ mitigated — self-serve in-app `/auth/forgot-password` + `/auth/change-password` + mass-reset script for existing accounts |
| 42 | ALT-042 | **Low** | Config hygiene | `config.py` default `SUPERADMIN_PASSWORD="123"` was a footgun — a fresh checkout without `.env` would seed with it | ✅ fixed — default aligned to policy-compliant `"Altrium123!Dev"` (dev value), `"REPLACE_ME_IN_ENV"` added to `INSECURE_PASSWORDS` in the prod-boot guard |

## 4. Recommended remediation order (what to fix next)

1. **ALT-018** — backend mint queue + reconciliation. This single item covers most operational risk in the product.
2. **ALT-019** — Foundry tests. No contract ships without them at enterprise buyers.
3. **ALT-020** — rotate committed secrets; move to a secrets manager.
4. **ALT-021** — email verification + non-enumerating register.
5. **ALT-023** — JWT in HttpOnly cookie or tighten CSP.
6. **ALT-024** — Redis-backed rate limiter.
7. **ALT-025** — structured logging + minimal metrics.
8. **ALT-030** — per-student salt for `collegeIdHash`.

## 5. Severity tallies (after P0 + P1 + T3)

| Severity | Fixed | Open |
|---|---:|---:|
| Critical | 2 | 0 |
| High | 8 | 3 |
| Medium | 10 | 5 |
| Low | 2 | 4 |
| Informational | 0 | 3 |
| **Total** | **22** | **15** |

Net posture: genuinely improved by the P0/P1 pass and further tightened
by the T3 hotfix round (TTL reconcile, case-insensitive email, honest
forgot-password, legacy-user migration). Remaining open items are
predominantly architecture / ops, not low-hanging code bugs.
