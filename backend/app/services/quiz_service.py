from __future__ import annotations

import difflib
import json
import time
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from ..ai import bootstrap_prompts, get_llm_client
from ..ai.client import LLMClientProtocol, StubLLMClient
from ..ai.prompts.base import prompt_registry
from ..core.exceptions import (
    AIError,
    AIValidationError,
    AuthorizationError,
    NotFoundError,
    ValidationError,
)
from ..core.logging import log_ai_request
from ..models.assessment import (
    Assessment,
    AssessmentAnswer,
    AssessmentAttempt,
    AssessmentQuestion,
)
from ..schemas.quiz import (
    QuizAnalysisResponse,
    QuizGenerateResponse,
    QuizQuestionDraft,
    QuizQuestionsDraft,
    QuizSubtopicPerformance,
)
from ..utils.enums import AttemptStatus, Difficulty, QuestionType

_VALID_DIFFICULTIES = {"easy": "Easy", "medium": "Medium", "hard": "Hard"}
_MAX_REGENERATION_ROUNDS = 2  # after the initial generation call


def _parse_llm_json(content: str) -> Any:
    """Robustly extract a JSON object from LLM output (fences/prose tolerated)."""
    text = content.strip()
    # strip markdown fences
    if text.startswith("```"):
        first_newline = text.find("\n")
        if first_newline != -1:
            text = text[first_newline + 1 :]
        if text.endswith("```"):
            text = text[:-3].rstrip()
    # fall back to first { ... } span
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]
    return json.loads(text)


