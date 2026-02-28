from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, JSON, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from enum import Enum as PyEnum
from app.db.base_class import Base

class UserRole(str, PyEnum):
    ADMIN = "ADMIN"
    STUDENT = "STUDENT"
    EMPLOYER = "EMPLOYER"

class CredentialStatus(str, PyEnum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    credentials_issued = relationship("Credential", foreign_keys="Credential.issued_by_id", back_populates="issued_by")
    credentials_owned = relationship("Credential", foreign_keys="Credential.issued_to_id", back_populates="issued_to")

class Credential(Base):
    __tablename__ = "credentials"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    issued_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    issued_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(Enum(CredentialStatus), default=CredentialStatus.PENDING)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    issued_to = relationship("User", foreign_keys=[issued_to_id], back_populates="credentials_owned")
    issued_by = relationship("User", foreign_keys=[issued_by_id], back_populates="credentials_issued")
