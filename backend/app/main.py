from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.db import session
from app.models import models
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.crud.crud import UserCRUD
from app.schemas.schemas import UserCreate
from app.models.models import UserRole
from app.api.routes import auth, users, credentials, degrees

configure_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Altrium - Degree Verification System...")
    # initialize Mongo client
    session.init_db()
    client: AsyncIOMotorClient = session.client  # type: ignore
    db = client[settings.MONGODB_DB]
    # initialize beanie with our document models
    await init_beanie(database=db, document_models=[models.User, models.Credential])

    # Seed a single University Admin (Verifier) account for demo/dev
    try:
        existing = await UserCRUD.get_by_email(settings.SEED_ADMIN_EMAIL)
        if not existing:
            seeded_user = await UserCRUD.create(
                UserCreate(
                    email=settings.SEED_ADMIN_EMAIL,
                    password=settings.SEED_ADMIN_PASSWORD,
                    full_name=settings.SEED_ADMIN_FULL_NAME,
                    role=UserRole.ADMIN,
                )
            )
            # Demo scope: seeded admin is treated as already legally verified.
            seeded_user.is_legal_admin_verified = True
            await seeded_user.save()
            logger.info("Seeded university admin user: %s", settings.SEED_ADMIN_EMAIL)
            
        # Cleanup old seeded superadmin if it exists
        old_superadmin = await UserCRUD.get_by_email("superadmin@altrium.com")
        if old_superadmin:
            await old_superadmin.delete()
            logger.info("Removed old superadmin@altrium.com account.")

        # Seed a generic Superadmin
        superadmin_email = "admin"
        super_existing = await UserCRUD.get_by_email(superadmin_email)
        if not super_existing:
            seeded_super = await UserCRUD.create(
                UserCreate(
                    email=superadmin_email,
                    password="123",
                    full_name="Platform Superadmin",
                    role=UserRole.SUPERADMIN,
                )
            )
            seeded_super.is_legal_admin_verified = True
            await seeded_super.save()
            logger.info("Seeded superadmin user: %s", superadmin_email)
    except Exception as e:
        # Don't crash startup if seeding fails (e.g., transient DB issues)
        logger.error("Admin seeding failed: %s", str(e))
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Add CORS middleware (must come before routes so preflight OPTIONS works)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(credentials.router)
app.include_router(degrees.router)
register_exception_handlers(app)

@app.get("/")
def root():
    return {
        "message": "Altrium - Degree Verification System API",
        "version": settings.VERSION,
        "docs": f"{settings.API_V1_STR}/docs"
    }

@app.get("/ping")
def ping():
    return {"message": "pong", "status": "ok"}

@app.get("/health")
async def health_check():
    """Health check endpoint that verifies MongoDB connection"""
    try:
        # Test MongoDB connection
        from app.models.models import User
        test_count = await User.find().count()
        return {
            "status": "healthy",
            "database": "mongodb",
            "connection": "active",
            "users_count": test_count
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.post("/api/v1/test/crud")
async def test_crud_operations(test_email: str = "test@example.com"):
    """Test CRUD operations with MongoDB"""
    from app.models.models import User
    from app.crud.crud import UserCRUD
    from app.schemas.schemas import UserCreate
    from uuid import uuid4
    
    test_result = {
        "create": None,
        "read": None,
        "update": None,
        "delete": None,
        "status": "success"
    }
    
    try:
        # CREATE
        unique_email = f"test_{uuid4().hex[:8]}@example.com"
        user_create = UserCreate(
            email=unique_email,
            password="Test123!",
            full_name="Test User",
            role="STUDENT"
        )
        test_user = await UserCRUD.create(user_create)
        test_result["create"] = {
            "success": True,
            "user_id": str(test_user.id),
            "email": test_user.email
        }
        
        # READ
        fetched = await UserCRUD.get_by_id(test_user.id)
        test_result["read"] = {
            "success": fetched is not None,
            "email": fetched.email if fetched else None
        }
        
        # UPDATE
        from app.schemas.schemas import UserUpdate
        user_update = UserUpdate(role="STUDENT")
        updated = await UserCRUD.update(test_user.id, user_update)
        test_result["update"] = {
            "success": updated is not None,
            "new_role": updated.role if updated else None
        }
        
        # DELETE
        await UserCRUD.delete(test_user.id)
        verify_deleted = await UserCRUD.get_by_id(test_user.id)
        test_result["delete"] = {"success": verify_deleted is None}
        
    except Exception as e:
        logger.error(f"CRUD test failed: {str(e)}")
        test_result["status"] = "failed"
        test_result["error"] = str(e)
    
    return test_result