class QuizService:
    """AI quiz generator.

    Pipeline: request validation → registry prompt → LLM → pydantic shape check
    → deterministic quality validation → regenerate ONLY invalid questions
    (bounded) → persist as an Assessment row with questions → response.
    """

    def __init__(self, db: Session, client: Optional[LLMClientProtocol] = None):
        self.db = db
        self.client = client or get_llm_client()

    # ------------------------------------------------------------------
    # validation helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_topic(topic: str) -> str:
        topic = (topic or "").strip()
        if len(topic) < 2:
            raise ValidationError("Please enter a topic (at least 2 characters)")
        if len(topic) > 120:
            raise ValidationError("Topic is too long (max 120 characters)")
        return topic

    @staticmethod
    def _normalize_difficulty(difficulty: Optional[str]) -> str:
        key = (difficulty or "Medium").strip().lower()
        if key not in _VALID_DIFFICULTIES:
            raise ValidationError("difficulty must be Easy, Medium or Hard")
        return _VALID_DIFFICULTIES[key]

    @staticmethod
    def _validate_question(q: QuizQuestionDraft, index: int) -> List[str]:
        """Deterministic quality checks. Returns a list of human-readable problems."""
        problems: List[str] = []

        text = (q.question or "").strip()
        if len(text) < 8:
            problems.append(f"Q{index}: question text is empty or too short")

        options = [str(o).strip() for o in (q.options or [])]
        if len(options) != 4:
            problems.append(f"Q{index}: expected exactly 4 options, got {len(options)}")
        else:
            if any(not o for o in options):
                problems.append(f"Q{index}: one or more options are empty")
            lowered = [o.lower() for o in options]
            if len(set(lowered)) != 4:
                problems.append(f"Q{index}: options are not unique")

        if q.correct_index is None or not (0 <= int(q.correct_index) <= 3):
            problems.append(f"Q{index}: correct_index must be 0..3")
        if len((q.explanation or "").strip()) < 10:
            problems.append(f"Q{index}: explanation is missing or too short")
        if (q.subtopic or "").strip() == "":
            problems.append(f"Q{index}: subtopic tag is missing")

        difficulty_key = (q.difficulty or "").strip().lower()
        if difficulty_key not in _VALID_DIFFICULTIES:
            problems.append(f"Q{index}: difficulty must be Easy, Medium or Hard")
        return problems

    def _is_duplicate(self, candidate: str, accepted: List[str]) -> bool:
        cand = candidate.strip().lower()
        for existing in accepted:
            if difflib.SequenceMatcher(None, cand, existing.strip().lower()).ratio() > 0.92:
                return True
        return False

    # ------------------------------------------------------------------
    # LLM orchestration
    # ------------------------------------------------------------------

    def _request_questions(
        self,
        topic: str,
        difficulty: str,
        count: int,
        focus_subtopics: Optional[List[str]],
        accepted_questions: List[str],
    ) -> str:
        bootstrap_prompts()
        template = prompt_registry.get("quiz_generator", "v1")
        focus_text = (
            ", ".join([s.strip() for s in focus_subtopics if s.strip()])
            if focus_subtopics
            else "None — spread across the topic"
        )
        existing_text = "\n".join(accepted_questions) or "None"
        context = {
            "topic": topic,
            "difficulty": difficulty,
            "question_count": str(count),
            "focus_subtopics": focus_text,
            "existing_questions": existing_text,
        }
        ok, errors = template.validate_context(context)
        if not ok:
            raise ValidationError(f"Prompt context invalid: {'; '.join(errors)}")

        system_prompt = template.render_system(context)
        user_prompt = template.render_user(context) or ""

        start = time.perf_counter()
        response = self.client.chat(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=template.model or None,
            temperature=template.temperature,
            max_tokens=template.max_tokens,
        )
        latency_ms = int((time.perf_counter() - start) * 1000)
        log_ai_request(
            "quiz_generate",
            prompt_name=template.name,
            prompt_version=template.version,
            model=response.model,
            latency_ms=latency_ms,
            tokens_used=response.tokens_used,
            success=True,
        )
        return response.content or ""

    def _parse_round(self, content: str) -> Tuple[List[QuizQuestionDraft], List[str]]:
        """Parse + validate one LLM batch. Returns (valid questions, problems)."""
        from pydantic import ValidationError as PydanticValidationError

        try:
            parsed = _parse_llm_json(content)
        except (json.JSONDecodeError, ValueError):
            return [], ["malformed JSON structure"]

        if not isinstance(parsed, dict) or not isinstance(parsed.get("questions"), list):
            return [], ["missing questions array"]

        valid: List[QuizQuestionDraft] = []
        problems: List[str] = []
        for i, raw_q in enumerate(parsed["questions"]):
            if not isinstance(raw_q, dict):
                problems.append(f"Q{i}: not an object")
                continue
            try:
                q = QuizQuestionDraft.model_validate(raw_q)
            except PydanticValidationError:
                problems.append(f"Q{i}: missing required fields")
                continue
            q_problems = self._validate_question(q, i)
            if q_problems:
                problems.extend(q_problems)
            else:
                valid.append(q)
        return valid, problems

    # ------------------------------------------------------------------
    # generation
    # ------------------------------------------------------------------

    def generate(
        self,
        user_id: str,
        topic: str,
        difficulty: Optional[str],
        question_count: int,
        focus_subtopics: Optional[List[str]] = None,
    ) -> QuizGenerateResponse:
        topic = self._normalize_topic(topic)
        difficulty = self._normalize_difficulty(difficulty)

        if not isinstance(question_count, int) or not (3 <= question_count <= 10):
            raise ValidationError("question_count must be between 3 and 10")

        # Fail fast with a clear message when no real AI provider is configured
        # (the stub client cannot produce JSON questions — the old generic
        # "could not produce valid questions" message was misleading here).
        if isinstance(self.client, StubLLMClient):
            raise AIError(
                "AI provider is not configured. Set GROQ_API_KEY to generate quizzes.",
                retryable=False,
            )

        accepted: List[QuizQuestionDraft] = []
        accepted_texts: List[str] = []
        needed = question_count
        all_problems: List[str] = []

        # Initial generation call
        content = self._request_questions(topic, difficulty, needed, focus_subtopics, [])
        valid, problems = self._parse_round(content)
        all_problems.extend(problems)
        for q in valid:
            if not self._is_duplicate(q.question, accepted_texts):
                accepted.append(q)
                accepted_texts.append(q.question)

        # Regenerate ONLY the missing questions (bounded rounds).
        round_num = 0
        while len(accepted) < needed and round_num < _MAX_REGENERATION_ROUNDS:
            round_num += 1
            missing = needed - len(accepted)
            try:
                content = self._request_questions(
                    topic, difficulty, missing, focus_subtopics, accepted_texts
                )
                valid, problems = self._parse_round(content)
                all_problems.extend(problems)
            except Exception:
                break  # do not hammer the LLM; keep what we have
            added = 0
            for q in valid:
                if not self._is_duplicate(q.question, accepted_texts):
                    accepted.append(q)
                    accepted_texts.append(q.question)
                    added += 1
            if added == 0:
                break

        if not accepted:
            # Log what the model actually produced so failures are debuggable.
            if all_problems:
                log_ai_request(
                    "quiz_generate_validation",
                    prompt_name="quiz_generator",
                    prompt_version="v1",
                    success=False,
                    error="; ".join(all_problems[:20]),
                )
            raise AIValidationError(
                "The AI could not produce valid quiz questions. Please try a more specific topic or retry."
            )

        final = accepted[:question_count]
        try:
            assessment = self._persist(topic, difficulty, final, focus_subtopics)
        except Exception as exc:  # pragma: no cover - defensive
            raise AIError(f"Failed to save the generated quiz: {exc}")
        return QuizGenerateResponse(
            assessment_id=assessment.id,
            title=f"{topic} Quiz · {difficulty}",
            topic=topic,
            difficulty=difficulty,
            question_count=len(final),
        )

    def _persist(
        self,
        topic: str,
        difficulty: str,
        questions: List[QuizQuestionDraft],
        focus_subtopics: Optional[List[str]],
    ) -> Assessment:
        subtopic_tags: List[str] = []
        for q in questions:
            tag = (q.subtopic or "").strip() or "General"
            if tag not in subtopic_tags:
                subtopic_tags.append(tag)

        assessment = Assessment(
            title=f"{topic} Quiz · {difficulty}",
            category=topic,
            description=(
                f"AI-generated {difficulty.lower()} quiz on {topic}."
                + (" Focused on: " + ", ".join(subtopic_tags) + "." if focus_subtopics else "")
            ),
            difficulty=difficulty,
            total_questions=len(questions),
            time_limit_minutes=min(40, max(5, len(questions) * 2)),
            skills=subtopic_tags,
            is_active=True,
        )
        self.db.add(assessment)
        self.db.flush()  # assign assessment.id

        for i, q in enumerate(questions):
            options = [str(o).strip() for o in (q.options or [])]
            q_text = (q.question or "").strip()
            tag = (q.subtopic or "").strip() or "General"
            self.db.add(
                AssessmentQuestion(
                    assessment_id=assessment.id,
                    question_type=QuestionType.MCQ.value,
                    question_text=q_text,
                    options=options,
                    correct_option_index=int(q.correct_index),
                    correct_answer=options[int(q.correct_index)] if options else None,
                    explanation=(q.explanation or "").strip(),
                    display_order=i,
                    points=1,
                    difficulty=(q.difficulty or difficulty).strip(),
                    skill_tag=tag,
                )
            )
        self.db.commit()
        self.db.refresh(assessment)
        return assessment

    # ------------------------------------------------------------------
    # weak-topic analysis (deterministic, no LLM)
    # ------------------------------------------------------------------

    def analyze_attempt(self, attempt_id: str, user_id: str) -> QuizAnalysisResponse:
        attempt = (
            self.db.query(AssessmentAttempt)
            .filter(AssessmentAttempt.id == attempt_id)
            .first()
        )
        if not attempt:
            raise NotFoundError("Attempt")
        if str(attempt.user_id) != str(user_id):
            raise AuthorizationError()
        if attempt.status != AttemptStatus.COMPLETED.value:
            raise ValidationError("Attempt is not completed yet")

        answers = (
            self.db.query(AssessmentAnswer)
            .filter(AssessmentAnswer.attempt_id == attempt_id)
            .all()
        )
        questions = (
            self.db.query(AssessmentQuestion)
            .filter(AssessmentQuestion.assessment_id == attempt.assessment_id)
            .all()
        )
        q_by_id = {q.id: q for q in questions}

        # subtopic -> [answered(bool), correct(bool)]
        per_subtopic: Dict[str, Dict[str, int]] = {}
        answered_count = 0
        correct_count = 0
        for answer in answers:
            q = q_by_id.get(answer.question_id)
            if q is None or answer.is_correct is None:
                continue
            tag = (q.skill_tag or "General").strip()
            bucket = per_subtopic.setdefault(tag, {"total": 0, "correct": 0})
            bucket["total"] += 1
            answered_count += 1
            if answer.is_correct:
                bucket["correct"] += 1
                correct_count += 1

        total_questions = len(questions) or attempt.total_questions or answered_count
        score = round((correct_count / total_questions * 100), 2) if total_questions else 0.0

        subtopic_rows: List[QuizSubtopicPerformance] = []
        strong: List[str] = []
        weak: List[str] = []
        for tag, stats in per_subtopic.items():
            percent = round(stats["correct"] / stats["total"] * 100) if stats["total"] else 0
            status = "strong" if percent >= 70 else "needs_practice"
            subtopic_rows.append(
                QuizSubtopicPerformance(
                    subtopic=tag,
                    total=stats["total"],
                    correct=stats["correct"],
                    percent=percent,
                    status=status,
                )
            )
            if status == "strong":
                strong.append(tag)
            else:
                weak.append(tag)
        subtopic_rows.sort(key=lambda r: (r.percent, -r.total))

        return QuizAnalysisResponse(
            assessment_id=attempt.assessment_id,
            attempt_id=attempt_id,
            score=score,
            correct_count=correct_count,
            total_questions=total_questions,
            unanswered=max(0, total_questions - answered_count),
            per_subtopic=subtopic_rows,
            strong_subtopics=sorted(strong),
            weak_subtopics=sorted(weak),
        )
