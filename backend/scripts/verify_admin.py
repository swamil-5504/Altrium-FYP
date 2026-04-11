import asyncio
import os
import sys
import argparse
from web3 import Web3
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.models.models import User, Credential
from app.core.config import settings

# Same ABI as used in frontend
REGISTRY_ABI = [{
    "type": "function",
    "name": "grantRole",
    "inputs": [
        {"name": "role", "type": "bytes32"},
        {"name": "account", "type": "address"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
}]

# UNIVERSITY_ROLE = keccak256("UNIVERSITY_ROLE")
UNIVERSITY_ROLE = Web3.keccak(text="UNIVERSITY_ROLE")

async def verify_admin(email: str):
    print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]
    await init_beanie(database=db, document_models=[User, Credential])
    
    user = await User.find_one({"email": email})
    if not user:
        print(f"❌ User with email {email} not found.")
        return
        
    if user.role != "ADMIN":
        print(f"❌ User {email} is not an ADMIN. Verification is only for admins.")
        return
        
    if user.is_legal_admin_verified:
        print(f"⚠️  User {email} is already verified.")
        return
        
    if not user.wallet_address:
        print(f"❌ User {email} does not have a wallet address set. They must reconnect their wallet in the UI.")
        return
        
    print(f"✅ Found Admin: {user.full_name} ({user.email})")
    print(f"🏫 College: {user.college_name}")
    print(f"📁 Document: {user.verification_document_path}")
    print(f"🦊 Wallet: {user.wallet_address}")
    
    print("\n--- Processing On-Chain Verification ---")
    rpc_url = os.getenv("RPC_URL", "https://sepolia.infura.io/v3/YOUR_PROJECT_ID")
    private_key = os.getenv("PRIVATE_KEY")
    registry_address = os.getenv("REGISTRY_ADDRESS")
    
    if not private_key or not registry_address:
        print("❌ Missing PRIVATE_KEY or REGISTRY_ADDRESS in backend/.env")
        print("Make sure you copied these from your contract deployment.")
        return
        
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        print(f"❌ Failed to connect to Web3 RPC: {rpc_url}")
        return
        
    account = w3.eth.account.from_key(private_key)
    registry_contract = w3.eth.contract(address=registry_address, abi=REGISTRY_ABI)
    
    admin_wallet = w3.to_checksum_address(user.wallet_address)
    
    print(f"Granting UNIVERSITY_ROLE to {admin_wallet}...")
    
    try:
        tx = registry_contract.functions.grantRole(
            UNIVERSITY_ROLE, 
            admin_wallet
        ).build_transaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address),
            'gas': 200000,
            'gasPrice': w3.eth.gas_price
        })
        
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        print(f"Transaction sent! Tx Hash: {tx_hash.hex()}")
        
        # Wait for receipt
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt.status == 1:
            print("✅ Transaction successful!")
        else:
            print("❌ Transaction failed on-chain.")
            return
            
    except Exception as e:
        print(f"❌ Error during blockchain transaction: {e}")
        return
        
    # Update Database
    user.is_legal_admin_verified = True
    await user.save()
    print(f"\n🎉 Success! {user.email} is now fully verified. They can now log in.")

if __name__ == "__main__":
    load_dotenv()
    parser = argparse.ArgumentParser(description="Verify a University Admin")
    parser.add_argument("email", type=str, help="Email of the admin to verify")
    args = parser.parse_args()
    
    asyncio.run(verify_admin(args.email))
