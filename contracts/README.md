## Altrium Smart Contracts (Foundry)

This folder contains the on-chain part of **Altrium: a Soulbound Token (SBT) based Degree Verification system**.
Universities issue and verify degree credentials, students can prove ownership via their (hashed) college identifier, and employers can request access to view/verify a credential.

The system is intentionally hybrid:
- **On-chain**: immutable issuance/verification + access approvals (auditable events and state).
- **Off-chain**: authentication/JWT/RBAC, storage of human-readable degree data, and hashing of student identifiers.

## What the contracts do

### `AltriumDegreeSBT.sol` (Degree credential token)
An **ERC-721 Soulbound Token (SBT)** used to represent a degree credential.

- **Primary identifier**: `collegeIdHash` (a `bytes32` hash computed off-chain; do not store raw IDs on-chain).
- **Minting model**: the token is minted to a **custodian** address (typically the university/platform wallet), not to the student.
- **Non-transferable**: transfers are permanently disabled (only mint/burn pathways remain).
- **Credential payload anchoring**:
  - `degreeHash`: `bytes32` hash of the off-chain degree payload / VC / document bundle.
  - `tokenURI`: points to off-chain metadata (IPFS / HTTPS).
- **Verification**: university verifiers can set `verified` to true/false for an issued token.

Key state:
- `degreeByTokenId[tokenId] -> DegreeRecord`
- `tokenIdByCollegeIdHash(collegeIdHash) -> tokenId`

Key roles:
- `MINTER_ROLE`: allowed to mint degrees (assigned to `AltriumRegistry`)
- `VERIFIER_ROLE`: allowed to verify/unverify degrees (assigned to university admins)

### `EmployerAccessManager.sol` (Access requests + approvals)
A lightweight on-chain access-control registry for employers.

- Employers call `requestAccess(collegeIdHash, purpose)` → creates a request record + emits an event.
- University admins call `approveRequest(requestId)` or `denyRequest(requestId)`.
- If approved, `accessGranted[collegeIdHash][employer] = true`.
- Access can be revoked by the university via `revokeAccess(collegeIdHash, employer)`.

Key role:
- `UNIVERSITY_ROLE`: who can approve/deny/revoke.

### `AltriumRegistry.sol` (Orchestration + RBAC)
This is the “hub” contract that ties everything together and enforces platform roles.

Roles:
- `DEFAULT_ADMIN_ROLE`: platform admin (can add/remove universities and update linked contract addresses)
- `UNIVERSITY_ROLE`: university admins/verifiers (can issue degrees, verify degrees, and approve/deny employer access)

What it does:
- **University management**: `addUniversity()` / `removeUniversity()` grants/revokes:
  - `AltriumRegistry.UNIVERSITY_ROLE`
  - `AltriumDegreeSBT.VERIFIER_ROLE`
  - `EmployerAccessManager.UNIVERSITY_ROLE`
- **Degree issuance**: `uploadDegree(collegeIdHash, degreeHash, degreeURI)`
  - calls `AltriumDegreeSBT.mintDegree(...)`
- **Degree verification**: `verifyDegree(collegeIdHash, verified)`
  - resolves tokenId via `tokenIdByCollegeIdHash` then calls `setVerified`
- **Employer workflow**:
  - `requestAccess(collegeIdHash, purpose)` → forwards to `EmployerAccessManager`
  - `approveEmployerRequest(requestId)` / `denyEmployerRequest(requestId)`
  - `revokeEmployerAccess(collegeIdHash, employer)`
- **Gated reads**:
  - `getDegreeForEmployer(collegeIdHash)` only works if employer has approved access
  - `getDegreeForStudent(collegeIdHash)` is a student-friendly read if a student wallet was linked

Optional convenience mapping:
- `studentWalletByCollegeIdHash[collegeIdHash] = studentWallet` (set by a university admin)

## How the contracts work together (end-to-end)

### 1) Deployment and wiring
Use `script/Deploy.s.sol` to deploy all three contracts and wire permissions:

- Deploy `AltriumDegreeSBT(admin, custodian)`
- Deploy `EmployerAccessManager(admin)`
- Deploy `AltriumRegistry(admin, degreeSBT, accessManager)`
- Grant `AltriumDegreeSBT.MINTER_ROLE` to `AltriumRegistry` (so universities issue via the registry)

There is also `script/DeployNFT.s.sol` for a standalone deploy of the SBT contract (useful while iterating on NFT logic).

### 2) Add universities (platform admin)
Platform admin calls `AltriumRegistry.addUniversity(universityAdmin)`.
This grants the university admin permissions across the system (registry role + verifier role + access manager role).

### 3) Issue a degree (university admin)
University calls:
- `AltriumRegistry.uploadDegree(collegeIdHash, degreeHash, degreeURI)`

This mints a soulbound ERC-721 token to the `custodian` address, stores the degree record, and emits `DegreeMinted`.

### 4) Verify a degree (university admin)
University calls:
- `AltriumRegistry.verifyDegree(collegeIdHash, true)`

This flips `DegreeRecord.verified` and emits `DegreeVerified`.

### 5) Employer requests access
Employer calls:
- `AltriumRegistry.requestAccess(collegeIdHash, purpose)`

This creates an access request and emits `AccessRequested`.

### 6) University approves / denies
University calls:
- `AltriumRegistry.approveEmployerRequest(requestId)` OR `denyEmployerRequest(requestId)`

If approved, `accessGranted[collegeIdHash][employer]` becomes `true`.

### 7) Employer reads credential (if approved)
Employer calls:
- `AltriumRegistry.getDegreeForEmployer(collegeIdHash)`

If access is not granted, it reverts with `access not granted`.

## Folder setup (from scratch)

### Prerequisites
- Install Foundry: follow the Foundry book at `https://book.getfoundry.sh/getting-started/installation`

### Create the Foundry project
From the repository root:

```bash
forge init contracts --no-commit
```

### Install dependencies into `contracts/lib/`
From `contracts/`:

```bash
forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts --no-commit
```

### Configure remappings
Ensure `contracts/foundry.toml` contains:

```toml
remappings = [
  "forge-std/=lib/forge-std/src/",
  "@openzeppelin/=lib/openzeppelin-contracts/",
]
```

### Add environment variables (deploy)
Create `contracts/.env` (do **not** commit it) with at least:

```bash
PRIVATE_KEY=...
RPC_URL=...
```

### Build / format / test
From `contracts/`:

```bash
forge fmt
forge build
forge test -vvv
```

## Deploying

### Local (Anvil)
In one terminal:

```bash
anvil
```

In another terminal (from `contracts/`):

```bash
source .env
forge script script/Deploy.s.sol:DeployScript --rpc-url "$RPC_URL" --broadcast --private-key "$PRIVATE_KEY"
```

### Testnet / mainnet
Same command as above, but set `RPC_URL` to your network endpoint and use a funded deployer key.

## Design notes / assumptions
- `collegeIdHash` must be derived off-chain (e.g., `keccak256(abi.encodePacked(collegeId, salt))`) to avoid leaking identifiers.
- `degreeHash` should commit to the full off-chain credential payload; you can rotate the `tokenURI` without losing integrity as long as `degreeHash` stays meaningful for verification.
- The SBT is minted to a custodian wallet; if you want student-owned SBTs later, you can change `custodian` and mint destination, but keep the transfer lock if you still want it soulbound.
