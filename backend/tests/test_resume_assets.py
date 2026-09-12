import json

from fastapi.testclient import TestClient

from app.ai.client import StubLLMClient

RESUME_TEXT = """
Priya Sharma
Data Analyst
Summary: Data analyst who turns messy data into decisions.
Skills: SQL, Python, Tableau, Statistics
Technologies: PostgreSQL, pandas, dbt
Projects:
- Churn Analysis: built a churn model in SQL + Python that cut attrition 12%.
Experience:
- Data Analyst, RetailCo, 2022-2024: owned reporting and experimentation.
Education:
- MS Analytics, Data University, 2022
"""

RESUME_STRUCTURED = {
    "name": "Priya Sharma",
    "title": "Data Analyst",
    "summary": "Data analyst who turns messy data into decisions.",
    "skills": ["SQL", "Python", "Tableau", "Statistics"],
    "technologies": ["PostgreSQL", "pandas", "dbt"],
    "projects": [
        {
            "name": "Churn Analysis",
            "description": "Built a churn model in SQL + Python that cut attrition 12%.",
            "technologies": ["SQL", "Python"],
        }
    ],
    "experience": [
        {
            "role": "Data Analyst",
            "company": "RetailCo",
            "duration": "2022-2024",
            "summary": "Owned reporting and experimentation.",
        }
    ],
    "education": [{"degree": "MS Analytics", "institution": "Data University", "year": "2022"}],
    "certifications": [],
}

PARSED_RESPONSE = json.dumps(RESUME_STRUCTURED)


class FakeLLM:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = 0

    def chat(self, **kwargs):
        self.calls += 1
        from app.ai.client import LLMResponse

        content = self._responses.pop(0) if self._responses else "{}"
        return LLMResponse(content=content, model="fake-model", tokens_used=10)


def _save(client, headers, **overrides):
    payload = {
        "filename": "priya_resume.pdf",
        "source_type": "pdf",
        "role": "Data Analyst",
        "resume": RESUME_STRUCTURED,
    }
    payload.update(overrides)
    return client.post("/api/resumes", headers=headers, json=payload)


def test_save_list_get_resume(client: TestClient, auth_headers):
    created = _save(client, auth_headers)
    assert created.status_code == 201, created.text
    body = created.json()
    assert body["user_id"]
    assert body["filename"] == "priya_resume.pdf"
    assert body["role"] == "Data Analyst"
    assert body["data"]["skills"][0] == "SQL"
    assert body["data"]["projects"][0]["name"] == "Churn Analysis"

    listing = client.get("/api/resumes", headers=auth_headers).json()
    assert len(listing) == 1
    assert listing[0]["id"] == body["id"]

    fetched = client.get(f"/api/resumes/{body['id']}", headers=auth_headers)
    assert fetched.status_code == 200
    assert fetched.json()["data"]["name"] == "Priya Sharma"


def test_save_rejects_empty_resume(client: TestClient, auth_headers):
    resp = _save(
        client, auth_headers, resume={"name": "", "skills": [], "projects": [], "experience": []}
    )
    assert resp.status_code == 422
    assert "usable" in resp.json()["detail"].lower()


def test_saved_resume_cannot_be_accessed_by_other_user(
    client: TestClient, auth_headers
):
    created = _save(client, auth_headers).json()
    other = client.post(
        "/api/auth/signup",
        json={"full_name": "Other", "email": "resume-other@example.com", "password": "Password123!"},
    ).json()
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}

    assert client.get(f"/api/resumes/{created['id']}", headers=other_headers).status_code == 403
    resp = client.delete(f"/api/resumes/{created['id']}", headers=other_headers)
    assert resp.status_code == 403
    patch = client.patch(
        f"/api/resumes/{created['id']}",
        headers=other_headers,
        json={"resume": RESUME_STRUCTURED},
    )
    assert patch.status_code == 403


def test_update_and_delete_resume(client: TestClient, auth_headers):
    created = _save(client, auth_headers).json()
    rid = created["id"]

    updated = client.patch(
        f"/api/resumes/{rid}",
        headers=auth_headers,
        json={"filename": "renamed.pdf", "role": "Senior Data Analyst"},
    )
    assert updated.status_code == 200
    assert updated.json()["filename"] == "renamed.pdf"
    assert updated.json()["role"] == "Senior Data Analyst"

    data_update = dict(RESUME_STRUCTURED)
    data_update["skills"] = ["SQL", "Python", "dbt"]
    updated_data = client.patch(
        f"/api/resumes/{rid}", headers=auth_headers, json={"resume": data_update}
    )
    assert updated_data.status_code == 200
    assert "dbt" in updated_data.json()["data"]["skills"]

    assert client.delete(f"/api/resumes/{rid}", headers=auth_headers).status_code == 204
    assert client.get(f"/api/resumes/{rid}", headers=auth_headers).status_code == 404


def test_upload_parse_and_save(client: TestClient, auth_headers, monkeypatch):
    from app.ai.client import LLMResponse

    class UploadLLM:
        def chat(self, **kwargs):
            return LLMResponse(content=PARSED_RESPONSE, model="fake-model", tokens_used=8)

    monkeypatch.setattr("app.ai.resume_parser.get_llm_client", lambda: UploadLLM())
    resp = client.post(
        "/api/resumes/upload",
        headers=auth_headers,
        files={"file": ("resume.txt", RESUME_TEXT.encode("utf-8"), "text/plain")},
        data={"role": "Data Analyst"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["source_type"] == "txt"
    assert body["data"]["name"] == "Priya Sharma"
    assert body["data"]["projects"][0]["name"] == "Churn Analysis"


def test_upload_requires_provider(client: TestClient, auth_headers, monkeypatch):
    monkeypatch.setattr("app.ai.resume_parser.get_llm_client", lambda: StubLLMClient())
    resp = client.post(
        "/api/resumes/upload",
        headers=auth_headers,
        files={"file": ("resume.txt", RESUME_TEXT.encode("utf-8"), "text/plain")},
    )
    assert resp.status_code == 502
    assert "GROQ_API_KEY" in resp.json()["detail"]


def test_upload_rejects_unsupported_type(client: TestClient, auth_headers):
    resp = client.post(
        "/api/resumes/upload",
        headers=auth_headers,
        files={"file": ("resume.exe", b"nope", "application/octet-stream")},
    )
    assert resp.status_code == 422


def test_resumes_require_auth(client: TestClient):
    assert client.get("/api/resumes").status_code == 401
    resp = _save(client, {})
    assert resp.status_code == 401
