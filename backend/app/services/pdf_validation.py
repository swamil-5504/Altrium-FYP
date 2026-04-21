"""Shared PDF upload validation.

Enforces, in this order:
  1. Declared MIME type is application/pdf.
  2. File size is within MAX_PDF_UPLOAD_BYTES (streamed — never loads an
     unbounded payload into memory).
  3. The payload actually starts with %PDF- (magic bytes).
  4. pypdf can parse the full payload as a valid PDF structure.

Returns the full file bytes on success so callers can persist them without
re-reading.
"""

from __future__ import annotations

import io

from fastapi import HTTPException, UploadFile, status
from pypdf import PdfReader
from pypdf.errors import PdfReadError

MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MiB
_PDF_MAGIC = b"%PDF-"
_CHUNK = 64 * 1024


async def validate_pdf_upload(file: UploadFile) -> bytes:
    if file.content_type not in ("application/pdf",):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted",
        )

    # Stream-read with a hard cap so a malicious client can't OOM us.
    buf = bytearray()
    while True:
        chunk = await file.read(_CHUNK)
        if not chunk:
            break
        buf.extend(chunk)
        if len(buf) > MAX_PDF_UPLOAD_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"PDF exceeds {MAX_PDF_UPLOAD_BYTES // (1024 * 1024)} MiB limit",
            )

    data = bytes(buf)
    if not data.startswith(_PDF_MAGIC):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is not a valid PDF (missing %PDF- header)",
        )

    try:
        PdfReader(io.BytesIO(data))
    except (PdfReadError, ValueError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or malformed PDF file: {exc}",
        )

    await file.seek(0)
    return data
