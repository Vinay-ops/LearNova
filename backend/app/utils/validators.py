from datetime import datetime, timezone
from typing import Any
from uuid import UUID
import re

from pydantic import EmailStr

from ..core.exceptions import ValidationError


EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")
STRONG_PASSWORD_MIN = 6
SCORE_MIN = 0
SCORE_MAX = 100


def validate_email(email: str) -> str:
    normalized = email.lower().strip()
    if not EMAIL_REGEX.match(normalized):
        raise ValidationError({"email": "Invalid email format"})
    return normalized


def validate_password(password: str) -> str:
    if len(password.strip()) < STRONG_PASSWORD_MIN:
        raise ValidationError(
            {"password": f"Password must be at least {STRONG_PASSWORD_MIN} characters"}
        )
    return password


def validate_score(score: Any) -> int:
    try:
        s = int(score)
    except (TypeError, ValueError):
        raise ValidationError({"score": "Score must be a valid integer"})
    if s < SCORE_MIN or s > SCORE_MAX:
        raise ValidationError(
            {"score": f"Score must be between {SCORE_MIN} and {SCORE_MAX}"}
        )
    return s


def validate_uuid(value: str, field: str = "id") -> UUID:
    try:
        return UUID(str(value))
    except (ValueError, AttributeError):
        raise ValidationError({field: f"Invalid UUID format: {value}"})


def validate_future_date(dt: datetime, field: str = "date") -> datetime:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    if dt < datetime.now(timezone.utc):
        raise ValidationError({field: "Date must be in the future"})
    return dt


def validate_string_length(
    value: str,
    field: str,
    min_length: int = 1,
    max_length: int = 10000,
) -> str:
    v = value.strip() if isinstance(value, str) else value
    if not isinstance(v, str):
        raise ValidationError({field: "Value must be a string"})
    if len(v) < min_length:
        raise ValidationError({field: f"Must be at least {min_length} characters"})
    if len(v) > max_length:
        raise ValidationError({field: f"Must not exceed {max_length} characters"})
    return v


def validate_not_empty(value: Any, field: str) -> Any:
    if value is None:
        raise ValidationError({field: "Field is required"})
    if isinstance(value, str) and not value.strip():
        raise ValidationError({field: "Field cannot be blank"})
    if isinstance(value, list) and len(value) == 0:
        raise ValidationError({field: "List cannot be empty"})
    return value
