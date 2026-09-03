import json

import pytest

from app.ai.client import LLMResponse
from app.db.database import SessionLocal
from app.models.assessment import AssessmentQuestion
from app.services.quiz_service import QuizService


def _db_questions(assessment_id: str):
    """Read the answer key straight from the DB (server-side truth)."""
    with SessionLocal() as s:
        return (
            s.query(AssessmentQuestion)
            .filter(AssessmentQuestion.assessment_id == assessment_id)
            .order_by(AssessmentQuestion.display_order.asc())
            .all()
        )

VALID_QUIZ = {
    "questions": [
        {
            "question": "What does the @ symbol above a Python function definition mean?",
            "question_type": "mcq",
            "options": ["It applies a decorator", "It defines a class", "It imports a module", "It declares a type"],
            "correct_index": 0,
            "explanation": "The @name syntax applies the decorator function name to the function below it.",
            "difficulty": "Easy",
            "subtopic": "decorators",
        },
        {
            "question": "Which keyword creates a generator in Python?",
            "question_type": "mcq",
            "options": ["yield", "return", "break", "await"],
            "correct_index": 0,
            "explanation": "A function containing yield becomes a generator that produces values lazily.",
            "difficulty": "Medium",
            "subtopic": "generators",
        },
        {
            "question": "Which method appends an item to the end of a list?",
            "question_type": "mcq",
            "options": ["append()", "push()", "insert()", "add()"],
            "correct_index": 0,
            "explanation": "list.append(x) adds x at the end; push() is not a list method.",
            "difficulty": "Easy",
            "subtopic": "lists",
        },
    ]
}

# First batch contains two invalid questions (duplicate options, only 3 options).
BAD_FIRST_BATCH = {
    "questions": [
        VALID_QUIZ["questions"][0],
        {
            "question": "Duplicate options question?",
            "question_type": "mcq",
            "options": ["One", "One", "Two", "Three"],
            "correct_index": 0,
            "explanation": "Should be rejected because options duplicate.",
            "difficulty": "Medium",
            "subtopic": "lists",
        },
        {
            "question": "Only three options question?",
            "question_type": "mcq",
            "options": ["Alpha", "Beta", "Gamma"],
            "correct_index": 0,
            "explanation": "Should be rejected because there are only three options.",
            "difficulty": "Medium",
            "subtopic": "strings",
        },
    ]
}

REPLACEMENT_BATCH = {
    "questions": [
        {
            "question": "How do you capture a value from a generator?",
            "question_type": "mcq",
            "options": ["next()", "pop()", "get()", "value()"],
            "correct_index": 0,
            "explanation": "next(gen) pulls the next produced value from the generator.",
            "difficulty": "Medium",
            "subtopic": "generators",
        },
        {
            "question": "Which list operation removes the item at a given index?",
            "question_type": "mcq",
            "options": ["del", "remove()", "pop()", "clear()"],
            "correct_index": 2,
            "explanation": "list.pop(index) removes and returns the item at index.",
            "difficulty": "Medium",
            "subtopic": "lists",
        },
    ]
}


class FakeLLM:
    """Deterministic fake LLM client that replays canned responses."""

    def __init__(self, responses):
        self._responses = list(responses)
        self.calls = 0

    def chat(self, **kwargs):
        self.calls += 1
        content = self._responses.pop(0) if self._responses else json.dumps({"questions": []})
        return LLMResponse(content=content, model="fake-model", tokens_used=10)


def test_deterministic_question_validation():
    from app.schemas.quiz import QuizQuestionDraft

    good = QuizQuestionDraft.model_validate(VALID_QUIZ["questions"][0])
    assert QuizService._validate_question(good, 0) == []

    dup = QuizQuestionDraft.model_validate(BAD_FIRST_BATCH["questions"][1])
    problems = QuizService._validate_question(dup, 1)
    assert any("unique" in p for p in problems)

    short = QuizQuestionDraft.model_validate(BAD_FIRST_BATCH["questions"][2])
    problems = QuizService._validate_question(short, 2)
    assert any("4 options" in p for p in problems)

    out_of_range = QuizQuestionDraft.model_validate(VALID_QUIZ["questions"][0])
    out_of_range = out_of_range.model_copy(update={"correct_index": 9})
    assert any("0..3" in p for p in QuizService._validate_question(out_of_range, 0))


def test_request_validation(client, auth_headers):
    resp = client.post("/api/quizzes/generate", json={"topic": "  ", "question_count": 5}, headers=auth_headers)
    assert resp.status_code == 422

    resp = client.post("/api/quizzes/generate", json={"topic": "Python", "question_count": 100}, headers=auth_headers)
    assert resp.status_code == 422

    resp = client.post("/api/quizzes/generate", json={"topic": "Python", "difficulty": "Hardcore"}, headers=auth_headers)
    assert resp.status_code == 422


