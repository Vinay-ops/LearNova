from __future__ import annotations

import io
import re
import zipfile
from typing import Optional

from ..core.exceptions import ResumeExtractionError, ValidationError

# Uploads larger than this are rejected before parsing.
MAX_RESUME_BYTES = 2 * 1024 * 1024
_ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "md", "text"}

# Decompression-bomb guards for .docx (a ZIP container). A 2 MB upload can
# expand to gigabytes, so the *declared* uncompressed size is checked before the
# archive is ever handed to python-docx.
MAX_DOCX_ENTRIES = 512
MAX_DOCX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024
MAX_DOCX_COMPRESSION_RATIO = 200

# Filenames are stored for display only — they never become a filesystem path —
# but they are sanitized anyway so a crafted name cannot smuggle control
# characters, traversal segments or a misleading extension into the UI/db.
_UNSAFE_FILENAME_CHARS = re.compile(r"[\x00-\x1f\x7f]")


def sanitize_filename(filename: str) -> str:
    """Return a safe, display-only filename with no path or control characters."""
    raw = (filename or "").strip()
    # Strip any directory component (handles both / and \ separators).
    raw = raw.replace("\\", "/").split("/")[-1]
    raw = _UNSAFE_FILENAME_CHARS.sub("", raw)
    # Collapse traversal sequences that survive the split above.
    raw = raw.replace("..", "_")
    return raw.strip() or "resume"


def _looks_like_pdf(data: bytes) -> bool:
    return data[:5] == b"%PDF-"


def _looks_like_zip(data: bytes) -> bool:
    # .docx is an OOXML (ZIP) package.
    return data[:4] in (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")


def _validate_docx_archive(data: bytes) -> None:
    """Reject non-OOXML zips and decompression bombs before parsing."""
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            infos = archive.infolist()
            if len(infos) > MAX_DOCX_ENTRIES:
                raise ValidationError(
                    "This .docx contains an unreasonable number of parts and was rejected."
                )
            total = sum(info.file_size for info in infos)
            if total > MAX_DOCX_UNCOMPRESSED_BYTES:
                raise ValidationError(
                    "This .docx expands to an unreasonable size and was rejected."
                )
            if data and total / max(len(data), 1) > MAX_DOCX_COMPRESSION_RATIO:
                raise ValidationError(
                    "This .docx has an unsafe compression ratio and was rejected."
                )
            names = set(archive.namelist())
            if "word/document.xml" not in names:
                raise ValidationError(
                    "This file is a ZIP archive but not a Word document. "
                    "Upload a real .docx, .pdf or .txt resume."
                )
    except zipfile.BadZipFile:
        raise ValidationError("This .docx is corrupt and could not be read.")


def _looks_like_text(data: bytes) -> bool:
    """Reject binary payloads masquerading as .txt/.md."""
    if b"\x00" in data:
        return False
    try:
        data.decode("utf-8")
    except UnicodeDecodeError:
        # Not valid UTF-8. Allow it only if it decodes as a common text encoding
        # rather than being arbitrary binary.
        try:
            data.decode("cp1252")
        except UnicodeDecodeError:
            return False
    return True


def validate_resume_content(filename: str, data: bytes) -> None:
    """Verify the file's actual content matches its extension.

    Extension allowlisting alone is not enough: a renamed executable, a ZIP bomb
    or a binary blob with a .txt extension would all pass it. Content sniffing
    costs nothing here and makes the extension claim meaningful.
    """
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext == "pdf":
        if not _looks_like_pdf(data):
            raise ValidationError(
                "That file is not a valid PDF (its contents do not match the .pdf extension)."
            )
    elif ext == "docx":
        if not _looks_like_zip(data):
            raise ValidationError(
                "That file is not a valid .docx (its contents do not match the extension)."
            )
        _validate_docx_archive(data)
    else:  # txt / md / text
        if not _looks_like_text(data):
            raise ValidationError(
                "That file does not look like a text document. "
                "Upload a .pdf, .docx or .txt resume."
            )


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

    # Content must match the claimed extension before any parser touches it.
    validate_resume_content(filename, data)

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
