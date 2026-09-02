import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.phase5_stub


def test_drills_stub_501(client: TestClient, auth_headers):
    resp = client.get("/api/drills", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
