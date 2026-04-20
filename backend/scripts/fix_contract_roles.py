import asyncio
import os
import sys
from web3 import Web3
from dotenv import load_dotenv

# Add backend to path to import config
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from app.core.config import settings

# Minimal ABIs for granting roles
ACCESS_CONTROL_ABI = [
    {
        "type": "function",
        "name": "grantRole",
        "inputs": [
            {"name": "role", "type": "bytes32"},
            {"name": "account", "type": "address"}
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
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

async def fix_roles():
    load_dotenv()
    
    rpc_url = os.getenv("WEB3_PROVIDER_URI")
    # We assume the user enters the TRUE superadmin key in .env temporarily to run this
    private_key = os.getenv("PRIVATE_KEY")
    registry_address = os.getenv("CONTRACT_REGISTRY_ADDRESS")
    sbt_address = os.getenv("CONTRACT_SBT_ADDRESS")
    
    if not all([rpc_url, private_key, registry_address, sbt_address]):
        print("❌ Missing environment variables in backend/.env.")
        return
        
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        print("❌ Failed to connect to Web3.")
        return
        
    account = w3.eth.account.from_key(private_key)
    print(f"Executing role fix with wallet: {account.address}")
    
    DEFAULT_ADMIN_ROLE = b'\x00' * 32
    
    sbt = w3.eth.contract(address=sbt_address, abi=ACCESS_CONTROL_ABI)
    
    print(f"Checking if {account.address} is admin of SBT...")
    is_admin = sbt.functions.hasRole(DEFAULT_ADMIN_ROLE, account.address).call()
    
    if not is_admin:
        print(f"❌ Wallet {account.address} is NOT an admin of the SBT contract.")
        print("Please put the ORIGINAL DEPLOYER private key in backend/.env before running this script.")
        return

    print(f"Granting DEFAULT_ADMIN_ROLE to Registry ({registry_address}) on SBT ({sbt_address})...")
    
    try:
        tx = sbt.functions.grantRole(
            DEFAULT_ADMIN_ROLE, 
            registry_address
        ).build_transaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address),
            'gas': 100000,
            'gasPrice': w3.eth.gas_price
        })
        
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        print(f"Transaction sent! Hash: {tx_hash.hex()}")
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        if receipt.status == 1:
            print("✅ SUCCESS: Registry now has admin permissions on SBT.")
        else:
            print("❌ FAILED: Transaction reverted.")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(fix_roles())
