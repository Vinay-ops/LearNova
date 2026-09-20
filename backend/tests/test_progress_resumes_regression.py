"""Regression tests for the two production 500s.

Root cause (both endpoints): ``backend/supabase_schema.sql`` — the hand-run
Supabase bootstrap file — was missing the ``resumes`` and
``readiness_snapshots`` tables, the two tables added by alembic migration
``0003``.  A database bootstrapped from that file therefore raised
``UndefinedTable`` on:

* ``GET /api/resumes``            (selects ``resumes``)
* ``GET /api/progress``           (selects ``readiness_snapshots`` for the
                                   readiness chart)

Local dev and the test suite were unaffected because both build the schema from
the SQLAlchemy models, which is exactly why the bug only appeared in the
browser against Supabase.

These tests pin (a) the API contract for a brand-new zero-activity user, (b) the
activity counters, (c) ownership isolation, and (d) that the SQL bootstrap file
can never silently drift from the models again.
"""

import re
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.db.database import Base, SessionLocal
import app.db.base  # noqa: F401 - registers every model with Base
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.case import Case, CaseAttempt
from app.models.drill import Drill, DrillAttempt
from app.models.ai_session import AISession
from app.models.user import User
from app.utils.enums import CaseType, Difficulty

pytestmark = pytest.mark.phase2

BACKEND_DIR = Path(__file__).resolve().parents[1]


# ── helpers ──────────────────────────────────────────────────────────────────


def _user_id(email: str = "test-user-fixture@example.com") -> str:
    with SessionLocal() as s:
        user = s.query(User).filter(User.email == email).first()
        assert user is not None, f"no user with email {email}"
        return user.id


def _seed_completed_assessment(user_id: str, score: int = 70) -> None:
    with SessionLocal() as s:
        assessment = Assessment(
            title="Data Structures Basics",
            category="CS Fundamentals",
            description="d",
            difficulty=Difficulty.MEDIUM.value,
            total_questions=10,
            time_limit_minutes=20,
        )
        s.add(assessment)
        s.flush()
        s.add(
            AssessmentAttempt(
                user_id=user_id,
                assessment_id=assessment.id,
                status="completed",
                total_questions=10,
                correct_count=7,
                score=score,
                time_spent_seconds=600,
            )
        )
        s.commit()


def _seed_completed_drill(user_id: str, score: int = 80) -> None:
    with SessionLocal() as s:
        drill = Drill(
            title="Mental Math",
            description="d",
            difficulty=Difficulty.MEDIUM.value,
            duration_minutes=10,
            total_questions=5,
        )
        s.add(drill)
        s.flush()
        s.add(
            DrillAttempt(
                user_id=user_id,
                drill_id=drill.id,
                status="completed",
                total_questions=5,
                correct_count=4,
                score=score,
                time_spent_seconds=300,
            )
        )
        s.commit()


def _seed_completed_case(user_id: str, score: int = 65) -> None:
    with SessionLocal() as s:
        case = Case(
            title="Profitability Case",
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
            CaseAttempt(
                user_id=user_id,
                case_id=case.id,
                status="completed",
                elapsed_seconds=1200,
                overall_score=score,
            )
        )
        s.commit()


def _seed_completed_interview(user_id: str, overall_score: int = 74) -> None:
    with SessionLocal() as s:
        s.add(
            AISession(
                user_id=user_id,
                session_type="case_interview",
                status="completed",
                metadata_={"evaluation": {"overall_score": overall_score}},
            )
        )
        s.commit()


def _save_resume(client: TestClient, headers, filename: str, name: str):
    return client.post(
        "/api/resumes",
        headers=headers,
        json={
            "filename": filename,
            "source_type": "pdf",
            "resume": {
                "name": name,
                "title": "Data Analyst",
                "summary": "summary",
                "skills": ["SQL", "Python"],
                "technologies": ["pandas"],
                "projects": [{"name": "Churn", "description": "d", "technologies": ["SQL"]}],
                "experience": [],
                "education": [],
                "certifications": [],
            },
        },
    )


# ── schema drift guard (would have caught the original 500s) ─────────────────


def test_supabase_schema_declares_every_model_table():
    """The SQL bootstrap file must cover every mapped table.

    A table present in the models but absent here means a Supabase database
    created from this file is missing it → UndefinedTable → HTTP 500 on
    whichever endpoint touches it.
    """
    sql = (BACKEND_DIR / "supabase_schema.sql").read_text(encoding="utf-8")
    declared = set(re.findall(r"CREATE TABLE (?:IF NOT EXISTS )?(\w+)", sql))
    expected = set(Base.metadata.tables.keys()) | {"alembic_version"}
    missing = expected - declared
    assert not missing, (
        f"supabase_schema.sql is missing tables present in the models: {sorted(missing)}. "
        "Add the CREATE TABLE statements (and indexes) so a fresh Supabase "
        "bootstrap matches the ORM."
    )


