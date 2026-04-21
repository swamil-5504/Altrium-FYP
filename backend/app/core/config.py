from pydantic_settings import BaseSettings
from typing import Optional   # 👈 ADD THIS

class Settings(BaseSettings):
    PROJECT_NAME: str = "Altrium - Degree Verification System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "altrium"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["*"]
    
    # Redis
    REDIS_URL: Optional[str] = None
    
    # Environment
    ENVIRONMENT: str = "development"

    # Web3 Integration
    WEB3_PROVIDER_URI: str = "https://rpc.sepolia.org"
    CONTRACT_SBT_ADDRESS: str = ""
    CONTRACT_REGISTRY_ADDRESS: str = ""
    PRIVATE_KEY: Optional[str] = None

    # Superadmin seeding
    SUPERADMIN_EMAIL: str = "admin@altrium.com"
    SUPERADMIN_PASSWORD: str = "123"


    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()