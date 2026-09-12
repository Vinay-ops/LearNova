import json

from fastapi.testclient import TestClient

from app.ai.client import LLMResponse
from app.db.database import SessionLocal
from app.models.case import Case, CaseQuestion
from app.utils.enums import CaseType, Difficulty, QuestionType


def _seed_case() -> str:
    with SessionLocal() as s:
        case = Case(
            title="Test Profitability Case",
            company="Acme Corp",
            case_type=CaseType.PROFITABILITY.value,
            difficulty=Difficulty.MEDIUM.value,
            duration_minutes=25,
            description="Profits are down while revenue is flat.",
            prompt="The client's profits declined 15% while revenue stayed flat.",
            background="Raw material costs increased 20%.",
            skills=["Structuring", "Quantitative Analysis"],
            is_active=True,
            is_ai_generated=False,
        )
        s.add(case)
        s.flush()
        s.add(
            CaseQuestion(
                case_id=case.id,
                question_type=QuestionType.STRUCTURING.value,
                question_text="How would you approach diagnosing this profit decline?",
                model_answer="Break down profitability into revenue and cost drivers.",
                display_order=0,
                rubric="Clear issue tree covering revenue and costs.",
            )
        )
        s.commit()
        return case.id


def _signup_other(client: TestClient, email: str):
    resp = client.post(
        "/api/auth/signup",
        json={"full_name": "Other", "email": email, "password": "Password123!"},
    )
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


INTERVIEW_Q = json.dumps(
    {
        "question": "Walk me through how you would structure this problem.",
        "question_type": "structuring",
        "display_hint": "",
        "expected_duration_seconds": 120,
        "notes": "",
    }
)

EVALUATION = json.dumps(
    {
        "overall_score": 72,
        "skills": [
            {"skill": "Problem Structuring", "score": 70, "evidence": "Used an issue tree"},
            {"skill": "Quantitative Reasoning", "score": 65, "evidence": "Correct math"},
            {"skill": "Communication", "score": 80, "evidence": "Clear structure"},
        ],
        "strengths": ["Clear structure", "Good math"],
        "improvements": ["Quantitative depth", "Business judgment"],
        "recommendations": ["Practice mental math drills"],
    }
)


class FakeLLM:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = 0

    def chat(self, **kwargs):
        self.calls += 1
        content = self._responses.pop(0) if self._responses else "{}"
        return LLMResponse(content=content, model="fake-model", tokens_used=10)


def _patch_interview_client(monkeypatch, fake):
    monkeypatch.setattr("app.services.interview_session_service.get_llm_client", lambda: fake)
    monkeypatch.setattr("app.ai.interviewer.get_llm_client", lambda: fake)


def _patch_evaluator_client(monkeypatch, fake):
    monkeypatch.setattr("app.services.case_evaluation_service.get_llm_client", lambda: fake)
    monkeypatch.setattr("app.services.interview_session_service.get_llm_client", lambda: fake)