def test_alembic_revision_ids_fit_the_version_column():
    """Every revision id must fit ``alembic_version.version_num`` (VARCHAR(32)).

    Alembic creates that column as VARCHAR(32). SQLite ignores the length, so an
    over-long id passes locally — but PostgreSQL raises
    ``value too long for type character varying(32)`` and the upgrade dies. That
    is precisely how revision ``0003_resumes_and_readiness_snapshots`` (36 chars)
    broke ``alembic upgrade head`` on Supabase while passing every local run.
    """
    over_long: list[tuple[str, str]] = []
    for path in (BACKEND_DIR / "alembic" / "versions").glob("*.py"):
        text = path.read_text(encoding="utf-8")
        match = re.search(r'^revision:\s*str\s*=\s*"([^"]+)"', text, re.M)
        if match and len(match.group(1)) > 32:
            over_long.append((path.name, match.group(1)))

    assert not over_long, (
        f"these revision ids exceed VARCHAR(32) and would fail on PostgreSQL: {over_long}"
    )


def test_supabase_schema_stamps_alembic_head():
    """The bootstrap file stamps alembic_version — it must stamp the real head.

    If it stamps an older revision, `alembic upgrade head` would try to re-create
    tables the file already created, and the schema would silently lag the ORM.
    """
    versions_dir = BACKEND_DIR / "alembic" / "versions"
    revisions: dict[str, str | None] = {}
    for path in versions_dir.glob("*.py"):
        text = path.read_text(encoding="utf-8")
        revision = re.search(r'^revision:\s*str\s*=\s*"([^"]+)"', text, re.M)
        down = re.search(r'^down_revision:\s*Union\[str, None\]\s*=\s*"([^"]+)"', text, re.M)
        if revision:
            revisions[revision.group(1)] = down.group(1) if down else None

    linked = {d for d in revisions.values() if d}
    heads = set(revisions) - linked
    assert len(heads) == 1, f"expected a single alembic head, found {sorted(heads)}"
    head = heads.pop()

    sql = (BACKEND_DIR / "supabase_schema.sql").read_text(encoding="utf-8")
    stamped = re.search(r"INSERT INTO alembic_version \(version_num\) VALUES \('([^']+)'\)", sql)
    assert stamped, "supabase_schema.sql does not stamp alembic_version"
    assert stamped.group(1) == head, (
        f"supabase_schema.sql stamps {stamped.group(1)!r} but the alembic head is {head!r}"
    )
    # The stamp is inserted into the same VARCHAR(32) column, so it is bound by
    # the identical length limit.
    assert len(stamped.group(1)) <= 32, (
        f"stamped revision {stamped.group(1)!r} exceeds VARCHAR(32)"
    )


# ── /api/progress ────────────────────────────────────────────────────────────


