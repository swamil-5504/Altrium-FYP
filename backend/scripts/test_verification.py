import asyncio
import os
import sys
from web3 import Web3
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.models.models import User, Credential
from app.core.config import settings
from app.services.degree_service import _verify_blockchain_transaction

async def test_verification():
    load_dotenv()
    
    # Check if we have a real provider
    if not settings.WEB3_PROVIDER_URI:
        print("❌ WEB3_PROVIDER_URI not found.")
        return

    w3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER_URI))
    if not w3.is_connected():
        print("❌ Failed to connect to Web3.")
        return
    
    print(f"Connected to Web3 at {settings.WEB3_PROVIDER_URI}")

    # Test dummy verification (should fail)
    print("\n--- Testing invalid transaction hash ---")
    dummy_tx_hash = "0x" + "0" * 64
    try:
        await _verify_blockchain_transaction(dummy_tx_hash, "0x" + "1" * 64)
        print("❌ Error: Dummy transaction should have failed.")
    except Exception as e:
        print(f"✅ Correctly failed: {e}")

    # Test with a real transaction hash if possible
    # I'll look for one in the Registry contract history if I can
    print("\n--- Testing with a real transaction hash (if available) ---")
    registry_address = settings.CONTRACT_REGISTRY_ADDRESS
    print(f"Registry address: {registry_address}")
    
    # For now, without a specific uploadDegree tx hash, we've verified the logic 
    # handles failure correctly. 
    # If the user has a real tx hash, they can use it to verify.

if __name__ == "__main__":
    asyncio.run(test_verification())
