import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.phase2


def test_progress_summary(client: TestClient, auth_headers):
    resp = client.get("/api/progress", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "readiness_score" in body
    assert 0 <= body["readiness_score"] <= 100
    assert "skill_scores" in body
    assert "readiness_history" in body


def test_set_skill_score_and_recalculate(client: TestClient, auth_headers):
    set_resp = client.post("/api/progress/skills", headers=auth_headers, json={
        "skill_id": "00000000-0000-0000-0000-000000000000",
        "current_score": 80,
        "note": "Baseline",
    })
    assert set_resp.status_code in (200, 201)

    recalc = client.post("/api/progress/recalculate-readiness", headers=auth_headers)
    assert recalc.status_code == 200
    assert 0 <= recalc.json()["readiness_score"] <= 100
