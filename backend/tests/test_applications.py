import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.phase2


def test_list_applications_empty(client: TestClient, auth_headers):
    resp = client.get("/api/applications", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_create_and_get_application(client: TestClient, auth_headers):
    create = client.post("/api/applications", headers=auth_headers, json={
        "company": "McKinsey",
        "role": "Business Analyst",
        "stage": "Applied",
        "deadline": "2026-10-01",
        "preparation": 60,
    })
    assert create.status_code == 201
    app = create.json()
    assert app["company"] == "McKinsey"

    single = client.get(f"/api/applications/{app['id']}", headers=auth_headers)
    assert single.status_code == 200
    assert single.json()["id"] == app["id"]

    update = client.put(f"/api/applications/{app['id']}", headers=auth_headers, json={
        "stage": "First Round",
        "preparation": 72,
    })
    assert update.status_code == 200
    assert update.json()["stage"] == "First Round"

    delete = client.delete(f"/api/applications/{app['id']}", headers=auth_headers)
    assert delete.status_code == 204


def test_cross_user_ownership_blocked(client: TestClient, auth_headers):
    app = client.post("/api/applications", headers=auth_headers, json={
        "company": "X", "role": "Y", "stage": "Applied",
    }).json()

    other = client.post("/api/auth/signup", json={
        "full_name": "Attacker",
        "email": f"attacker_{id({})}@example.com",
        "password": "Password123!",
        "terms_accepted": True,
        "privacy_accepted": True,
    })
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}
    resp = client.get(f"/api/applications/{app['id']}", headers=other_headers)
    assert resp.status_code == 403
