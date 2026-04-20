from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.schemas.schemas import (
    LoginRequest,
    RefreshTokenRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.core.config import settings
from app.services.auth_service import AuthService
from app.core.limiter import limiter
from app.api.deps.auth import get_current_user
from app.models.models import User, UserRole

router = APIRouter(prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
@limiter.limit("50/minute")
async def register(request: Request, reg_request: RegisterRequest):
    return await AuthService.register(reg_request)

@router.post("/login", response_model=TokenResponse)
@limiter.limit("50/minute")
async def login(request: Request, login_request: LoginRequest):
    return await AuthService.login(login_request)

@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("50/minute")
async def refresh(request: Request, refresh_request: RefreshTokenRequest):
    return AuthService.refresh(refresh_request.refresh_token)


from fastapi import UploadFile, File, Form, HTTPException, status
import shutil
import os
from uuid import UUID
from app.models.models import User

@router.post("/{user_id}/verification-document")
async def upload_verification_document(
    user_id: UUID, 
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Only the user themselves or a superadmin can upload the verification document
    if current_user.role != UserRole.SUPERADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to upload documentation for this user")

    user = await User.get(user_id)

    if not user:
         raise HTTPException(status_code=404, detail="User not found")
         
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/verification_{user_id}.pdf"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    user.verification_document_path = file_path
    await user.save()
    return {"detail": "Document uploaded successfully"}


@router.post("/logout")
async def logout(request: Request):
    """
    Stateless JWT logout is handled client-side, but if a token is provided, 
    we blacklist it server-side to prevent session reuse until expiry.
    """
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            from app.models.models import BlacklistedToken
            from datetime import datetime, timedelta
            # Blacklist the token
            blacklist = BlacklistedToken(
                token=token,
                expires_at=datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            )
            await blacklist.insert()
        except Exception:
            pass # Ignore errors during optional logout blacklisting
            
    return {"detail": "Logged out and token blacklisted"}

