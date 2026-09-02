"""Database session management.

Compatible with both long-running servers and Vercel serverless functions.
"""
from contextlib import contextmanager
from typing import Generator, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from .database import SessionLocal
from ..core.exceptions import DatabaseError
from ..core.logging import log_db_error


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session.

    Each request gets its own session, which is closed after the request completes.
    Safe for both long-running servers and serverless environments.
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        log_db_error("session", str(e))
        raise DatabaseError(str(e)) from e
    finally:
        db.close()


@contextmanager
def db_session() -> Generator[Session, None, None]:
    """Context manager that yields a database session with auto-commit.

    Used by services that need transactional behavior.
    Safe for both long-running servers and serverless environments.
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        log_db_error("transaction", str(e))
        raise DatabaseError(str(e)) from e
    finally:
        db.close()
