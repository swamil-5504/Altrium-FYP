from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.deps.auth import get_current_user, require_role
from app.core.config import settings
from app.models.models import User, UserRole
from app.schemas.schemas import CredentialCreate, CredentialResponse, CredentialStatus, CredentialUpdate
from app.services.degree_service import DegreeService

router = APIRouter(prefix=f"{settings.API_V1_STR}/degrees", tags=["degrees"])


@router.post("/", response_model=CredentialResponse)
async def create_degree(
    credential_create: CredentialCreate,
    current_user: User = Depends(require_role(UserRole.STUDENT)),
):
    return await DegreeService.create_submission(credential_create, current_user)


@router.get("/", response_model=List[CredentialResponse])
async def get_degrees(current_user: User = Depends(get_current_user)):
    return await DegreeService.list_for_user(current_user)


@router.get("/public", response_model=List[CredentialResponse])
async def get_public_degrees(prn_number: str):
    return await DegreeService.get_public_by_prn(prn_number)


@router.get("/{credential_id}", response_model=CredentialResponse)
async def get_degree(
    credential_id: UUID,
    current_user: User = Depends(get_current_user),
):
    return await DegreeService.get_by_id_for_user(credential_id, current_user)


@router.patch("/{credential_id}/status", response_model=CredentialResponse)
async def update_degree_status(
    credential_id: UUID,
    status: CredentialStatus,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return await DegreeService.update_status(credential_id, status)


@router.patch("/{credential_id}", response_model=CredentialResponse)
async def update_degree(
    credential_id: UUID,
    credential_update: CredentialUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    return await DegreeService.update(credential_id, credential_update)


@router.delete("/{credential_id}")
async def delete_degree(
    credential_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    await DegreeService.delete(credential_id)
    return {"detail": "Degree deleted"}
