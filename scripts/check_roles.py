import os
from web3 import Web3
from dotenv import load_dotenv

# UNIVERSITY_ROLE hash
UNIVERSITY_ROLE = Web3.keccak(text="UNIVERSITY_ROLE")

REGISTRY_ABI = [
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

def check_roles(wallet_address):
    load_dotenv("backend/.env")
    rpc_url = os.getenv("RPC_URL")
    registry_address = os.getenv("REGISTRY_ADDRESS")
    
    if not rpc_url or not registry_address:
        print("❌ Missing RPC_URL or REGISTRY_ADDRESS in backend/.env")
        return

    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        print("❌ Failed to connect to Web3")
        return

    contract = w3.eth.contract(address=registry_address, abi=REGISTRY_ABI)
    
    try:
        checksum_address = w3.to_checksum_address(wallet_address)
        has_role = contract.functions.hasRole(UNIVERSITY_ROLE, checksum_address).call()
        
        print(f"\n--- Role Check ---")
        print(f"Registry: {registry_address}")
        print(f"Wallet:   {checksum_address}")
        print(f"Has UNIVERSITY_ROLE: {'✅ YES' if has_role else '❌ NO'}")
        
        if not has_role:
            print("\n💡 Tip: You might be using a different wallet in MetaMask than the one verified by the admin.")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    import sys
    wallet = sys.argv[1] if len(sys.argv) > 1 else None
    if not wallet:
        print("Usage: python scripts/check_roles.py <wallet_address>")
    else:
        check_roles(wallet)
