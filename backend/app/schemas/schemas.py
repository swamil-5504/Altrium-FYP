from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STUDENT = "STUDENT"
    SUPERADMIN = "SUPERADMIN"
    EMPLOYER = "EMPLOYER"

class CredentialStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

# User Schemas
class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    role: UserRole = UserRole.STUDENT
    college_name: Optional[str] = None
    wallet_address: Optional[str] = None
    prn_number: Optional[str] = None
    college_name: Optional[str] = None
    wallet_address: Optional[str] = None
    prn_number: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None

class UserResponse(UserBase):
    id: UUID
    college_name: Optional[str] = None
    prn_number: Optional[str] = None
    college_name: Optional[str] = None
    prn_number: Optional[str] = None
    is_active: bool
    is_legal_admin_verified: bool = False
    is_legal_admin_verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

# Credential Schemas
class CredentialBase(BaseModel):
    title: str
    description: Optional[str] = None
    metadata_json: Optional[dict] = None

class CredentialCreate(CredentialBase):
    # Optional so STUDENT submissions can omit it; backend will attach it to the logged-in student.
    issued_to_id: Optional[UUID] = None
    token_id: Optional[int] = None
    tx_hash: Optional[str] = None
    prn_number: Optional[str] = None
    college_name: Optional[str] = None
    prn_number: Optional[str] = None
    college_name: Optional[str] = None

class CredentialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CredentialStatus] = None
    metadata_json: Optional[dict] = None
    token_id: Optional[int] = None
    tx_hash: Optional[str] = None
    revoked: Optional[bool] = None
    revoked: Optional[bool] = None

class CredentialResponse(CredentialBase):
    id: UUID
    issued_to_id: UUID
    issued_by_id: UUID
    status: CredentialStatus
    token_id: Optional[int] = None
    tx_hash: Optional[str] = None
    prn_number: Optional[str] = None
    college_name: Optional[str] = None
    has_document: bool = False
    revoked: bool = False
    revoked: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Auth Schemas
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_expires_in: int

class LoginRequest(BaseModel):
    email: str
    password: str
    ignore_verification: bool = False

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RegisterRequest(UserCreate):
    pass
