from __future__ import annotations

import io
from typing import Optional

from ..core.exceptions import ResumeExtractionError, ValidationError

# Uploads larger than this are rejected before parsing.
MAX_RESUME_BYTES = 2 * 1024 * 1024
_ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "md", "text"}


def _extract_docx(data: bytes) -> str:
    """Extract paragraph + table text from a .docx (stdlib-safe via python-docx)."""
    try:
        from docx import Document
    except ImportError:
        raise ResumeExtractionError(
            "DOCX parsing is unavailable on this server (python-docx is not installed)."
        )

    try:
        document = Document(io.BytesIO(data))
    except Exception:
        raise ResumeExtractionError("Could not read the .docx file — it may be corrupt.")

    parts: list[str] = []
    for paragraph in document.paragraphs:
        if paragraph.text and paragraph.text.strip():
            parts.append(paragraph.text.strip())
    for table in document.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells if c.text and c.text.strip()]
            if cells:
                parts.append(" | ".join(cells))
    return "\n".join(parts)


def _extract_pdf(data: bytes) -> str:
    """Extract text from a .pdf via pypdf when it is installed."""
    try:
        from pypdf import PdfReader
    except ImportError:
        raise ResumeExtractionError(
            "PDF parsing is unavailable on this server (pypdf is not installed). "
            "Upload a .docx or .txt resume, or install pypdf on the backend."
        )

    try:
        reader = PdfReader(io.BytesIO(data))
    except Exception:
        raise ResumeExtractionError("Could not read the .pdf file — it may be corrupt.")

    pages: list[str] = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        if text.strip():
            pages.append(text.strip())
    return "\n\n".join(pages)


def extract_resume_text(filename: str, data: bytes) -> str:
    """Extract plain text from an uploaded resume file.

    Pure file → text (no LLM). DOCX is parsed with python-docx, PDF with pypdf
    when installed, and .txt/.md are passed through. Returns the raw candidate
    text; structured extraction happens later in the AI layer.
    """
    if not filename:
        raise ValidationError("Resume file must have a name")
    if not data:
        raise ValidationError("Resume file is empty")
    if len(data) > MAX_RESUME_BYTES:
        raise ValidationError("Resume file is too large (max 2 MB)")

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in _ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Unsupported resume format '.{ext}'. Upload a PDF, DOCX, or TXT file."
        )

    if ext == "docx":
        text = _extract_docx(data)
    elif ext == "pdf":
        text = _extract_pdf(data)
    else:
        try:
            text = data.decode("utf-8", errors="replace")
        except Exception:
            text = ""

    cleaned = "\n".join(line.rstrip() for line in text.splitlines())
    cleaned = "\n".join(line for line in cleaned.splitlines() if line.strip())
    if not cleaned.strip():
        raise ResumeExtractionError(
            "No readable text found in the resume. Scanned/image-only PDFs are not "
            "supported — upload a text-based PDF, DOCX, or TXT file."
        )
    return cleaned.strip()


def summarize_resume_text(resume_text: str, max_chars: int = 12000) -> str:
    """Bound the resume text that is sent to the LLM."""
    text = (resume_text or "").strip()
    if not text:
        return ""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n[resume text truncated]"


def ensure_supported_resume(filename: str) -> Optional[str]:
    """Validate extension up-front so callers can 422 before reading the body."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in _ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Unsupported resume format '.{ext}'. Upload a PDF, DOCX, or TXT file."
        )
    return ext
