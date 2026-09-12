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
    assert "readiness_over_time" in body
    # History must never be synthesized — an empty series is the honest state
    # until readiness snapshots are actually persisted over time.
    assert body["readiness_over_time"] == []


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


def test_readiness_history_records_only_real_recalculations(
    client: TestClient, auth_headers
):
    """Readiness history must contain real measurement points only."""
    summary = client.get("/api/progress", headers=auth_headers).json()
    assert summary["readiness_over_time"] == []

    recalc = client.post(
        "/api/progress/recalculate-readiness", headers=auth_headers
    ).json()
    score = recalc["readiness_score"]

    summary = client.get("/api/progress", headers=auth_headers).json()
    points = summary["readiness_over_time"]
    assert len(points) == 1
    assert points[0]["score"] == score
    assert points[0]["date"]

    # Recalculating with an unchanged score must NOT create a duplicate point.
    client.post("/api/progress/recalculate-readiness", headers=auth_headers)
    summary = client.get("/api/progress", headers=auth_headers).json()
    assert len(summary["readiness_over_time"]) == 1
