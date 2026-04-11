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
        # Automatically pull PRN and College from user profile if not provided
        if not credential_create.prn_number:
            credential_create.prn_number = current_user.prn_number
        if not credential_create.college_name:
            credential_create.college_name = current_user.college_name
            
        return await CredentialCRUD.create(
            credential_create=credential_create,
            issued_to_id=current_user.id,
            issued_by_id=current_user.id,
        )

    @staticmethod
    async def list_for_user(current_user: User) -> List[Credential]:
        if current_user.role == UserRole.SUPERADMIN:
            return await CredentialCRUD.get_all() # We need a get_all method, or just get everything
        if current_user.role == UserRole.ADMIN:
            if current_user.college_name:
                creds = await CredentialCRUD.get_by_college(current_user.college_name)
                return [c for c in creds if c.status == CredentialStatus.PENDING or c.issued_by_id == current_user.id]
            return []  # Return empty if admin has no college assigned
        return await CredentialCRUD.get_by_user(current_user.id)

    @staticmethod
    async def reset_submission(credential_id: UUID) -> Credential:
        """Reset a degree submission after an on-chain burn, allowing re-minting."""
        credential = await CredentialCRUD.get_by_id(credential_id)
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found",
            )
        
        credential.status = CredentialStatus.PENDING
        credential.token_id = None
        credential.tx_hash = None
        credential.revoked = False
        credential.revoked_at = None
        from datetime import datetime
        credential.updated_at = datetime.utcnow()
        await credential.save()
        return credential

    @staticmethod
    async def get_by_id_for_user(credential_id: UUID, current_user: User) -> Credential:
        credential = await CredentialCRUD.get_by_id(credential_id)
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found",
            )

        if current_user.role == UserRole.SUPERADMIN:
            pass  # Superadmins can view any submission
        elif current_user.role == UserRole.ADMIN:
            # Admin can only view if it's pending for their college OR if they issued/approved it themselves
            if not ((credential.status == CredentialStatus.PENDING and credential.college_name == current_user.college_name) or
                    credential.issued_by_id == current_user.id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view documents approved by other admins.",
                )
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
    async def get_all_public() -> List[Credential]:
        return await CredentialCRUD.get_all_approved()

    @staticmethod
    async def update_status(credential_id: UUID, status_value: CredentialStatus, admin_id: UUID = None) -> Credential:
        credential = await CredentialCRUD.update(credential_id, CredentialUpdate(status=status_value))
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found",
            )
        if admin_id:
            credential.issued_by_id = admin_id
            await credential.save()
        return credential

    @staticmethod
    async def update(credential_id: UUID, credential_update: CredentialUpdate, admin_id: UUID = None) -> Credential:
        credential = await CredentialCRUD.update(credential_id, credential_update)
        if not credential:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Credential not found",
            )
        if admin_id:
            credential.issued_by_id = admin_id
            await credential.save()
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
        if current_user.role not in (UserRole.ADMIN, UserRole.SUPERADMIN) and credential.issued_to_id != current_user.id:
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

        # Determine if user is authorized to view document
        is_authorized = False
        if current_user.role == UserRole.SUPERADMIN:
            is_authorized = True
        elif current_user.role == UserRole.ADMIN:
            if ((credential.status == CredentialStatus.PENDING and credential.college_name == current_user.college_name) or
                credential.issued_by_id == current_user.id):
                is_authorized = True
        elif credential.issued_to_id == current_user.id:
            is_authorized = True

        if not is_authorized:
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
