import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.models.models import User, UserRole
from app.core.security import hash_password
from app.core.config import settings

async def reset_db():
    print('Connecting to MongoDB...')
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.MONGODB_DB_NAME], document_models=[User])
    
    users = [
        {'email': 'admin@altrium.com', 'pwd': 'admin123', 'name': 'Demo Admin', 'role': UserRole.ADMIN},
        {'email': 'student@altrium.com', 'pwd': 'student123', 'name': 'Demo Student', 'role': UserRole.STUDENT},
        {'email': 'employer@altrium.com', 'pwd': 'employer123', 'name': 'Demo Employer', 'role': UserRole.EMPLOYER}
    ]
    
    for u in users:
        existing = await User.find_one(User.email == u['email'])
        if existing:
            existing.hashed_password = hash_password(u['pwd'])
            existing.role = u['role']
            await existing.save()
            print(f"Updated {u['email']} password to {u['pwd']}")
        else:
            new_user = User(
                email=u['email'],
                hashed_password=hash_password(u['pwd']),
                full_name=u['name'],
                role=u['role']
            )
            await new_user.insert()
            print(f"Created {u['email']}")

if __name__ == '__main__':
    asyncio.run(reset_db())
