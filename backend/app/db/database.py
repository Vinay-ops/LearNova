"""Database engine and session factory.

Compatible with both long-running servers and Vercel serverless functions.
- SQLite: check_same_thread=False for thread safety
- PostgreSQL: pool_pre_ping=True for connection health checks

Engine is created lazily on first use (not at import) so a bad DATABASE_URL or
transient network failure on Vercel cold-start doesn't kill the entire
function at import-time (`FUNCTION_INVOCATION_FAILED`). Instead it surfaces as
a route-level 5xx caught by the global exception handlers.

Backward compat: ``engine`` is exposed as a module-level ``_LazyEngineProxy``
so ``from app.db.database import engine, Base`` still works (conftest, alembic,
tests). The first attribute access / method call on ``engine`` triggers the
real ``create_engine`` call.
"""
from __future__ import annotations

from threading import Lock
from typing import Any, Optional

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from ..core.config import settings


def _normalize_database_url(url: str) -> str:
    # 'postgresql://' URLs default to psycopg2 in SQLAlchemy; this project uses
    # psycopg (v3). Normalize both URL prefixes to the installed driver.
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


_engine: Optional[Engine] = None
_session_factory: Optional[sessionmaker] = None
_lock = Lock()


def _create_engine_once() -> Engine:
    global _engine, _session_factory
    if _engine is not None:
        return _engine
    with _lock:
        if _engine is not None:
            return _engine
        database_url = _normalize_database_url(settings.DATABASE_URL)
        connect_args: dict = {}
        pool_kwargs: dict = {}
        if database_url.startswith("sqlite"):
            connect_args["check_same_thread"] = False
        else:
            pool_kwargs["pool_size"] = 2
            pool_kwargs["max_overflow"] = 2
            pool_kwargs["pool_timeout"] = 30
            pool_kwargs["pool_recycle"] = 1800
        _engine = create_engine(
            database_url,
            pool_pre_ping=True,
            connect_args=connect_args,
            **pool_kwargs,
        )
        _session_factory = sessionmaker(
            autocommit=False, autoflush=False, bind=_engine,
        )
    return _engine


def get_engine() -> Engine:
    """Public accessor for eager DB probes (health checks, scripts)."""
    return _create_engine_once()


def _get_session_factory() -> sessionmaker:
    _create_engine_once()
    assert _session_factory is not None
    return _session_factory


def SessionLocal():
    """Return a new SQLAlchemy session using the lazily-built engine.

    Callable signature intentionally matches sessionmaker(...)() usage in
    session.py (``db = SessionLocal()``).
    """
    return _get_session_factory()()


class _LazyEngineProxy:
    """Transparent proxy that defers ``create_engine`` until first attribute
    access. Exposed as module-level ``engine`` for backward compatibility
    with ``from app.db.database import engine`` used by alembic and tests.
    """

    def _get(self) -> Engine:
        return _create_engine_once()

    def __getattr__(self, item: str) -> Any:
        return getattr(self._get(), item)

    def __dir__(self):
        return dir(self._get())

    # Common SQLAlchemy Engine dunder passthroughs for safety in tests.
    def __enter__(self):
        return self._get().__enter__()

    def __exit__(self, *exc):
        return self._get().__exit__(*exc)

    def __bool__(self) -> bool:
        return bool(_engine is not None or True)


engine: Any = _LazyEngineProxy()


class Base(DeclarativeBase):
    pass
