import io
import os
import shutil
from pathlib import Path
from typing import List
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
import qrcode

from app.crud.crud import CredentialCRUD
from app.models.models import Credential, User, UserRole
from app.schemas.schemas import CredentialCreate, CredentialStatus, CredentialUpdate

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/app/uploads"))


def _ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _create_footer_overlay(page_width: float, page_height: float, tx_hash: str = None, document_uid: str = None):
    packet = io.BytesIO()
    c = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # Text info on the left
    c.setFont("Helvetica", 8)
    c.setFillColorRGB(0.3, 0.3, 0.3)
    x_text = 30
    y_text = 20
    
    if tx_hash:
        qr = qrcode.QRCode(version=1, box_size=2, border=0)
        qr.add_data(f"https://sepolia.etherscan.io/tx/{tx_hash}")
        qr.make(fit=True)
        
        qr_matrix = qr.get_matrix()
        qr_size = len(qr_matrix)
        box_size = 1.8 # Small boxes

        footer_text = f"Blockchain Verified: {tx_hash[:10]}...{tx_hash[-10:]}"
        # Add a link annotation for the text
        c.linkURL(f"https://sepolia.etherscan.io/tx/{tx_hash}", (x_text, y_text - 2, x_text + 250, y_text + 10), relative=0)
        c.drawString(x_text, y_text, footer_text)
    
        qr_x_start = page_width - (qr_size * box_size) - 40
        qr_y_start = 15
        
        # Draw a small label above QR code
        c.setFont("Helvetica-Bold", 6)
        c.setFillColorRGB(0.5, 0.5, 0.5)
        c.drawCentredString(qr_x_start + (qr_size * box_size) / 2, qr_y_start + (qr_size * box_size) + 4, "SCAN OR CLICK TO VERIFY")

        c.setFillColorRGB(0, 0, 0)
        for row_index, row in enumerate(qr_matrix):
            for col_index, pixel in enumerate(row):
                if pixel:
                    c.rect(
                        qr_x_start + (col_index * box_size),
                        qr_y_start + ((qr_size - 1 - row_index) * box_size),
                        box_size,
                        box_size,
                        stroke=0,
                        fill=1
                    )
        
        # Clickable hit-box (slightly oversized for ease of use)
        c.linkURL(
            f"https://sepolia.etherscan.io/tx/{tx_hash}",
            (qr_x_start - 5, qr_y_start - 5, qr_x_start + (qr_size * box_size) + 5, qr_y_start + (qr_size * box_size) + 12),
            relative=0
        )

    c.save()
    packet.seek(0)
    overlay = PdfReader(packet)
    return overlay.pages[0]


class DegreeService:
    @staticmethod
    async def create_submission(credential_create: CredentialCreate, current_user: User) -> Credential:
        # Automatically pull PRN and College from user profile if not provided
        overrides: dict = {}
        if not credential_create.prn_number:
            overrides["prn_number"] = current_user.prn_number
        if not credential_create.college_name:
            overrides["college_name"] = current_user.college_name
        if overrides:
            credential_create = credential_create.model_copy(update=overrides)

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
        if not credential.document_uid:
            credential.document_uid = f"DOC-{credential.id}"
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

    @staticmethod
    async def get_document_with_footer(credential_id: UUID, current_user: User) -> bytes:
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

        if credential.status != CredentialStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Document must be approved before viewing the official approved PDF.",
            )

        with open(credential.document_path, "rb") as pdf_file:
            reader = PdfReader(pdf_file)
            writer = PdfWriter()
            for page in reader.pages:
                overlay_page = _create_footer_overlay(
                    float(page.mediabox.width),
                    float(page.mediabox.height),
                    tx_hash=credential.tx_hash,
                    document_uid=credential.document_uid or str(credential.id),
                )
                page.merge_page(overlay_page)
                writer.add_page(page)

            output = io.BytesIO()
            writer.write(output)
            output.seek(0)
            return output.read()
