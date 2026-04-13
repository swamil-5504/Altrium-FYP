import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.models.models import User, Credential
from app.core.config import settings
from app.crud.crud import UserCRUD
from app.schemas.schemas import UserCreate

async def create_superadmin():
    print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB]
    await init_beanie(database=db, document_models=[User, Credential])
    
    superadmin_email = "superadmin@altrium.com"
    superadmin_password = "admin"
    
    existing = await User.find_one(User.email == superadmin_email)
    if existing:
        print(f"Superadmin already exists: {superadmin_email}")
        return
        
    print(f"Creating superadmin: {superadmin_email} with password '{superadmin_password}'...")
    
    user_create = UserCreate(
        email=superadmin_email,
        password=superadmin_password,
        full_name="Platform Superadmin",
        role="SUPERADMIN"
    )
    
    user = await UserCRUD.create(user_create)
    user.is_legal_admin_verified = True # Bypass legal checks
    await user.save()
    
    print("✅ Superadmin created successfully.")

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(create_superadmin())
