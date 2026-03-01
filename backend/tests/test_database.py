import pytest
import asyncio
from app.core.config import settings
import app.db.session as session
from beanie import init_beanie
from app.models.models import User, Credential
from uuid import uuid4


@pytest.fixture(scope="function", autouse=True)
async def init_test_db():
    # reset and reinitialize mongo client to ensure same asyncio loop
    session.client = None
    session.init_db()
    db = session.client[settings.MONGODB_DB]
    await init_beanie(database=db, document_models=[User, Credential])
    # ensure empty collections for testing
    await db.users.delete_many({})
    await db.credentials.delete_many({})
    yield
    # clean up after tests
    await db.users.drop()
    await db.credentials.drop()


@pytest.mark.asyncio
async def test_create_user_and_query():
    user = User(id=uuid4(), email="tester@example.com", hashed_password="secret")
    await user.insert()
    assert user.id is not None

    fetched = await User.get(user.id)
    assert fetched is not None
    assert fetched.email == "tester@example.com"


@pytest.mark.asyncio
async def test_credential_creation():
    # create a dummy issuer and owner
    issuer = User(id=uuid4(), email="iss@example.com", hashed_password="foo")
    owner = User(id=uuid4(), email="own@example.com", hashed_password="bar")
    await issuer.insert()
    await owner.insert()

    cred = Credential(
        id=uuid4(),
        title="Degree",
        issued_to_id=owner.id,
        issued_by_id=issuer.id,
    )
    await cred.insert()

    fetched = await Credential.get(cred.id)
    assert fetched is not None
    assert fetched.title == "Degree"