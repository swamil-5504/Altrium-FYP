from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Altrium - Degree Verification System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database configuration (MongoDB)
    # URL to connect to MongoDB; could include credentials, e.g. mongodb://user:pass@localhost:27017
    MONGODB_URL: str = "mongodb://localhost:27017"
    # Name of the database to use
    MONGODB_DB: str = "altrium"

    # legacy SQLite setting (ignored/not used)
    DATABASE_URL: Optional[str] = None
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["*"]
    
    # Redis (optional)
    REDIS_URL: Optional[str] = None
    
    # Environment
    ENVIRONMENT: str = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
