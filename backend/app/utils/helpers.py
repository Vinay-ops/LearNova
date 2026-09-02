import uuid
from datetime import datetime, timezone
from typing import Any, TypeVar, Optional

from pydantic import BaseModel

T = TypeVar("T")


def generate_uuid() -> uuid.UUID:
    return uuid.uuid4()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def utc_iso(dt: Optional[datetime] = None) -> str:
    if dt is None:
        dt = now_utc()
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def clamp(value: float, min_v: float, max_v: float) -> float:
    return max(min_v, min(max_v, value))


def clamp_score(value: int) -> int:
    return int(clamp(value, 0, 100))


def to_pydantic(model: BaseModel, data: Any) -> dict[str, Any]:
    return model.model_validate(data).model_dump()


def from_pydantic_dict(pydantic_obj: BaseModel) -> dict[str, Any]:
    return pydantic_obj.model_dump(exclude_none=True)


def update_model_fields(obj: Any, data: dict[str, Any]) -> None:
    for key, value in data.items():
        if hasattr(obj, key):
            setattr(obj, key, value)


def short_id(length: int = 8) -> str:
    return str(uuid.uuid4())[:length]


def flatten_list(items: list[list[T]]) -> list[T]:
    return [item for sublist in items for item in sublist]


def average(values: list[int | float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def weighted_average(values: list[tuple[float, float]]) -> float:
    if not values:
        return 0.0
    total_weight = sum(w for _, w in values)
    if total_weight == 0:
        return 0.0
    return sum(v * w for v, w in values) / total_weight


def calculate_percentage(part: float, whole: float) -> float:
    if whole == 0:
        return 0.0
    return (part / whole) * 100.0
