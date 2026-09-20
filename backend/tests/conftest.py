import os

# The suite creates hundreds of accounts from one synthetic client, which would
# trip the auth rate limiter (_client_key falls back to the client IP). That
# limiter is exercised directly in test_rate_limit.py and test_security.py, so
# it is switched off here rather than loosened in production.
#
# Must be set BEFORE `app.core.config.Settings()` is instantiated at import time.
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

import pytest
from fastapi.testclient import TestClient

from app.db.database import engine, Base
import app.db.base  # noqa: F401 - ensures all models are registered with Base


# Signup requires explicit Terms & Conditions and Privacy Policy acceptance
# (enforced server-side). Tests consent by default; the consent-bypass tests
# deliberately omit these keys.
CONSENT = {"terms_accepted": True, "privacy_accepted": True}


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    from app.main import app
    return TestClient(app)


@pytest.fixture
def db_session():
    """A SQLAlchemy session on the same test database as ``client``.

    Used by security tests that need to arrange server-side state (e.g. an
    account whose recorded Terms revision is stale) without the ORM being able
    to be reached through the API — which is exactly the property under test.
    """
    from app.db.session import SessionLocal

    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def auth_headers(client: TestClient):
    payload = {
        "full_name": "Test User",
        "email": "test-user-fixture@example.com",
        "password": "Password123!",
        **CONSENT,
    }
    resp = client.post("/api/auth/signup", json=payload)
    if resp.status_code == 409:
        resp = client.post("/api/auth/login", data={
            "username": payload["email"],
            "password": payload["password"],
        })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