def test_ai_session_lifecycle(client: TestClient, auth_headers):
    created = client.post(
        "/api/ai/sessions", headers=auth_headers, json={"session_type": "case_interview"}
    )
    assert created.status_code == 201
    sid = created.json()["id"]
    assert created.json()["status"] == "active"

    listed = client.get("/api/ai/sessions", headers=auth_headers).json()
    assert any(s["id"] == sid for s in listed)

    got = client.get(f"/api/ai/sessions/{sid}", headers=auth_headers)
    assert got.status_code == 200

    updated = client.put(
        f"/api/ai/sessions/{sid}", headers=auth_headers, json={"status": "abandoned"}
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "abandoned"

    deleted = client.delete(f"/api/ai/sessions/{sid}", headers=auth_headers)
    assert deleted.status_code == 204

    missing = client.get(f"/api/ai/sessions/{sid}", headers=auth_headers)
    assert missing.status_code == 404


def test_ai_session_ownership(client: TestClient, auth_headers):
    sid = client.post("/api/ai/sessions", headers=auth_headers, json={}).json()["id"]
    other_headers = _signup_other(client, "other-ai@example.com")
    assert client.get(f"/api/ai/sessions/{sid}", headers=other_headers).status_code == 403
    assert (
        client.get(f"/api/ai/sessions/{sid}/messages", headers=other_headers).status_code
        == 403
    )
    assert (
        client.delete(f"/api/ai/sessions/{sid}", headers=other_headers).status_code == 403
    )


def test_ai_chat_creates_session_and_threads_history(
    client: TestClient, auth_headers, monkeypatch
):
    calls = []

    FOLLOW_Q = json.dumps(
        {
            "question": "What is the most important driver to validate first?",
            "question_type": "probe",
            "display_hint": "",
            "expected_duration_seconds": 120,
            "notes": "",
        }
    )

    class CapturingFake:
        def chat(self, **kwargs):
            calls.append(kwargs)
            content = FOLLOW_Q if len(calls) > 1 else INTERVIEW_Q
            return LLMResponse(content=content, model="fake-model", tokens_used=10)

    fake = CapturingFake()
    _patch_interview_client(monkeypatch, fake)
    case_id = _seed_case()

    # First turn: no message → opening question, session auto-created.
    resp = client.post(
        "/api/ai/interview/chat",
        headers=auth_headers,
        json={"case_id": case_id, "message": ""},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    sid = body["session_id"]
    assert body["message"]
    assert body["next_question"]["question_type"] == "structuring"

    msgs = client.get(f"/api/ai/sessions/{sid}/messages", headers=auth_headers).json()
    assert [m["role"] for m in msgs] == ["interviewer"]

    # Second turn: candidate answers → adaptive follow-up.
    resp2 = client.post(
        "/api/ai/interview/chat",
        headers=auth_headers,
        json={
            "session_id": sid,
            "message": "I would start with a profitability framework.",
        },
    )
    assert resp2.status_code == 200, resp2.text
    msgs = client.get(f"/api/ai/sessions/{sid}/messages", headers=auth_headers).json()
    assert [m["role"] for m in msgs] == ["interviewer", "candidate", "interviewer"]
    assert msgs[1]["content"] == "I would start with a profitability framework."

    # The second LLM call must include the candidate's answer (history).
    assert len(calls) == 2
    assert "profitability framework" in (calls[1]["user_prompt"] or "")


def test_ai_chat_requires_provider_key(client: TestClient, auth_headers, monkeypatch):
    from app.ai.client import StubLLMClient

    monkeypatch.setattr(
        "app.services.interview_session_service.get_llm_client",
        lambda: StubLLMClient(),
    )
    resp = client.post(
        "/api/ai/interview/chat",
        headers=auth_headers,
        json={"message": "Hello"},
    )
    assert resp.status_code == 502
    assert "GROQ_API_KEY" in resp.json()["detail"]


def test_ai_evaluation_via_case_attempt(client: TestClient, auth_headers, monkeypatch):
    _patch_evaluator_client(monkeypatch, FakeLLM([EVALUATION]))
    case_id = _seed_case()
    attempt = client.post(
        "/api/cases/attempts", headers=auth_headers, json={"case_id": case_id}
    ).json()
    questions = client.get(
        f"/api/cases/{case_id}/questions", headers=auth_headers
    ).json()
    client.post(
        "/api/cases/answers",
        headers=auth_headers,
        json={
            "attempt_id": attempt["id"],
            "question_id": questions[0]["id"],
            "answer_text": "I would break down revenue and costs.",
        },
    )

    resp = client.post(
        "/api/ai/evaluation",
        headers=auth_headers,
        json={"case_attempt_id": attempt["id"]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["case_attempt_id"] == attempt["id"]
    assert body["evaluation"]["overall_score"] == 72
    assert body["evaluation"]["strengths"] == ["Clear structure", "Good math"]

    # Scores persisted on the attempt itself (server-authoritative).
    updated = client.get(
        f"/api/cases/attempts/{attempt['id']}", headers=auth_headers
    ).json()
    assert updated["status"] == "completed"
    assert updated["overall_score"] == 72
    assert updated["structuring_score"] == 70


def test_ai_evaluation_via_session(client: TestClient, auth_headers, monkeypatch):
    _patch_interview_client(monkeypatch, FakeLLM([INTERVIEW_Q, INTERVIEW_Q]))
    _patch_evaluator_client(monkeypatch, FakeLLM([EVALUATION]))

    first = client.post(
        "/api/ai/interview/chat", headers=auth_headers, json={"message": ""}
    )
    sid = first.json()["session_id"]
    client.post(
        "/api/ai/interview/chat",
        headers=auth_headers,
        json={"session_id": sid, "message": "I would analyze revenue by product line."},
    )

    resp = client.post(
        "/api/ai/evaluation", headers=auth_headers, json={"session_id": sid}
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["ai_session_id"] == sid
    assert body["evaluation"]["overall_score"] == 72

    session = client.get(f"/api/ai/sessions/{sid}", headers=auth_headers).json()
    assert session["status"] == "completed"
    assert session["metadata_"]["evaluation"]["overall_score"] == 72


def test_ai_evaluation_records_progress_skills(
    client: TestClient, auth_headers, monkeypatch
):
    """Interview evaluation outcomes must flow into real progress skill scores."""
    from app.models.profile import Profile
    from app.models.skill import Skill, UserSkill
    from app.models.user import User

    _patch_interview_client(monkeypatch, FakeLLM([INTERVIEW_Q, INTERVIEW_Q]))
    _patch_evaluator_client(monkeypatch, FakeLLM([EVALUATION]))

    first = client.post(
        "/api/ai/interview/chat", headers=auth_headers, json={"message": ""}
    )
    sid = first.json()["session_id"]
    client.post(
        "/api/ai/interview/chat",
        headers=auth_headers,
        json={"session_id": sid, "message": "I would analyze revenue by product line."},
    )
    resp = client.post(
        "/api/ai/evaluation", headers=auth_headers, json={"session_id": sid}
    )
    assert resp.status_code == 200, resp.text

    with SessionLocal() as s:
        user = s.query(User).filter(User.email == "test-user-fixture@example.com").first()
        assert user is not None
        joined = (
            s.query(UserSkill, Skill)
            .join(Skill, UserSkill.skill_id == Skill.id)
            .filter(UserSkill.user_id == user.id)
            .all()
        )
        by_name = {skill.name: row.current_score for row, skill in joined}
        assert by_name == {
            "Structuring": 70,
            "Quantitative Analysis": 65,
            "Communication": 80,
        }
        profile = s.query(Profile).filter(Profile.user_id == user.id).first()
        assert profile is not None
        assert profile.readiness_score > 0


def test_ai_evaluation_requires_input(client: TestClient, auth_headers):
    resp = client.post("/api/ai/evaluation", headers=auth_headers, json={})
    assert resp.status_code == 422


def test_ai_feedback_from_attempt(client: TestClient, auth_headers, monkeypatch):
    from app.ai.client import StubLLMClient

    _patch_evaluator_client(monkeypatch, FakeLLM([EVALUATION]))
    # Feedback uses the deterministic path when no real provider is configured.
    monkeypatch.setattr("app.ai.feedback_generator.get_llm_client", lambda: StubLLMClient())

    case_id = _seed_case()
    attempt = client.post(
        "/api/cases/attempts", headers=auth_headers, json={"case_id": case_id}
    ).json()
    questions = client.get(f"/api/cases/{case_id}/questions", headers=auth_headers).json()
    client.post(
        "/api/cases/answers",
        headers=auth_headers,
        json={
            "attempt_id": attempt["id"],
            "question_id": questions[0]["id"],
            "answer_text": "Break down revenue and costs.",
        },
    )
    client.post(
        f"/api/cases/attempts/{attempt['id']}/evaluate", headers=auth_headers
    )

    resp = client.post(
        "/api/ai/feedback",
        headers=auth_headers,
        json={"case_id": case_id, "attempt_id": attempt["id"]},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["overall_score"] == 72
    assert len(body["skill_breakdown"]) >= 1
    assert body["strengths"] == ["Clear structure", "Good math"]
    # Weakest skill surfaced as biggest opportunity (real data, not random).
    assert body["biggest_opportunity"]["skill"] == "Quantitative Analysis"


def test_ai_feedback_requires_evaluated_session(client: TestClient, auth_headers, monkeypatch):
    _patch_interview_client(monkeypatch, FakeLLM([INTERVIEW_Q]))
    first = client.post(
        "/api/ai/interview/chat", headers=auth_headers, json={"message": ""}
    )
    sid = first.json()["session_id"]
    resp = client.post(
        "/api/ai/feedback", headers=auth_headers, json={"session_id": sid}
    )
    assert resp.status_code == 422


def test_ai_recommendations(client: TestClient, auth_headers):
    resp = client.post("/api/ai/recommendations", headers=auth_headers, json={})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "next_best_action" in body
    assert "reasoning" in body


def test_ai_feedback_ownership(client: TestClient, auth_headers, monkeypatch):
    _patch_evaluator_client(monkeypatch, FakeLLM([EVALUATION]))
    case_id = _seed_case()
    attempt = client.post(
        "/api/cases/attempts", headers=auth_headers, json={"case_id": case_id}
    ).json()
    other_headers = _signup_other(client, "other-feedback@example.com")
    resp = client.post(
        "/api/ai/feedback",
        headers=other_headers,
        json={"case_id": case_id, "attempt_id": attempt["id"]},
    )
    assert resp.status_code == 403