def test_generate_quiz_flow(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.services.quiz_service.get_llm_client",
        lambda: FakeLLM([json.dumps(VALID_QUIZ)]),
    )

    resp = client.post(
        "/api/quizzes/generate",
        json={"topic": "Python", "difficulty": "Medium", "question_count": 3},
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assessment_id = body["assessment_id"]
    assert body["question_count"] == 3
    assert body["topic"] == "Python"

    # The taking endpoint must NOT leak the answer key.
    qs = client.get(f"/api/assessments/{assessment_id}/questions", headers=auth_headers).json()
    assert len(qs) == 3
    for q in qs:
        assert q["question_type"] == "mcq"
        assert len(q["options"]) == 4
        assert len(set(q["options"])) == 4
        assert q["correct_option_index"] is None
        assert q["correct_answer"] is None
        assert q["explanation"] is None
        assert q["skill_tag"]

    # The answer key is only revealed via the review endpoint AFTER completion.
    attempt = client.post(
        "/api/assessments/attempts",
        json={"assessment_id": assessment_id},
        headers=auth_headers,
    ).json()
    in_progress = client.get(
        f"/api/assessments/attempts/{attempt['id']}/review", headers=auth_headers
    )
    assert in_progress.status_code == 422

    client.post(
        f"/api/assessments/attempts/{attempt['id']}/complete", headers=auth_headers
    )
    review = client.get(
        f"/api/assessments/attempts/{attempt['id']}/review", headers=auth_headers
    ).json()
    assert len(review) == 3
    db_keys = [q.correct_option_index for q in _db_questions(assessment_id)]
    for i, item in enumerate(review):
        assert item["correct_option_index"] == db_keys[i]
        assert item["explanation"]
        assert item["answered"] is False  # no answers were submitted


def test_generate_rejects_invalid_and_regenerates(client, auth_headers, monkeypatch):
    fake = FakeLLM([json.dumps(BAD_FIRST_BATCH), json.dumps(REPLACEMENT_BATCH)])
    monkeypatch.setattr("app.services.quiz_service.get_llm_client", lambda: fake)

    resp = client.post(
        "/api/quizzes/generate",
        json={"topic": "Python", "question_count": 3},
        headers=auth_headers,
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["question_count"] == 3
    # initial + one regeneration round for the two invalid questions
    assert fake.calls == 2

    qs = client.get(f"/api/assessments/{resp.json()['assessment_id']}/questions", headers=auth_headers).json()
    assert len(qs) == 3
    # the bad questions must not be present
    texts = {q["question_text"].lower() for q in qs}
    assert "duplicate options question?" not in texts
    assert "only three options question?" not in texts


def test_server_authoritative_scoring(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.services.quiz_service.get_llm_client",
        lambda: FakeLLM([json.dumps(VALID_QUIZ)]),
    )
    assessment_id = client.post(
        "/api/quizzes/generate",
        json={"topic": "Python", "question_count": 3},
        headers=auth_headers,
    ).json()["assessment_id"]

    # The taker never sees the key; the test reads it from the DB (server side).
    db_questions = _db_questions(assessment_id)
    qs = client.get(f"/api/assessments/{assessment_id}/questions", headers=auth_headers).json()
    assert all(q["correct_option_index"] is None for q in qs)

    attempt = client.post(
        "/api/assessments/attempts",
        json={"assessment_id": assessment_id},
        headers=auth_headers,
    ).json()

    # Answer Q0 correctly but CLAIM it is wrong — server must override to true.
    client.post(
        "/api/assessments/answers",
        json={
            "attempt_id": attempt["id"],
            "question_id": qs[0]["id"],
            "selected_option_index": db_questions[0].correct_option_index,
            "is_correct": False,
            "points_earned": 0,
        },
        headers=auth_headers,
    )
    # Answer Q1 incorrectly but CLAIM it is right — server must override to false.
    wrong = (db_questions[1].correct_option_index + 1) % 4
    client.post(
        "/api/assessments/answers",
        json={
            "attempt_id": attempt["id"],
            "question_id": qs[1]["id"],
            "selected_option_index": wrong,
            "is_correct": True,
            "points_earned": 1,
        },
        headers=auth_headers,
    )
    # Q2 left unanswered.

    completed = client.post(
        f"/api/assessments/attempts/{attempt['id']}/complete",
        headers=auth_headers,
    ).json()
    assert completed["status"] == "completed"
    assert completed["total_questions"] == 3
    assert completed["correct_count"] == 1
    assert abs(float(completed["score"]) - 33.33) < 0.1

    analysis = client.get(
        f"/api/quizzes/attempts/{attempt['id']}/analysis",
        headers=auth_headers,
    ).json()
    assert analysis["unanswered"] == 1
    assert analysis["correct_count"] == 1
    assert "decorators" in analysis["strong_subtopics"]
    assert "generators" in analysis["weak_subtopics"]

    # After completion the review endpoint carries per-question truth.
    review = client.get(
        f"/api/assessments/attempts/{attempt['id']}/review", headers=auth_headers
    ).json()
    assert len(review) == 3
    assert review[0]["is_correct"] is True
    assert review[0]["correct_option_index"] == db_questions[0].correct_option_index
    assert review[1]["is_correct"] is False
    assert review[2]["answered"] is False
    assert review[2]["is_correct"] is None


def test_review_requires_ownership_and_completion(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.services.quiz_service.get_llm_client",
        lambda: FakeLLM([json.dumps(VALID_QUIZ)]),
    )
    assessment_id = client.post(
        "/api/quizzes/generate",
        json={"topic": "Python", "question_count": 3},
        headers=auth_headers,
    ).json()["assessment_id"]

    attempt = client.post(
        "/api/assessments/attempts",
        json={"assessment_id": assessment_id},
        headers=auth_headers,
    ).json()

    # A different user cannot read this attempt's review.
    other = client.post(
        "/api/auth/signup",
        json={"full_name": "Other", "email": "other2@example.com", "password": "Password123!"},
    ).json()
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}
    resp = client.get(
        f"/api/assessments/attempts/{attempt['id']}/review", headers=other_headers
    )
    assert resp.status_code in (403, 404)

    # In-progress attempts never reveal the key.
    in_progress = client.get(
        f"/api/assessments/attempts/{attempt['id']}/review", headers=auth_headers
    )
    assert in_progress.status_code == 422


def test_learning_chat_flow(client, auth_headers, monkeypatch):
    monkeypatch.setattr(
        "app.services.learning_service.get_llm_client",
        lambda: FakeLLM(["TUTOR: A decorator wraps a function to extend its behavior."]),
    )

    session = client.post(
        "/api/learning/sessions",
        json={"topic": "Python decorators", "learner_level": "Beginner"},
        headers=auth_headers,
    )
    assert session.status_code == 201, session.text
    sid = session.json()["id"]
    assert session.json()["topic"] == "Python decorators"

    empty = client.get(f"/api/learning/sessions/{sid}/messages", headers=auth_headers).json()
    assert empty == []

    chat = client.post(
        f"/api/learning/sessions/{sid}/messages",
        json={"content": "What is a decorator?"},
        headers=auth_headers,
    )
    assert chat.status_code == 200, chat.text
    assert "decorator" in chat.json()["reply"].lower()

    msgs = client.get(f"/api/learning/sessions/{sid}/messages", headers=auth_headers).json()
    assert len(msgs) == 2
    assert msgs[0]["role"] == "user"
    assert msgs[1]["role"] == "assistant"


def test_learning_chat_keeps_context(client, auth_headers, monkeypatch):
    calls = []

    class CapturingFake:
        def chat(self, **kwargs):
            calls.append(kwargs)
            return LLMResponse(content=f"Tutor reply {len(calls)}", model="fake-model", tokens_used=10)

    monkeypatch.setattr("app.services.learning_service.get_llm_client", lambda: CapturingFake())

    sid = client.post(
        "/api/learning/sessions",
        json={"topic": "Binary search", "learner_level": "Beginner"},
        headers=auth_headers,
    ).json()["id"]

    client.post(
        f"/api/learning/sessions/{sid}/messages",
        json={"content": "Teach me binary search"},
        headers=auth_headers,
    )
    client.post(
        f"/api/learning/sessions/{sid}/messages",
        json={"content": "Give me a simple example"},
        headers=auth_headers,
    )

    assert len(calls) == 2
    second_prompt = calls[1]["user_prompt"] or ""
    # The second LLM call must contain the first exchange + current question.
    assert "Teach me binary search" in second_prompt
    assert "Tutor reply 1" in second_prompt
    assert "Give me a simple example" in second_prompt
    # And the topic context must be present.
    system_prompt = calls[1]["system_prompt"] or ""
    assert "Binary search" in system_prompt

    # Persisted message ordering: user/assistant/user/assistant.
    msgs = client.get(f"/api/learning/sessions/{sid}/messages", headers=auth_headers).json()
    assert [m["role"] for m in msgs] == ["user", "assistant", "user", "assistant"]


def test_learning_session_ownership(client, auth_headers):
    session = client.post(
        "/api/learning/sessions",
        json={"topic": "SQL joins"},
        headers=auth_headers,
    ).json()

    # second (different) user cannot read the first user's session
    other = client.post(
        "/api/auth/signup",
        json={"full_name": "Other", "email": "other-user@example.com", "password": "Password123!"},
    )
    other_headers = {"Authorization": f"Bearer {other.json()['access_token']}"}
    resp = client.get(f"/api/learning/sessions/{session['id']}", headers=other_headers)
    assert resp.status_code in (403, 404)


def test_invalid_topic_session(client, auth_headers):
    resp = client.post("/api/learning/sessions", json={"topic": " "}, headers=auth_headers)
    assert resp.status_code == 422
