Resolution Summary: Admin Auth & On-Chain Permissions
This document outlines the chain of errors we encountered during the Admin verification flow and how we resolved them.

1. Approval Block (Web2 Level)
Error: The backend logic for verify-admin required a user to have a 
wallet_address
 before the Superadmin could approve them. However, admins only connect their wallets after logging into their dashboard.
Fix: Modified the backend to allow approval without a wallet. The on-chain permission step is now deferred until the wallet is actually connected.
2. Partial Permission Grant (Web3 Level)
Error: Previously, the code only granted the UNIVERSITY_ROLE on the Registry contract. It missed the VERIFIER_ROLE on the SBT (Degree) contract, leading to CALL_EXCEPTION when trying to mint.
Fix: Replaced the bare grantRole call with addUniversity() which handles both contracts simultaneously.
3. The "Permission Gap" (Smart Contract Level)
Error: The Registry contract is a separate entity from the SBT contract. When the Registry tried to grant roles on the SBT, the SBT contract rejected it because the Registry didn't have permission to manage roles on the SBT.
Fix: Created and ran 
fix_contract_roles.py
 to grant the Registry contract the DEFAULT_ADMIN_ROLE on the SBT contract.
4. Environment & Keys (Operation Level)
Error: The 
backend/.env
 file was using the University Admin's private key instead of the Superadmin's private key. This caused transactions to fail because the Admin was trying to grant roles to themselves.
Fix: Used diagnostic scripts (
check_roles.py
) to identify that the sender address was unauthorized. Reverted the PRIVATE_KEY to the working Superadmin key.
5. ABI Misalignment (Code Level)
Error: The backend and the helper scripts were using an old ABI that didn't include the addUniversity function.
Fix: Updated REGISTRY_ABI in all Python files to match the current Solidity contract.
6. Local vs. Docker Connectivity (Infrastructure Level)
Error: Running the verification script on the host machine failed because it couldn't reach the database (not exposed to localhost).
Fix: Transitioned to running all management scripts using docker exec inside the backend container.
Final Working Flow:
Approval: Superadmin approves the admin in the Superadmin UI.
Activation: Admin logs in, connects wallet.
Automatic Provisioning: The backend catches the wallet connection and automatically triggers addUniversity on-chain.
Ready to Mint: The admin can now mint and verify degrees successfully.