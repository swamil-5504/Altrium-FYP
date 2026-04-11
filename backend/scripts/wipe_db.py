import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.models.models import User, Credential
from app.core.config import settings

async def wipe_db():
    print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]
    
    print("Initializing Beanie models...")
    await init_beanie(database=db, document_models=[User, Credential])
    
    # Check credentials
    creds_count = await Credential.count()
    print(f"Found {creds_count} credentials to delete.")
    
    if creds_count > 0:
        await Credential.find_all().delete()
        print("✅ All credentials successfully deleted.")
    else:
        print("⚠️ No credentials to delete.")

    # We keep the Users so they don't have to re-register
    users_count = await User.count()
    print(f"Retaining {users_count} Users.")

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(wipe_db())
