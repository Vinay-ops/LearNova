import pytest
from fastapi.testclient import TestClient

pytestmark = pytest.mark.phase6


class TestPromptReadAPI:
    def test_list_prompts(self, client: TestClient, auth_headers):
        resp = client.get("/api/prompts", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        names = {p["name"] for p in data}
        assert "interviewer" in names
        assert "evaluator" in names
        assert "case_generation" in names

    def test_list_versions(self, client: TestClient, auth_headers):
        resp = client.get("/api/prompts/interviewer/versions", headers=auth_headers)
        assert resp.status_code == 200
        versions = resp.json()
        assert isinstance(versions, list)
        assert len(versions) >= 1
        v = versions[0]
        assert "version" in v
        assert "system_prompt" in v
        assert "techniques" in v
        assert "technique_notes" in v

    def test_get_prompt_latest(self, client: TestClient, auth_headers):
        resp = client.get("/api/prompts/evaluator/latest", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == "evaluator"
        assert body["model"].startswith("gpt")

    def test_render_prompt(self, client: TestClient, auth_headers):
        resp = client.post("/api/prompts/render", headers=auth_headers, json={
            "prompt_id": "00000000-0000-0000-0000-000000000000",
            "variables": {
                "candidate_profile": "exp=3y, firm=McK",
                "case_info": "Market entry for EV",
                "conversation_history": [],
                "current_performance": "average",
            },
        })
        assert resp.status_code == 200
        body = resp.json()
        assert "system_prompt" in body
        assert "user_prompt" in body
        assert len(body["system_prompt"]) > 10
        assert len(body["user_prompt"]) > 10


class TestPromptTemplateRendering:
    def test_interviewer_prompt_renders_all_vars(self):
        from app.ai import prompt_registry
        t = prompt_registry.get("interviewer")
        ctx = {
            "experience_level": "Intermediate",
            "target_firms": "McKinsey, BCG",
            "interview_date": "2026-10-01",
            "current_performance": "average",
            "case_title": "Market Entry",
            "case_company": "AutoTech",
            "case_type": "Market Entry",
            "case_difficulty": "Medium",
            "case_background": "EV market analysis",
            "questions_summary": "Q1: Structuring\nQ2: Quantitative",
            "conversation_history": "Candidate: Hello",
            "question_index": 1,
            "total_questions": 5,
        }
        sys = t.render_system(ctx)
        usr = t.render_user(ctx)
        assert "senior management consultant" in sys.lower()
        assert "one question at a time" in sys.lower()
        ok, errs = t.validate_context(ctx)
        assert ok, errs

    def test_evaluator_prompt_techniques_flagged(self):
        from app.ai import prompt_registry
        t = prompt_registry.get("evaluator")
        assert t.techniques.rubric_based_evaluation is True
        assert t.techniques.few_shot_examples is True
        assert t.techniques.structured_output is True

    def test_structured_output_validation_success(self):
        from app.ai.client import validate_structured_output
        from app.schemas.ai import StructuredEvaluation
        raw = '''{
          "overall_score": 75,
          "skills": [
            {"skill": "Problem Structuring", "score": 80, "evidence": "Good seg."},
            {"skill": "Quantitative Reasoning", "score": 70, "evidence": "Okay math."}
          ],
          "strengths": ["s1"], "improvements": ["i1"], "recommendations": ["r1"]
        }'''
        result = validate_structured_output(
            raw, StructuredEvaluation, max_retries=1, prompt_name="test")
        assert result.overall_score == 75
        assert len(result.skills) == 2

    def test_structured_output_validation_failure_retries(self):
        from app.ai.client import validate_structured_output, AIValidationError
        from app.schemas.ai import StructuredEvaluation
        with pytest.raises(AIValidationError):
            validate_structured_output(
                "NOT JSON", StructuredEvaluation, max_retries=2, prompt_name="test")
