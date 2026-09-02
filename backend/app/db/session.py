from contextlib import contextmanager
from typing import Generator, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from .database import SessionLocal
from ..core.exceptions import DatabaseError
from ..core.logging import log_db_error


def get_db() -> Generator[Session, None, None]:
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
