from fastapi import APIRouter
from app.schemas.schemas import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.core.config import settings
from app.services.auth_service import AuthService

router = APIRouter(prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
async def register(request: RegisterRequest):
    return await AuthService.register(request)

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    return await AuthService.login(request)

@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: RefreshTokenRequest):
    return AuthService.refresh(request.refresh_token)


@router.post("/logout")
async def logout():
    """
    Stateless JWT logout is handled client-side by deleting tokens.
    This endpoint exists for symmetry with login flows.
    """
    return {"detail": "Logged out"}
