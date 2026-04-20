import asyncio
import os
import sys
from web3 import Web3
from dotenv import load_dotenv

# Add backend to path to import config
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.core.config import settings

# Minimal ABIs
REGISTRY_ABI = [
    {
        "type": "function",
        "name": "degreeSBT",
        "inputs": [],
        "outputs": [{"name": "", "type": "address"}],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "hasRole",
        "inputs": [
            {"name": "role", "type": "bytes32"},
            {"name": "account", "type": "address"}
        ],
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view"
    }
]

SBT_ABI = [
    {
        "type": "function",
        "name": "hasRole",
        "inputs": [
            {"name": "role", "type": "bytes32"},
            {"name": "account", "type": "address"}
        ],
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view"
    }
]

async def check_addresses():
    load_dotenv()
    
    rpc_url = os.getenv("WEB3_PROVIDER_URI")
    registry_address = os.getenv("CONTRACT_REGISTRY_ADDRESS")
    sbt_address_in_env = os.getenv("CONTRACT_SBT_ADDRESS")
    
    if not all([rpc_url, registry_address, sbt_address_in_env]):
        print("❌ Missing environment variables.")
        return
        
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        print("❌ Failed to connect to Web3.")
        return
        
    print(f"--- Contract Address Sync Check ---")
    print(f"Registry in .env: {registry_address}")
    print(f"SBT in .env:      {sbt_address_in_env}\n")
    
    registry = w3.eth.contract(address=registry_address, abi=REGISTRY_ABI)
    
    try:
        sbt_address_in_registry = registry.functions.degreeSBT().call()
        print(f"SBT address stored INSIDE Registry: {sbt_address_in_registry}")
        
        if sbt_address_in_registry.lower() != sbt_address_in_env.lower():
            print("❌ MISMATCH DETECTED! The Registry contract is pointing to a different SBT contract.")
            print(f"Fix: Update CONTRACT_SBT_ADDRESS in your .env to {sbt_address_in_registry}")
        else:
            print("✅ MATCH! Addresses are in sync.")

        # Check if Registry is admin on the SBT it points to
        sbt_actual = w3.eth.contract(address=sbt_address_in_registry, abi=SBT_ABI)
        DEFAULT_ADMIN_ROLE = b'\x00' * 32
        is_registry_admin = sbt_actual.functions.hasRole(DEFAULT_ADMIN_ROLE, registry_address).call()
        print(f"Is Registry admin on the correct SBT? {'✅ YES' if is_registry_admin else '❌ NO'}")

    except Exception as e:
        print(f"Error during check: {e}")

if __name__ == "__main__":
    asyncio.run(check_addresses())
