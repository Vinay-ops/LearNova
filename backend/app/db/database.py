"""Database engine and session factory.

Compatible with both long-running servers and Vercel serverless functions.
- SQLite: check_same_thread=False for thread safety
- PostgreSQL: pool_pre_ping=True for connection health checks
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from ..core.config import settings

connect_args = {}
pool_kwargs = {}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # PostgreSQL — use a small pool suitable for serverless
    pool_kwargs["pool_size"] = 2
    pool_kwargs["max_overflow"] = 2
    pool_kwargs["pool_timeout"] = 30
    pool_kwargs["pool_recycle"] = 1800  # Recycle connections every 30 min

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
    **pool_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
