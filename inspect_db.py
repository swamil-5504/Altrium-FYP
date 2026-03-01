# utility script for inspecting the MongoDB database
import os, sys, asyncio

# make sure backend directory is on the import path so we can import the app package
sys.path.insert(0, os.path.abspath("backend"))

from app.core.config import settings
from app.db import session

async def main():
    session.init_db()
    client = session.client
    db = client[settings.MONGODB_DB]

    print("collections:", await db.list_collection_names())
    for coll in ["users", "credentials"]:
        print(f"\nfirst documents in {coll}:")
        cursor = db[coll].find().limit(5)
        async for doc in cursor:
            print(doc)

if __name__ == "__main__":
    asyncio.run(main())