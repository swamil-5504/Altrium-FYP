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

from fastapi import UploadFile, File, Form, HTTPException, status
import shutil
import os
from uuid import UUID
from app.models.models import User

@router.post("/{user_id}/verification-document")
async def upload_verification_document(user_id: UUID, file: UploadFile = File(...)):
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
async def logout():
    """
    Stateless JWT logout is handled client-side by deleting tokens.
    This endpoint exists for symmetry with login flows.
    """
    return {"detail": "Logged out"}