def test_new_user_with_zero_activity_gets_valid_zero_summary(
    client: TestClient, auth_headers
):
    """A brand-new user must get a valid empty progress payload, never a 5xx."""
    resp = client.get("/api/progress", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()

    assert body["readiness_score"] == 0
    assert body["total_cases_completed"] == 0
    assert body["total_assessments_completed"] == 0
    assert body["total_drills_completed"] == 0
    assert body["total_interviews_completed"] == 0
    assert body["average_interview_score"] is None
    assert body["skill_scores"] == []
    # Readiness history is real measurements only — empty until earned.
    assert body["readiness_over_time"] == []


def test_progress_requires_authentication(client: TestClient):
    assert client.get("/api/progress").status_code == 401


def test_progress_reflects_quiz_and_assessment_activity(client: TestClient, auth_headers):
    _seed_completed_assessment(_user_id(), score=70)

    body = client.get("/api/progress", headers=auth_headers).json()
    assert body["total_assessments_completed"] == 1
    assert body["total_cases_completed"] == 0
    assert body["total_interviews_completed"] == 0


def test_progress_reflects_interview_activity(client: TestClient, auth_headers):
    _seed_completed_interview(_user_id(), overall_score=74)

    body = client.get("/api/progress", headers=auth_headers).json()
    assert body["total_interviews_completed"] == 1
    assert body["average_interview_score"] == 74.0


def test_progress_reflects_mixed_activity_and_lifts_readiness(
    client: TestClient, auth_headers
):
    uid = _user_id()
    _seed_completed_case(uid)
    _seed_completed_drill(uid)
    _seed_completed_assessment(uid)
    _seed_completed_interview(uid)

    body = client.get("/api/progress", headers=auth_headers).json()
    assert body["total_cases_completed"] == 1
    assert body["total_drills_completed"] == 1
    assert body["total_assessments_completed"] == 1
    assert body["total_interviews_completed"] == 1
    assert body["average_score"] == 65  # case attempt overall_score
    assert body["best_score"] == 65
    assert body["total_practice_minutes"] == 25  # 1200s case + 300s drill

    # Readiness is recalculated from measured activity, not fabricated.
    recalc = client.post("/api/progress/recalculate-readiness", headers=auth_headers)
    assert recalc.status_code == 200
    assert recalc.json()["readiness_score"] > 0

    after = client.get("/api/progress", headers=auth_headers).json()
    assert after["readiness_score"] == recalc.json()["readiness_score"]
    assert len(after["readiness_over_time"]) == 1


def test_progress_is_isolated_between_users(client: TestClient, auth_headers):
    """User B must never see user A's activity."""
    _seed_completed_case(_user_id())

    other = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Progress Other",
            "email": "progress-other@example.com",
            "password": "Password123!",
        },
    ).json()
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}

    a_body = client.get("/api/progress", headers=auth_headers).json()
    b_body = client.get("/api/progress", headers=other_headers).json()

    assert a_body["total_cases_completed"] == 1
    assert b_body["total_cases_completed"] == 0
    assert b_body["user_id"] != a_body["user_id"]


# ── /api/resumes ─────────────────────────────────────────────────────────────


def test_resumes_empty_library_returns_empty_list(client: TestClient, auth_headers):
    """A user with zero resumes gets 200 + [], never a 5xx."""
    resp = client.get("/api/resumes", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    assert resp.json() == []


def test_resumes_requires_authentication(client: TestClient):
    assert client.get("/api/resumes").status_code == 401


def test_user_with_one_resume_sees_exactly_one(client: TestClient, auth_headers):
    created = _save_resume(client, auth_headers, "priya.pdf", "Priya Sharma")
    assert created.status_code == 201, created.text

    listing = client.get("/api/resumes", headers=auth_headers).json()
    assert len(listing) == 1
    assert listing[0]["filename"] == "priya.pdf"
    # Structured data only — the raw upload is never persisted or returned.
    assert "raw" not in listing[0]
    assert listing[0]["data"]["name"] == "Priya Sharma"


def test_multiple_resumes_are_all_listed(client: TestClient, auth_headers):
    for i in range(3):
        resp = _save_resume(client, auth_headers, f"resume-{i}.pdf", f"Person {i}")
        assert resp.status_code == 201, resp.text

    listing = client.get("/api/resumes", headers=auth_headers).json()
    assert len(listing) == 3
    assert {r["filename"] for r in listing} == {
        "resume-0.pdf",
        "resume-1.pdf",
        "resume-2.pdf",
    }


def test_resume_library_is_isolated_between_users(client: TestClient, auth_headers):
    _save_resume(client, auth_headers, "mine.pdf", "Me")

    other = client.post(
        "/api/auth/signup",
        json={
            "full_name": "Resume Other",
            "email": "resume-other-lib@example.com",
            "password": "Password123!",
        },
    ).json()
    other_headers = {"Authorization": f"Bearer {other['access_token']}"}

    assert client.get("/api/resumes", headers=other_headers).json() == []
    assert len(client.get("/api/resumes", headers=auth_headers).json()) == 1


def test_malformed_resume_payload_is_rejected(client: TestClient, auth_headers):
    # Missing the required `resume` object entirely → 422, not 500.
    resp = client.post(
        "/api/resumes",
        headers=auth_headers,
        json={"filename": "broken.pdf"},
    )
    assert resp.status_code == 422


def test_unusable_resume_content_is_rejected(client: TestClient, auth_headers):
    """A resume with no skills, projects or experience is 422, not a stored blank."""
    resp = client.post(
        "/api/resumes",
        headers=auth_headers,
        json={
            "filename": "empty.pdf",
            "resume": {
                "name": "",
                "skills": [],
                "technologies": [],
                "projects": [],
                "experience": [],
                "education": [],
                "certifications": [],
            },
        },
    )
    assert resp.status_code == 422
    assert "usable" in resp.json()["detail"].lower()
