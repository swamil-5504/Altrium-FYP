import os
import shutil
from pathlib import Path
from typing import List
from uuid import UUID

from fastapi import HTTPException, UploadFile, status

from app.crud.crud import CredentialCRUD
from app.models.models import Credential, User, UserRole
from app.schemas.schemas import CredentialCreate, CredentialStatus, CredentialUpdate

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))


def _ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


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

    # ---- Document upload / download ----

    @staticmethod
    async def upload_document(credential_id: UUID, file: UploadFile, current_user: User) -> Credential:
        credential = await CredentialCRUD.get_by_id(credential_id)
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found",
            )

        # Only the student who owns the submission (or an admin) may upload
        if current_user.role != UserRole.ADMIN and credential.issued_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized",
            )

        # Validate content type
        if file.content_type not in ("application/pdf",):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are accepted",
            )

        _ensure_upload_dir()

        # Store with a unique name based on the credential id
        filename = f"{credential_id}.pdf"
        dest = UPLOAD_DIR / filename

        with open(dest, "wb") as buf:
            shutil.copyfileobj(file.file, buf)

        # Persist the path in the record
        credential.document_path = str(dest)
        from datetime import datetime
        credential.updated_at = datetime.utcnow()
        await credential.save()

        return credential

    @staticmethod
    async def get_document_path(credential_id: UUID, current_user: User) -> str:
        credential = await CredentialCRUD.get_by_id(credential_id)
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found",
            )

        # Only admin or the owning student can view
        if current_user.role != UserRole.ADMIN and credential.issued_to_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized",
            )

        if not credential.document_path or not os.path.isfile(credential.document_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No document uploaded for this credential",
            )

        return credential.document_path
