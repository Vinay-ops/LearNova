import pytest
from fastapi.testclient import TestClient

from app.db.database import engine, Base
import app.db.base  # noqa: F401 - ensures all models are registered with Base


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
def auth_headers(client: TestClient):
    payload = {
        "full_name": "Test User",
        "email": "test-user-fixture@example.com",
        "password": "Password123!",
    }
    resp = client.post("/api/auth/signup", json=payload)
    if resp.status_code == 409:
        resp = client.post("/api/auth/login", data={
            "username": payload["email"],
            "password": payload["password"],
        })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
