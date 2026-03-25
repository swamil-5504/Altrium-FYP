from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.schemas.schemas import CredentialCreate, CredentialResponse, CredentialStatus, CredentialUpdate
from app.models.models import User, UserRole
from app.crud.crud import CredentialCRUD, UserCRUD
from app.api.deps import get_current_user, require_role
from app.core.config import settings

router = APIRouter(prefix=f"{settings.API_V1_STR}/credentials", tags=["credentials"])

@router.post("/", response_model=CredentialResponse)
async def create_credential(
    credential_create: CredentialCreate,
    current_user: User = Depends(require_role(UserRole.STUDENT))
):
    # STUDENT uploads a submission; backend attaches it to the logged-in student.
    credential = await CredentialCRUD.create(
        credential_create=credential_create,
        issued_to_id=current_user.id,
        issued_by_id=current_user.id,
    )
    return credential

@router.get("/", response_model=List[CredentialResponse])
async def get_credentials(
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.ADMIN:
        if not getattr(current_user, "is_legal_admin_verified", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin is not legally verified",
            )
        return await CredentialCRUD.get_all()
    elif current_user.role == UserRole.STUDENT:
        return await CredentialCRUD.get_by_user(current_user.id)
    elif current_user.role == UserRole.EMPLOYER:
        # Employers should only see credentials that are verified/approved
        credentials = await CredentialCRUD.get_all()
        return [c for c in credentials if c.status == CredentialStatus.APPROVED]
    return []

@router.get("/public", response_model=List[CredentialResponse])
async def get_public_credentials(prn_number: str):
    """
    Public read for EMPLOYERS (no JWT):
    returns only APPROVED credentials filtered by PRN.
    """
    return await CredentialCRUD.get_approved_by_prn(prn_number)

@router.get("/{credential_id}", response_model=CredentialResponse)
async def get_credential(
    credential_id: UUID,
    current_user: User = Depends(get_current_user)
):
    credential = await CredentialCRUD.get_by_id(credential_id)
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )

    # Authorization check
    if current_user.role == UserRole.ADMIN:
        if not getattr(current_user, "is_legal_admin_verified", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin is not legally verified",
            )
    if current_user.role == UserRole.STUDENT and credential.issued_to_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    if current_user.role == UserRole.EMPLOYER and credential.status != CredentialStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    return credential

@router.patch("/{credential_id}/status", response_model=CredentialResponse)
async def update_credential_status(
    credential_id: UUID,
    status: CredentialStatus,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    credential = await CredentialCRUD.update(
        credential_id,
        CredentialUpdate(status=status),
    )
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )
    return credential


@router.patch("/{credential_id}", response_model=CredentialResponse)
async def update_credential(
    credential_id: UUID,
    credential_update: CredentialUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    """
    ADMIN approves a submission and persists on-chain tx details.
    Expected body fields (all optional): status, tx_hash, token_id, title, description, metadata_json.
    """
    credential = await CredentialCRUD.update(credential_id, credential_update)
    if not credential:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found",
        )
    return credential

@router.delete("/{credential_id}")
async def delete_credential(
    credential_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    success = await CredentialCRUD.delete(credential_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )
    return {"detail": "Credential deleted"}
