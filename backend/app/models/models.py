from enum import Enum as PyEnum
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

from beanie import Document, Indexed
from pydantic import Field

# we keep the same enums so they can be reused in schemas
class UserRole(str, PyEnum):
    ADMIN = "ADMIN"
    STUDENT = "STUDENT"
    SUPERADMIN = "SUPERADMIN"

class CredentialStatus(str, PyEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class User(Document):
    id: UUID = Field(default_factory=uuid4)
    email: str = Indexed(unique=True)
    full_name: Optional[str] = None
    hashed_password: str
    role: UserRole = UserRole.STUDENT
    prn_number: Optional[str] = None
    is_active: bool = True
    # Demo/demo-scope: only admins that are "legally verified" are allowed
    # to approve + mint credentials.
    is_legal_admin_verified: bool = False
    college_name: Optional[str] = None
    wallet_address: Optional[str] = None
    verification_document_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"

class Credential(Document):
    id: UUID = Field(default_factory=uuid4)
    title: str
    description: Optional[str] = None
    issued_to_id: UUID
    issued_by_id: UUID
    status: CredentialStatus = CredentialStatus.PENDING
    metadata_json: Optional[dict] = None
    document_path: Optional[str] = None
    token_id: Optional[int] = None
    tx_hash: Optional[str] = None
    prn_number: Optional[str] = None
    college_name: Optional[str] = None
    revoked: bool = False
    revoked_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "credentials"
