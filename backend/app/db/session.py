from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# create a global Mongo client instance
client: AsyncIOMotorClient | None = None

def init_db():
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.MONGODB_URL)

async def get_db():
    """Dependency that yields a database object."""
    # ensure client has been initialized (called from startup event)
    if client is None:
        init_db()
    db = client[settings.MONGODB_DB]
    try:
        yield db
    finally:
        # motor client doesn't need to be closed on each request
        pass
