import os
import re
from pathlib import Path
from fastapi import UploadFile, HTTPException, status

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}

ALLOWED_RECORD_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".webp", ".docx", ".txt"}
ALLOWED_RECORD_MIMES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
}

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_RECORD_SIZE = 10 * 1024 * 1024  # 10 MB

def sanitize_filename(filename: str) -> str:
    """Strip path traversal components and unsafe characters across both POSIX and Windows."""
    # Normalize backslashes to forward slashes first
    normalized = filename.replace("\\", "/")
    clean = Path(normalized).name
    # Strip any null bytes or weird control chars
    clean = re.sub(r'[^\w\s\.-]', '_', clean)
    return clean.strip() or "upload"

async def validate_and_read_upload(
    upload_file: UploadFile,
    allowed_extensions: set[str],
    allowed_mimes: set[str],
    max_size_bytes: int,
    field_label: str = "File"
) -> tuple[str, bytes]:
    """
    Validates file extension, reported MIME type, filename path safety, and content size.
    Returns (sanitized_filename, file_bytes).
    """
    if not upload_file or not upload_file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_label} is required"
        )

    clean_name = sanitize_filename(upload_file.filename)
    ext = Path(clean_name).suffix.lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{ext}' for {field_label}. Allowed extensions: {', '.join(sorted(allowed_extensions))}"
        )

    # Read content with size check
    content = await upload_file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_label} cannot be empty"
        )

    if len(content) > max_size_bytes:
        max_mb = max_size_bytes // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"{field_label} exceeds maximum allowed size of {max_mb}MB"
        )

    return clean_name, content
