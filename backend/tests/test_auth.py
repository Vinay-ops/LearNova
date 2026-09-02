import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.phase1


class TestSignup:
    def test_signup_success(self, client: TestClient):
        import random
        email = f"user{random.randint(1, 999999)}@example.com"
        resp = client.post("/api/auth/signup", json={
            "full_name": "New User",
            "email": email,
            "password": "Password123!",
        })
        assert resp.status_code == 201
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert body["user"]["email"] == email
        assert body["profile"]["full_name"] == "New User"

    def test_signup_duplicate_email(self, client: TestClient):
        import random
        email = f"dup{random.randint(1, 999999)}@example.com"
        payload = {"full_name": "A", "email": email, "password": "Password123!"}
        r1 = client.post("/api/auth/signup", json=payload)
        assert r1.status_code == 201
        r2 = client.post("/api/auth/signup", json=payload)
        assert r2.status_code == 409


class TestLogin:
    def test_login_success(self, client: TestClient):
        import random
        email = f"login{random.randint(1, 999999)}@example.com"
        client.post("/api/auth/signup", json={
            "full_name": "L", "email": email, "password": "pw123456!",
        })
        resp = client.post("/api/auth/login", json={
            "email": email,
            "password": "pw123456!",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_login_invalid_password(self, client: TestClient):
        import random
        email = f"bad{random.randint(1, 999999)}@example.com"
        client.post("/api/auth/signup", json={
            "full_name": "B", "email": email, "password": "correct123!",
        })
        resp = client.post("/api/auth/login", json={
            "email": email,
            "password": "wrongpassword",
        })
        assert resp.status_code == 401


class TestProtectedRoutes:
    def test_me_without_token_401(self, client: TestClient):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_me_with_token(self, client: TestClient, auth_headers):
        resp = client.get("/api/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert "user" in body
        assert "profile" in body
