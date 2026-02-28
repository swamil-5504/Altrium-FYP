from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STUDENT = "STUDENT"
    EMPLOYER = "EMPLOYER"

class CredentialStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.STUDENT

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Credential Schemas
class CredentialBase(BaseModel):
    title: str
    description: Optional[str] = None
    metadata_json: Optional[dict] = None

class CredentialCreate(CredentialBase):
    issued_to_id: UUID

class CredentialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CredentialStatus] = None
    metadata_json: Optional[dict] = None

class CredentialResponse(CredentialBase):
    id: UUID
    issued_to_id: UUID
    issued_by_id: UUID
    status: CredentialStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Auth Schemas
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(UserCreate):
    pass
