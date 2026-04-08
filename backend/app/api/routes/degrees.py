from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse

from app.api.deps.auth import get_current_user, require_role
from app.core.config import settings
from app.models.models import User, UserRole
from app.schemas.schemas import CredentialCreate, CredentialResponse, CredentialStatus, CredentialUpdate
from app.services.degree_service import DegreeService

router = APIRouter(prefix=f"{settings.API_V1_STR}/degrees", tags=["degrees"])


def _to_response(cred) -> dict:
    """Convert a Credential document to a CredentialResponse-compatible dict,
    including the computed `has_document` flag."""
    data = cred.dict()
    data["has_document"] = bool(cred.document_path)
    return data


@router.post("/", response_model=CredentialResponse)
async def create_degree(
    credential_create: CredentialCreate,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
):
    cred = await DegreeService.create_submission(credential_create, current_user)
    return _to_response(cred)


@router.get("/", response_model=List[CredentialResponse])
async def get_degrees(current_user: User = Depends(get_current_user)):
    creds = await DegreeService.list_for_user(current_user)
    return [_to_response(c) for c in creds]


@router.get("/public", response_model=List[CredentialResponse])
async def get_public_degrees(prn_number: str = None):
    if prn_number:
        creds = await DegreeService.get_public_by_prn(prn_number)
    else:
        creds = await DegreeService.get_all_public()
    return [_to_response(c) for c in creds]


@router.get("/{credential_id}", response_model=CredentialResponse)
async def get_degree(
    credential_id: UUID,
    current_user: User = Depends(get_current_user),
):
    cred = await DegreeService.get_by_id_for_user(credential_id, current_user)
    return _to_response(cred)


@router.patch("/{credential_id}/status", response_model=CredentialResponse)
async def update_degree_status(
    credential_id: UUID,
    status: CredentialStatus,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    cred = await DegreeService.update_status(credential_id, status)
    return _to_response(cred)


@router.patch("/{credential_id}", response_model=CredentialResponse)
async def update_degree(
    credential_id: UUID,
    credential_update: CredentialUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    cred = await DegreeService.update(credential_id, credential_update)
    return _to_response(cred)


@router.delete("/{credential_id}")
async def delete_degree(
    credential_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    await DegreeService.delete(credential_id)
    return {"detail": "Degree deleted"}


# ---- Document upload & download ----

@router.post("/{credential_id}/document", response_model=CredentialResponse)
async def upload_document(
    credential_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a PDF document for a degree submission."""
    cred = await DegreeService.upload_document(credential_id, file, current_user)
    return _to_response(cred)


@router.get("/{credential_id}/document")
async def download_document(
    credential_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """Download / view the PDF document for a degree submission."""
    file_path = await DegreeService.get_document_path(credential_id, current_user)
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"degree_{credential_id}.pdf",
    )
