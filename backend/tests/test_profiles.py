import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.phase1


def test_get_profile(client: TestClient, auth_headers):
    resp = client.get("/api/profile", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "full_name" in body
    assert "readiness_score" in body
    assert body["readiness_score"] >= 0


def test_update_profile_partial(client: TestClient, auth_headers):
    resp = client.put("/api/profile", headers=auth_headers, json={
        "experience_level": "intermediate",
        "target_firms": ["BCG", "McKinsey"],
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["experience_level"] == "intermediate"
    assert set(body["target_firms"]) == {"BCG", "McKinsey"}


def test_update_profile_blocked_fields(client: TestClient, auth_headers):
    resp = client.put("/api/profile", headers=auth_headers, json={
        "readiness_score": 99,
    })
    assert resp.status_code == 200
    assert resp.json()["readiness_score"] != 99
