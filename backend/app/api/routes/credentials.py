from fastapi import APIRouter, Depends
from typing import List
from uuid import UUID
from app.schemas.schemas import CredentialCreate, CredentialResponse, CredentialStatus, CredentialUpdate
from app.models.models import User, UserRole
from app.api.deps.auth import get_current_user, require_role
from app.core.config import settings
from app.services.degree_service import DegreeService

router = APIRouter(prefix=f"{settings.API_V1_STR}/credentials", tags=["credentials"])


def _to_response(cred) -> dict:
    """Convert a Credential document to a CredentialResponse-compatible dict,
    including the computed `has_document` flag."""
    data = cred.dict()
    data["has_document"] = bool(cred.document_path)
    return data


@router.post("/", response_model=CredentialResponse)
async def create_credential(
    credential_create: CredentialCreate,
    current_user: User = Depends(require_role(UserRole.STUDENT))
):
    cred = await DegreeService.create_submission(credential_create, current_user)
    return _to_response(cred)

@router.get("/", response_model=List[CredentialResponse])
async def get_credentials(
    current_user: User = Depends(get_current_user)
):
    creds = await DegreeService.list_for_user(current_user)
    return [_to_response(c) for c in creds]

@router.get("/public", response_model=List[CredentialResponse])
async def get_public_credentials(prn_number: str):
    creds = await DegreeService.get_public_by_prn(prn_number)
    return [_to_response(c) for c in creds]

@router.get("/{credential_id}", response_model=CredentialResponse)
async def get_credential(
    credential_id: UUID,
    current_user: User = Depends(get_current_user)
):
    cred = await DegreeService.get_by_id_for_user(credential_id, current_user)
    return _to_response(cred)

@router.patch("/{credential_id}/status", response_model=CredentialResponse)
async def update_credential_status(
    credential_id: UUID,
    status: CredentialStatus,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    cred = await DegreeService.update_status(credential_id, status, current_user.id)
    return _to_response(cred)


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
    cred = await DegreeService.update(credential_id, credential_update, current_user.id)
    return _to_response(cred)

@router.delete("/{credential_id}")
async def delete_credential(
    credential_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN))
):
    await DegreeService.delete(credential_id)
    return {"detail": "Credential deleted"}
