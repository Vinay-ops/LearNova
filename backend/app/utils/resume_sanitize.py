"""Shared sanitization for structured resume data.

Both the interview session service (session-bound resumes) and the reusable
resume asset service store the same sanitized shape, so client-supplied
resume content is clipped and validated exactly once, in one place.
"""

from __future__ import annotations

from typing import Any


def clip(value: Any, limit: int = 400) -> str:
    return str(value or "")[:limit]


def clean_list(items: Any, limit: int = 40) -> list[str]:
    if not isinstance(items, list):
        return []
    return [clip(i, 120) for i in items[:limit] if str(i or "").strip()]


def sanitize_resume_data(resume: Any) -> dict[str, Any]:
    """Return a clipped, plain-dict copy of structured resume data.

    Only fields used by the interview engine are kept; values are length-capped
    so a hostile or malformed payload cannot blow up prompts or storage.
    """
    if not isinstance(resume, dict):
        return {}

    return {
        "name": clip(resume.get("name")),
        "title": clip(resume.get("title")),
        "summary": clip(resume.get("summary"), 1200),
        "skills": clean_list(resume.get("skills")),
        "technologies": clean_list(resume.get("technologies")),
        "certifications": clean_list(resume.get("certifications")),
        "projects": [
            {
                "name": clip(p.get("name"), 200),
                "description": clip(p.get("description"), 600),
                "technologies": clean_list(p.get("technologies")),
            }
            for p in (resume.get("projects") or [])[:12]
            if isinstance(p, dict) and str(p.get("name") or "").strip()
        ],
        "experience": [
            {
                "role": clip(e.get("role"), 200),
                "company": clip(e.get("company"), 200),
                "duration": clip(e.get("duration"), 120),
                "summary": clip(e.get("summary"), 600),
            }
            for e in (resume.get("experience") or [])[:12]
            if isinstance(e, dict) and str(e.get("role") or "").strip()
        ],
        "education": [
            {
                "degree": clip(ed.get("degree"), 200),
                "institution": clip(ed.get("institution"), 200),
                "year": clip(ed.get("year"), 60),
            }
            for ed in (resume.get("education") or [])[:6]
            if isinstance(ed, dict) and str(ed.get("degree") or "").strip()
        ],
    }
