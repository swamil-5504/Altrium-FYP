from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.crud.crud import UserCRUD
from app.schemas.schemas import LoginRequest, RegisterRequest


class AuthService:
    @staticmethod
    async def register(request: RegisterRequest):
        existing_user = await UserCRUD.get_by_email(request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        return await UserCRUD.create(request)

    @staticmethod
    async def login(request: LoginRequest) -> dict:
        user = await UserCRUD.authenticate(request.email, request.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )
            
        if user.role == "ADMIN" and not user.is_legal_admin_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin account pending verification. Please wait for platform admin approval."
            )
            
        return AuthService.issue_token_pair(str(user.id))

    @staticmethod
    def issue_token_pair(user_id: str) -> dict:
        access_token = create_access_token(data={"sub": user_id})
        refresh_token = create_refresh_token(data={"sub": user_id})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "refresh_expires_in": settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        }

    @staticmethod
    def refresh(refresh_token: str) -> dict:
        payload = decode_token(refresh_token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        return AuthService.issue_token_pair(str(user_id))
