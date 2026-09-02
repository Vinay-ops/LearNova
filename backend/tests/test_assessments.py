import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.phase4_stub


def test_assessments_stub_501(client: TestClient, auth_headers):
    resp = client.get("/api/assessments", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
