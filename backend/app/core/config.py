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

    # Trusted hosts (Host/Origin header allowlist)
    ALLOWED_HOSTS: list = ["*"]

    # Redis
    REDIS_URL: Optional[str] = None

    # Environment
    ENVIRONMENT: str = "development"

    # Allow unauthenticated self-service password reset (dev/testing only).
    # MUST be false in production — the prod guard in main.py refuses to boot
    # otherwise.
    ALLOW_SELF_SERVE_PASSWORD_RESET: bool = True

    # Web3 Integration
    WEB3_PROVIDER_URI: str = "https://rpc.sepolia.org"
    CONTRACT_SBT_ADDRESS: str = ""
    CONTRACT_REGISTRY_ADDRESS: str = ""
    PRIVATE_KEY: Optional[str] = None

    # Superadmin seeding — dev defaults only. In production, these MUST be
    # overridden via environment variables / a secrets manager. The prod-
    # config guard in main.py refuses to boot in production if either value
    # matches a known-insecure default or fails the password policy.
    SUPERADMIN_EMAIL: str = "admin@altrium.com"
    SUPERADMIN_PASSWORD: str = "Altrium123!Dev"

    # Notifications (Zero-Config Telegram Push)
    TELEGRAM_BOT_TOKEN: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()