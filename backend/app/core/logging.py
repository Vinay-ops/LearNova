import logging
import sys
from typing import Any
import json
from datetime import datetime, timezone


class StructuredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            log_entry.update(record.extra)
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def setup_logging(level: str = "INFO") -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper(), logging.INFO))

    if not root_logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        root_logger.addHandler(handler)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").propagate = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)


def log_auth_event(event: str, user_id: str | None = None, **extra: Any) -> None:
    logger = get_logger("casepilot.auth")
    logger.info(
        "auth event",
        extra={"event": event, "user_id": user_id, **extra},
    )


def log_api_error(
    method: str,
    path: str,
    status_code: int,
    user_id: str | None = None,
    error_detail: Any = None,
) -> None:
    logger = get_logger("casepilot.api")
    logger.error(
        "api error",
        extra={
            "method": method,
            "path": path,
            "status_code": status_code,
            "user_id": user_id,
            "error_detail": str(error_detail) if error_detail else None,
        },
    )


def log_db_error(operation: str, error: str, **extra: Any) -> None:
    logger = get_logger("casepilot.db")
    logger.error(
        "database error",
        extra={"operation": operation, "error": error, **extra},
    )


def log_ai_request(
    operation: str,
    prompt_name: str | None = None,
    prompt_version: str | None = None,
    model: str | None = None,
    latency_ms: float | None = None,
    tokens_used: int | None = None,
    success: bool = True,
    error: str | None = None,
    **extra: Any,
) -> None:
    logger = get_logger("casepilot.ai")
    level = logger.info if success else logger.error
    level(
        "ai request",
        extra={
            "operation": operation,
            "prompt_name": prompt_name,
            "prompt_version": prompt_version,
            "model": model,
            "latency_ms": latency_ms,
            "tokens_used": tokens_used,
            "success": success,
            "error": error,
            **extra,
        },
    )
