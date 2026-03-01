from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.db import session
from app.models import models
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

logging.basicConfig(level=logging.INFO)
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
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
def health_check():
    return {"status": "healthy"}
