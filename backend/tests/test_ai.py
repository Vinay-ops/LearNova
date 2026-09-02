import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.phase6_7_stub


def test_ai_chat_stub_501(client: TestClient, auth_headers):
    resp = client.post("/api/ai/interview/chat", headers=auth_headers, json={
        "case_id": "00000000-0000-0000-0000-000000000000",
        "message": "Hello",
    })
    assert resp.status_code == 501


def test_ai_evaluation_stub_501(client: TestClient, auth_headers):
    resp = client.post("/api/ai/evaluation", headers=auth_headers, json={
        "case_attempt_id": "00000000-0000-0000-0000-000000000000",
    })
    assert resp.status_code == 501


def test_ai_sessions_stub_501(client: TestClient, auth_headers):
    resp = client.get("/api/ai/sessions", headers=auth_headers)
    assert resp.status_code == 501
