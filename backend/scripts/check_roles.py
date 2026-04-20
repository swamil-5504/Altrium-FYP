import asyncio
import os
import sys
from web3 import Web3
from dotenv import load_dotenv

# Add backend to path to import config
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.core.config import settings

# Minimal ABIs for checking roles
ACCESS_CONTROL_ABI = [
    {
        "type": "function",
        "name": "hasRole",
        "inputs": [
            {"name": "role", "type": "bytes32"},
            {"name": "account", "type": "address"}
        ],
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getRoleAdmin",
        "inputs": [{"name": "role", "type": "bytes32"}],
        "outputs": [{"name": "", "type": "bytes32"}],
        "stateMutability": "view"
    }
]

async def check_roles():
    load_dotenv()
    
    rpc_url = os.getenv("WEB3_PROVIDER_URI")
    private_key = os.getenv("PRIVATE_KEY")
    registry_address = os.getenv("CONTRACT_REGISTRY_ADDRESS")
    sbt_address = os.getenv("CONTRACT_SBT_ADDRESS")
    
    if not all([rpc_url, private_key, registry_address, sbt_address]):
        print("❌ Missing environment variables.")
        return
        
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        print("❌ Failed to connect to Web3.")
        return
        
    deployer = w3.eth.account.from_key(private_key).address
    print(f"--- Role Check ---")
    print(f"Configured Backend Wallet: {deployer}")
    print(f"Registry Contract: {registry_address}")
    print(f"SBT Contract: {sbt_address}\n")
    
    # Correct bytes32 representation for web3.py
    DEFAULT_ADMIN_ROLE = b'\x00' * 32
    UNIVERSITY_ROLE = Web3.keccak(text="UNIVERSITY_ROLE")
    VERIFIER_ROLE = Web3.keccak(text="VERIFIER_ROLE")
    
    registry = w3.eth.contract(address=registry_address, abi=ACCESS_CONTROL_ABI)
    sbt = w3.eth.contract(address=sbt_address, abi=ACCESS_CONTROL_ABI)
    
    try:
        # 1. Check Registry Admin
        is_deployer_registry_admin = registry.functions.hasRole(DEFAULT_ADMIN_ROLE, deployer).call()
        print(f"Is Backend Wallet Admin of Registry? {'✅ YES' if is_deployer_registry_admin else '❌ NO'}")
        
        # 2. Check SBT Admin
        is_deployer_sbt_admin = sbt.functions.hasRole(DEFAULT_ADMIN_ROLE, deployer).call()
        print(f"Is Backend Wallet Admin of SBT? {'✅ YES' if is_deployer_sbt_admin else '❌ NO'}")
        
        is_registry_sbt_admin = sbt.functions.hasRole(DEFAULT_ADMIN_ROLE, registry_address).call()
        print(f"Is Registry Contract Admin of SBT? {'✅ YES' if is_registry_sbt_admin else '❌ NO'}")
        
        # 3. Check Who can grant VERIFIER_ROLE on SBT
        verifier_admin_role = sbt.functions.getRoleAdmin(VERIFIER_ROLE).call()
        print(f"Admin Role for VERIFIER_ROLE on SBT: {verifier_admin_role.hex()}")
        
        can_registry_grant_verifier = sbt.functions.hasRole(verifier_admin_role, registry_address).call()
        print(f"Can Registry grant VERIFIER_ROLE on SBT? {'✅ YES' if can_registry_grant_verifier else '❌ NO'}")
        
        if not is_deployer_registry_admin:
            print("\n❌ CRITICAL: The PRIVATE_KEY in your .env belongs to a wallet that is NOT an admin of the Registry.")
            print("Transactions to approve admins will always fail until you use the correct Deployer private key.")
            
        if not can_registry_grant_verifier:
            print("\n⚠️  PERMISSION GAP: The Registry contract cannot grant roles on the SBT contract yet.")
            print("The real Superadmin needs to grant the Registry contract either DEFAULT_ADMIN_ROLE or make it an admin of VERIFIER_ROLE on the SBT.")

    except Exception as e:
        print(f"Error during check: {e}")

if __name__ == "__main__":
    asyncio.run(check_roles())
