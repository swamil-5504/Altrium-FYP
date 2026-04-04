from typing import List
from uuid import UUID

from fastapi import HTTPException, status

from app.crud.crud import CredentialCRUD
from app.models.models import Credential, User, UserRole
from app.schemas.schemas import CredentialCreate, CredentialStatus, CredentialUpdate


class DegreeService:
    @staticmethod
    async def create_submission(credential_create: CredentialCreate, current_user: User) -> Credential:
        return await CredentialCRUD.create(
            credential_create=credential_create,
            issued_to_id=current_user.id,
            issued_by_id=current_user.id,
        )

    @staticmethod
    async def list_for_user(current_user: User) -> List[Credential]:
        if current_user.role == UserRole.ADMIN:
            return await CredentialCRUD.get_all()
        return await CredentialCRUD.get_by_user(current_user.id)

    @staticmethod
    async def get_by_id_for_user(credential_id: UUID, current_user: User) -> Credential:
        credential = await CredentialCRUD.get_by_id(credential_id)
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found",
            )

        if current_user.role == UserRole.ADMIN:
            pass  # Admins can view any submission
        elif credential.issued_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized",
            )

        return credential

    @staticmethod
    async def get_public_by_prn(prn_number: str) -> List[Credential]:
        return await CredentialCRUD.get_approved_by_prn(prn_number)

    @staticmethod
    async def update_status(credential_id: UUID, status_value: CredentialStatus) -> Credential:
        credential = await CredentialCRUD.update(credential_id, CredentialUpdate(status=status_value))
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found",
            )
        return credential

    @staticmethod
    async def update(credential_id: UUID, credential_update: CredentialUpdate) -> Credential:
        credential = await CredentialCRUD.update(credential_id, credential_update)
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found",
            )
        return credential

    @staticmethod
    async def delete(credential_id: UUID) -> None:
        success = await CredentialCRUD.delete(credential_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found",
            )
