from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db.session import get_db
from app.schemas.schemas import CredentialCreate, CredentialResponse, CredentialUpdate, CredentialStatus
from app.models.models import User, UserRole, Credential
from app.crud.crud import CredentialCRUD, UserCRUD
from app.api.deps import get_current_user, require_role
from app.core.config import settings

router = APIRouter(prefix=f"{settings.API_V1_STR}/credentials", tags=["credentials"])

@router.post("/", response_model=CredentialResponse)
def create_credential(
    credential_create: CredentialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    # Verify student exists
    student = UserCRUD.get_by_id(db, credential_create.issued_to_id)
    if not student or student.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    credential = CredentialCRUD.create(db, credential_create, current_user.id)
    return credential

@router.get("/", response_model=List[CredentialResponse])
def get_credentials(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.ADMIN:
        return CredentialCRUD.get_all(db)
    elif current_user.role == UserRole.STUDENT:
        return CredentialCRUD.get_by_user(db, current_user.id)
    elif current_user.role == UserRole.EMPLOYER:
        # Employers can see all credentials (read-only)
        return CredentialCRUD.get_all(db)
    return []

@router.get("/{credential_id}", response_model=CredentialResponse)
def get_credential(
    credential_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    credential = CredentialCRUD.get_by_id(db, credential_id)
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )
    
    # Authorization check
    if current_user.role == UserRole.STUDENT and credential.issued_to_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    return credential

@router.patch("/{credential_id}/status", response_model=CredentialResponse)
def update_credential_status(
    credential_id: UUID,
    status: CredentialStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    credential = CredentialCRUD.update_status(db, credential_id, status)
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )
    return credential

@router.delete("/{credential_id}")
def delete_credential(
    credential_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    success = CredentialCRUD.delete(db, credential_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )
    return {"detail": "Credential deleted"}
