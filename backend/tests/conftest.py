"""
Test configuration for Altrium e2e test suite.
Environment variables MUST be set before any app module is imported.
ASGITransport does NOT fire the ASGI lifespan, so we initialize Motor +
Beanie manually and seed the superadmin here.
"""
import os

os.environ["MONGODB_DB"] = "altrium_test"
os.environ["MONGODB_URL"] = "mongodb://localhost:27017"
os.environ["SECRET_KEY"] = "test-e2e-secret-key-altrium-2024"
os.environ["SUPERADMIN_EMAIL"] = "sa@altrium.test"
os.environ["SUPERADMIN_PASSWORD"] = "SuperAdmin123!"
os.environ["WEB3_PROVIDER_URI"] = ""
os.environ["CONTRACT_REGISTRY_ADDRESS"] = ""
os.environ["CONTRACT_SBT_ADDRESS"] = ""
os.environ["PRIVATE_KEY"] = ""
os.environ["UPLOAD_DIR"] = "/tmp/altrium_test_uploads"

import pytest_asyncio
from beanie import init_beanie
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.crud.crud import UserCRUD
from app.main import app
from app.models.models import Credential, User, UserRole
from app.schemas.schemas import UserCreate


@pytest_asyncio.fixture(scope="session")
async def initialized_db():
    """
    Drop the test DB, initialize Beanie, seed the superadmin.
    This replaces the ASGI lifespan that httpx's ASGITransport does not fire.
    """
    motor_client = AsyncIOMotorClient("mongodb://localhost:27017")
    await motor_client.drop_database("altrium_test")

    db = motor_client["altrium_test"]
    await init_beanie(database=db, document_models=[User, Credential])

    # Seed superadmin (mirrors app/main.py lifespan logic)
    existing = await UserCRUD.get_by_email(settings.SUPERADMIN_EMAIL)
    if not existing:
        seeded = await UserCRUD.create(
            UserCreate(
                email=settings.SUPERADMIN_EMAIL,
                password=settings.SUPERADMIN_PASSWORD,
                full_name="Platform Superadmin",
                role=UserRole.SUPERADMIN,
            )
        )
        seeded.is_legal_admin_verified = True
        await seeded.save()

    yield motor_client

    # Tear down
    await motor_client.drop_database("altrium_test")
    motor_client.close()


@pytest_asyncio.fixture(scope="session")
async def client(initialized_db) -> AsyncClient:
    """
    Shared HTTP client for the whole test session.
    Depends on initialized_db so Beanie is ready before any request is made.
    """
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


# ─── Shared user fixtures ─────────────────────────────────────────────────────

@pytest_asyncio.fixture(scope="session")
async def superadmin_token(client: AsyncClient) -> str:
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "sa@altrium.test", "password": "SuperAdmin123!"},
    )
    assert r.status_code == 200, f"Superadmin login failed: {r.text}"
    return r.json()["access_token"]


@pytest_asyncio.fixture(scope="session")
async def registered_admin(client: AsyncClient) -> dict:
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "admin@altrium.test",
            "password": "Admin123!Secure",
            "full_name": "University Admin",
            "role": "ADMIN",
            "college_name": "Altrium University",
        },
    )
    assert r.status_code == 200, f"Admin registration failed: {r.text}"
    return r.json()


@pytest_asyncio.fixture(scope="session")
async def admin_token(client: AsyncClient, registered_admin: dict) -> str:
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "admin@altrium.test", "password": "Admin123!Secure"},
    )
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return r.json()["access_token"]


@pytest_asyncio.fixture(scope="session")
async def registered_student(client: AsyncClient) -> dict:
    r = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "student@altrium.test",
            "password": "Student123!Secure",
            "full_name": "Test Student",
            "role": "STUDENT",
            "college_name": "Altrium University",
            "prn_number": "AU2024001",
        },
    )
    assert r.status_code == 200, f"Student registration failed: {r.text}"
    return r.json()


@pytest_asyncio.fixture(scope="session")
async def student_token(client: AsyncClient, registered_student: dict) -> str:
    r = await client.post(
        "/api/v1/auth/login",
        json={"email": "student@altrium.test", "password": "Student123!Secure"},
    )
    assert r.status_code == 200, f"Student login failed: {r.text}"
    return r.json()["access_token"]
