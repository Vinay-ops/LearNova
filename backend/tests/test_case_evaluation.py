import json

from fastapi.testclient import TestClient

from app.ai.client import LLMResponse
from app.db.database import SessionLocal
from app.models.case import Case, CaseQuestion
from app.utils.enums import CaseType, Difficulty, QuestionType


def _seed_case() -> str:
    with SessionLocal() as s:
        case = Case(
            title="Case Eval Test",
            company="Acme",
            case_type=CaseType.PROFITABILITY.value,
            difficulty=Difficulty.MEDIUM.value,
            duration_minutes=25,
            description="d",
            prompt="p",
            background="b",
            skills=["Structuring"],
            is_active=True,
            is_ai_generated=False,
        )
        s.add(case)
        s.flush()
        s.add(
            CaseQuestion(
                case_id=case.id,
                question_type=QuestionType.STRUCTURING.value,
                question_text="How would you approach this?",
                model_answer="A clear issue tree.",
                display_order=0,
                rubric="Issue tree covering revenue and costs.",
            )
        )
        s.commit()
        return case.id


EVALUATION = {
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


class FakeLLM:
    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = 0

    def chat(self, **kwargs):
        self.calls += 1
        content = self._responses.pop(0) if self._responses else "{}"
        return LLMResponse(content=content, model="fake-model", tokens_used=10)


def _signup_other(client: TestClient, email: str):
    resp = client.post(
        "/api/auth/signup",
        json={"full_name": "Other", "email": email, "password": "Password123!"},
    )
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def test_save_answer_ignores_client_score(client: TestClient, auth_headers):
    case_id = _seed_case()
    attempt = client.post(
        "/api/cases/attempts", headers=auth_headers, json={"case_id": case_id}
    ).json()
    questions = client.get(
        f"/api/cases/{case_id}/questions", headers=auth_headers
    ).json()
    saved = client.post(
        "/api/cases/answers",
        headers=auth_headers,
        json={
            "attempt_id": attempt["id"],
            "question_id": questions[0]["id"],
            "answer_text": "My answer",
            "score": 95,
            "ai_feedback": "fabricated",
        },
    ).json()
    assert saved["score"] is None
    assert saved["ai_feedback"] is None
    assert saved["answer_text"] == "My answer"


def test_update_attempt_ignores_scoring_fields(client: TestClient, auth_headers):
    case_id = _seed_case()
    attempt = client.post(
        "/api/cases/attempts", headers=auth_headers, json={"case_id": case_id}
    ).json()
    updated = client.put(
        f"/api/cases/attempts/{attempt['id']}",
        headers=auth_headers,
        json={
            "status": "paused",
            "current_question_index": 2,
            "overall_score": 99,
            "strengths": ["fake"],
            "weaknesses": ["fake"],
            "ai_feedback": "fake",
        },
    ).json()
    assert updated["status"] == "paused"
    assert updated["current_question_index"] == 2
    assert updated["overall_score"] is None
    assert updated["strengths"] == []
    assert updated["ai_feedback"] is None


def test_cross_user_cannot_save_answer(client: TestClient, auth_headers):
    case_id = _seed_case()
    attempt = client.post(
        "/api/cases/attempts", headers=auth_headers, json={"case_id": case_id}
    ).json()
    questions = client.get(
        f"/api/cases/{case_id}/questions", headers=auth_headers
    ).json()
    other_headers = _signup_other(client, "other-answer@example.com")
    resp = client.post(
        "/api/cases/answers",
        headers=other_headers,
        json={
            "attempt_id": attempt["id"],
            "question_id": questions[0]["id"],
            "answer_text": "intruder",
        },
    )
    assert resp.status_code == 403


def test_evaluate_requires_answers(client: TestClient, auth_headers):
    case_id = _seed_case()
    attempt = client.post(
        "/api/cases/attempts", headers=auth_headers, json={"case_id": case_id}
    ).json()
    resp = client.post(
        f"/api/cases/attempts/{attempt['id']}/evaluate", headers=auth_headers
    )
    assert resp.status_code == 422
    assert "answers" in resp.json()["detail"].lower()


def test_evaluate_stub_provider_clear_error(client: TestClient, auth_headers, monkeypatch):
    from app.ai.client import StubLLMClient

    monkeypatch.setattr(
        "app.services.case_evaluation_service.get_llm_client",
        lambda: StubLLMClient(),
    )
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
            "answer_text": "a",
        },
    )
    resp = client.post(
        f"/api/cases/attempts/{attempt['id']}/evaluate", headers=auth_headers
    )
    assert resp.status_code == 502
    assert "GROQ_API_KEY" in resp.json()["detail"]


def test_evaluate_persists_real_scores(client: TestClient, auth_headers, monkeypatch):
    fake = FakeLLM([json.dumps(EVALUATION)])
    monkeypatch.setattr(
        "app.services.case_evaluation_service.get_llm_client", lambda: fake
    )
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
        f"/api/cases/attempts/{attempt['id']}/evaluate", headers=auth_headers
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "completed"
    assert body["overall_score"] == 72
    assert body["structuring_score"] == 70
    assert body["quantitative_score"] == 65
    assert body["communication_score"] == 80
    assert body["strengths"] == ["Clear structure", "Good math"]
    assert body["weaknesses"] == ["Quantitative depth", "Business judgment"]
    assert body["recommendations"] == "Practice mental math drills"
    # Unmatched skills stay empty — no fabricated numbers.
    assert body["synthesis_score"] is None
    assert fake.calls == 1

    # Per-answer scores remain null — evaluation is holistic + server-owned.
    answers = client.get(
        f"/api/cases/attempts/{attempt['id']}/answers", headers=auth_headers
    ).json()
    assert len(answers) == 1
    assert answers[0]["score"] is None


def test_evaluate_records_progress_skill_scores(
    client: TestClient, auth_headers, monkeypatch
):
    """A real AI evaluation must feed canonical skill scores into progress."""
    from app.models.profile import Profile
    from app.models.skill import Skill, UserSkill
    from app.models.user import User

    fake = FakeLLM([json.dumps(EVALUATION)])
    monkeypatch.setattr(
        "app.services.case_evaluation_service.get_llm_client", lambda: fake
    )
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
        f"/api/cases/attempts/{attempt['id']}/evaluate", headers=auth_headers
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
        # Evaluator skill names are canonicalized to the product skill names.
        assert by_name == {
            "Structuring": 70,
            "Quantitative Analysis": 65,
            "Communication": 80,
        }
        # The first measurement has no previous score — no fabricated delta.
        for row, _skill in joined:
            assert row.previous_score is None
        profile = s.query(Profile).filter(Profile.user_id == user.id).first()
        assert profile is not None
        assert profile.readiness_score > 0


def test_evaluate_ownership(client: TestClient, auth_headers, monkeypatch):
    fake = FakeLLM([json.dumps(EVALUATION)])
    monkeypatch.setattr(
        "app.services.case_evaluation_service.get_llm_client", lambda: fake
    )
    case_id = _seed_case()
    attempt = client.post(
        "/api/cases/attempts", headers=auth_headers, json={"case_id": case_id}
    ).json()
    other_headers = _signup_other(client, "other-eval@example.com")
    resp = client.post(
        f"/api/cases/attempts/{attempt['id']}/evaluate", headers=other_headers
    )
    assert resp.status_code == 403