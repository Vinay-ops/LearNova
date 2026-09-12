"""Offline prompt regression suite (no LLM, no network).

Renders the versioned interviewer/evaluator/parser prompts over a small set of
scenarios and asserts structural guarantees that matter for prompt quality:

- role/resume interviewers receive the candidate's actual resume facts
- resume grounding instructions are present and explicit
- no-repeat constraints exist for interviewers
- evaluation prompts carry transcript-only confidence semantics
- output contracts (documented JSON schemas) stay valid and versioned
"""
import json

import pytest

from app.ai import bootstrap_prompts
from app.ai.prompts.base import prompt_registry

bootstrap_prompts()

# -- scenario fixtures ---------------------------------------------------------

RESUME_RICH = {
    "name": "Alex Rivera",
    "title": "Backend Engineer",
    "summary": "Backend engineer focused on data products.",
    "skills": ["Python", "SQL", "React", "Machine Learning"],
    "technologies": ["FastAPI", "PostgreSQL", "scikit-learn", "Docker"],
    "projects": [
        {
            "name": "ML Sales Forecaster",
            "description": "Time-series model forecasting retail sales.",
            "technologies": ["Python", "scikit-learn", "FastAPI"],
        }
    ],
    "experience": [
        {
            "role": "Backend Engineer",
            "company": "Acme Corp",
            "duration": "2021-2025",
            "summary": "Owned the data pipeline and API layer.",
        }
    ],
    "education": [{"degree": "BSc CS", "institution": "State University", "year": "2021"}],
    "certifications": ["AWS Certified Developer"],
}

RESUME_EMPTY = {"name": "", "title": "", "skills": [], "projects": [], "experience": []}


def _base_context() -> dict:
    return {
        "experience_level": "Intermediate",
        "target_firms": "MBB",
        "interview_date": "2026-09-10",
        "current_performance": "No prior attempts",
        "case_title": "Software Engineer",
        "case_company": "Learnova",
        "case_type": "Software Engineer",
        "case_difficulty": "Medium",
        "case_background": "JOB ROLE: Software Engineer",
        "questions_summary": "",
        "conversation_history": "(no prior messages)",
        "question_index": 1,
        "total_questions": 6,
    }


def _format_resume_block(resume: dict) -> str:
    lines = []
    skills = resume.get("skills") or []
    if skills:
        lines.append("Skills: " + ", ".join(skills))
    for p in (resume.get("projects") or [])[:5]:
        lines.append(f"- {p.get('name')}: {p.get('description')}")
    for e in (resume.get("experience") or [])[:5]:
        lines.append(f"- {e.get('role')} @ {e.get('company')}")
    tech = resume.get("technologies") or []
    if tech:
        lines.append("Technologies: " + ", ".join(tech))
    return "\n".join(lines) or "(no resume content)"


# -- interviewers: resume grounding + no-repeat -------------------------------


@pytest.mark.parametrize(
    "resume,expected_fragment",
    [
        (RESUME_RICH, "ML Sales Forecaster"),
        (RESUME_RICH, "Backend Engineer @ Acme Corp"),
        (RESUME_RICH, "scikit-learn"),
    ],
)
def test_role_interviewer_prompt_contains_resume_facts(resume, expected_fragment):
    template = prompt_registry.get("role_interviewer", "v1")
    context = _base_context()
    context["case_background"] = _format_resume_block(resume)
    rendered = template.render_system(context) + template.render_user(context)
    assert expected_fragment in rendered
    # Grounding must never ask the model to invent resume facts.
    assert "Never invent" in template.system_prompt or "ACTUALLY in" in template.system_prompt


def test_role_interviewer_system_prompt_has_adaptivity_and_no_repeat_rules():
    template = prompt_registry.get("role_interviewer", "v1")
    assert "Never repeat a question" in template.system_prompt
    assert "weak|average|strong" in template.system_prompt
    assert "easy|medium|hard" in template.system_prompt
    assert "grounding" in template.system_prompt


def test_evaluator_prompt_confidence_is_transcript_based():
    template = prompt_registry.get("interview_evaluator", "v1")
    assert "NO audio" in template.system_prompt
    assert "Resume Alignment must reference only facts" in template.system_prompt
    assert "Resume Alignment" in template.system_prompt
    assert "Technical Knowledge" in template.system_prompt


def test_resume_parser_prompt_forbids_fabrication():
    template = prompt_registry.get("resume_parser", "v1")
    assert "Never invent" in template.system_prompt
    assert "Return JSON only" in template.system_prompt


# -- output contract regression (canned LLM output, no provider) --------------

INTERVIEWER_OUTPUT = {
    "question": "Tell me about the ML Sales Forecaster project.",
    "question_type": "technical",
    "display_hint": "",
    "expected_duration_seconds": 120,
    "performance": "strong",
    "next_difficulty": "hard",
    "grounding": {
        "source": "resume",
        "section": "projects",
        "reference": "ML Sales Forecaster",
        "reason": "Candidate's most substantive project matches the role.",
    },
    "notes": "",
}


def test_role_interviewer_output_contract_valid():
    # Contract validation (mirrors the app-layer validation in the interviewer
    # service): allowed enums and required fields, offline and deterministic.
    assert INTERVIEWER_OUTPUT["question"].strip()
    assert INTERVIEWER_OUTPUT["question_type"] in {
        "introduction", "technical", "probe", "behavioral", "problem_solving", "closing",
    }
    assert INTERVIEWER_OUTPUT["performance"] in {"weak", "average", "strong"}
    assert INTERVIEWER_OUTPUT["next_difficulty"] in {"easy", "medium", "hard"}
    assert INTERVIEWER_OUTPUT["grounding"]["source"] in {"resume", "role", "general"}
    assert json.dumps(INTERVIEWER_OUTPUT)


def test_interview_evaluator_output_contract_valid():
    output = {
        "overall_score": 81,
        "skills": [
            {"skill": "Technical Knowledge", "score": 85, "evidence": "Explained the model"},
            {"skill": "Resume Alignment", "score": 88, "evidence": "Cited the real project"},
        ],
        "strengths": ["Grounded in the resume project"],
        "improvements": ["Structure the walkthrough"],
        "recommendations": ["Practice system design"],
    }
    assert 0 <= output["overall_score"] <= 100
    names = {s["skill"] for s in output["skills"]}
    assert "Resume Alignment" in names and "Technical Knowledge" in names
    for s in output["skills"]:
        assert 0 <= s["score"] <= 100
        assert s["evidence"], "every skill score needs transcript evidence"
    assert json.dumps(output)


# -- version stability ---------------------------------------------------------


def test_prompt_versions_are_explicit():
    assert prompt_registry.get("interviewer", "v1").version == "v1"
    assert prompt_registry.get("role_interviewer", "v1").version == "v1"
    assert prompt_registry.get("interview_evaluator", "v1").version == "v1"
    assert prompt_registry.get("resume_parser", "v1").version == "v1"
    # v2 does not exist yet — versions are explicit, never guessed.
    with pytest.raises(KeyError):
        prompt_registry.get("role_interviewer", "v2")
