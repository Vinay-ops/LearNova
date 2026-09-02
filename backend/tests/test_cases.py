import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.phase3_stub


def test_cases_stub_501(client: TestClient, auth_headers):
    resp = client.get("/api/cases", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_case_attempts_stub_501(client: TestClient, auth_headers):
    resp = client.post("/api/cases/attempts", headers=auth_headers, json={
        "case_id": "00000000-0000-0000-0000-000000000000",
    })
    assert resp.status_code == 404
