"""Tests for the Prompt Registry CRUD API (previously 501 stubs).

The CRUD endpoints are experiment-tooling endpoints, not production AI paths:
built-in prompts stay code-defined in the in-memory registry; DB rows are
user-created variants for A/B iteration.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def prompt_payload():
    return {
        "name": "test_evaluator",
        "purpose": "evaluator",
        "version": "v1",
        "description": "Test evaluator variant",
        "system_prompt": "You evaluate $topic answers strictly.",
        "user_prompt_template": "Evaluate: $answer",
        "variables": [{"name": "topic", "type": "string", "required": True}],
        "model": "openai/gpt-oss-120b",
        "temperature": 0.5,
        "prompt_techniques": ["rubric_based_evaluation"],
    }


def test_create_prompt(client: TestClient, auth_headers, prompt_payload):
    resp = client.post("/api/prompts", json=prompt_payload, headers=auth_headers)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["name"] == "test_evaluator"
    assert body["version"] == "v1"
    assert body["id"]


def test_create_duplicate_prompt_conflicts(client: TestClient, auth_headers, prompt_payload):
    client.post("/api/prompts", json=prompt_payload, headers=auth_headers)
    resp = client.post("/api/prompts", json=prompt_payload, headers=auth_headers)
    assert resp.status_code == 409


def test_update_prompt(client: TestClient, auth_headers, prompt_payload):
    created = client.post("/api/prompts", json=prompt_payload, headers=auth_headers).json()
    resp = client.put(
        f"/api/prompts/{created['id']}",
        json={"description": "Updated", "temperature": 0.3},
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["description"] == "Updated"
    assert float(body["temperature"]) == 0.3
    # identity fields stay immutable via update
    assert body["name"] == "test_evaluator"


def test_compare_prompts(client: TestClient, auth_headers, prompt_payload):
    created = client.post("/api/prompts", json=prompt_payload, headers=auth_headers).json()

    variant = dict(prompt_payload)
    variant["version"] = "v2"
    variant["system_prompt"] = "You evaluate $topic answers leniently."
    variant2 = client.post("/api/prompts", json=variant, headers=auth_headers).json()

    resp = client.post(
        "/api/prompts/compare",
        json={
            "prompt_id_1": created["id"],
            "prompt_id_2": variant2["id"],
            "test_variables": {"topic": "SQL", "answer": "use joins"},
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    fields = {d["field"] for d in body["differences"]}
    assert "system_prompt" in fields and "version" in fields
    assert "SQL" in body["rendered_1"]


def test_compare_missing_prompt_404(client: TestClient, auth_headers):
    resp = client.post(
        "/api/prompts/compare",
        json={"prompt_id_1": "nope", "prompt_id_2": "nope2", "test_variables": {}},
        headers=auth_headers,
    )
    assert resp.status_code == 404


def test_builtin_prompts_listed(client: TestClient, auth_headers):
    resp = client.get("/api/prompts", headers=auth_headers)
    assert resp.status_code == 200
    names = {p["name"] for p in resp.json()}
    assert {"interviewer", "evaluator", "learning_tutor", "quiz_generator"} <= names
