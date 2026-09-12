from __future__ import annotations

from typing import Any, Optional

from .base import prompt_registry
from .versions.interviewer_v1 import register_interviewer_v1
from .versions.evaluator_v1 import register_evaluator_v1
from .versions.case_generation_v1 import register_case_generation_v1

from .base import PromptTemplate, prompt_registry as _prompt_registry


def bootstrap_prompts() -> None:
    try:
        _prompt_registry.get("interviewer", "v1")
    except KeyError:
        from .versions.interviewer_v1 import register_interviewer_v1
        from .versions.evaluator_v1 import register_evaluator_v1
        from .versions.case_generation_v1 import register_case_generation_v1
        from .versions.learning_tutor_v1 import register_learning_tutor_v1
        from .versions.quiz_generator_v1 import register_quiz_generator_v1
        from .versions.interview_evaluator_v1 import register_interview_evaluator_v1
        from .versions.resume_parser_v1 import register_resume_parser_v1
        from .versions.role_interviewer_v1 import register_role_interviewer_v1

        register_interviewer_v1(_prompt_registry)
        register_evaluator_v1(_prompt_registry)
        register_case_generation_v1(_prompt_registry)
        register_learning_tutor_v1(_prompt_registry)
        register_quiz_generator_v1(_prompt_registry)
        register_interview_evaluator_v1(_prompt_registry)
        register_resume_parser_v1(_prompt_registry)
        register_role_interviewer_v1(_prompt_registry)

        try:
            from .versions import register_feedback_v1, register_recommendations_v1
            register_feedback_v1(_prompt_registry)
            register_recommendations_v1(_prompt_registry)
        except Exception:
            pass


__all__ = ["bootstrap_prompts", "prompt_registry", "PromptTemplate"]
