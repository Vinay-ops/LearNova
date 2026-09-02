"""add remaining tables for Phase 2-10

Revision ID: 0002_remaining_tables
Revises: 0001_initial
Create Date: 2026-09-02 07:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0002_remaining_tables"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("color", sa.String(), nullable=True),
        sa.Column("weight", sa.Float(), nullable=False, server_default=sa.text("1.0")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_skills")),
        sa.UniqueConstraint("name", name=op.f("uq_skills_name")),
    )
    op.create_index(op.f("ix_skills_id"), "skills", ["id"], unique=False)
    op.create_index(op.f("ix_skills_name"), "skills", ["name"], unique=True)

    op.create_table(
        "user_skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("current_score", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("previous_score", sa.Integer(), nullable=True),
        sa.Column("trend", sa.String(), nullable=False, server_default=sa.text("'flat'")),
        sa.Column("total_practice_minutes", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("last_practiced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], name=op.f("fk_user_skills_skill_id_skills"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_skills_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_user_skills")),
    )
    op.create_index(op.f("ix_user_skills_id"), "user_skills", ["id"], unique=False)
    op.create_index(op.f("ix_user_skills_user_id"), "user_skills", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_skills_skill_id"), "user_skills", ["skill_id"], unique=False)

    op.create_table(
        "cases",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("company", sa.String(), nullable=False),
        sa.Column("case_type", sa.String(), nullable=False, server_default=sa.text("'Profitability'")),
        sa.Column("difficulty", sa.String(), nullable=False, server_default=sa.text("'Medium'")),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default=sa.text("25")),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("prompt", sa.Text(), nullable=True),
        sa.Column("background", sa.Text(), nullable=True),
        sa.Column("skills", postgresql.ARRAY(sa.String()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_ai_generated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("generated_by_prompt_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["generated_by_prompt_id"], ["prompts.id"], name=op.f("fk_cases_generated_by_prompt_id_prompts"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_cases")),
    )
    op.create_index(op.f("ix_cases_id"), "cases", ["id"], unique=False)
    op.create_index(op.f("ix_cases_generated_by_prompt_id"), "cases", ["generated_by_prompt_id"], unique=False)

    op.create_table(
        "case_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_type", sa.String(), nullable=False, server_default=sa.text("'structuring'")),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("model_answer", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("time_limit_seconds", sa.Integer(), nullable=True),
        sa.Column("rubric", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], name=op.f("fk_case_questions_case_id_cases"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_case_questions")),
    )
    op.create_index(op.f("ix_case_questions_id"), "case_questions", ["id"], unique=False)
    op.create_index(op.f("ix_case_questions_case_id"), "case_questions", ["case_id"], unique=False)

    op.create_table(
        "case_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("case_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'in_progress'")),
        sa.Column("current_question_index", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("elapsed_seconds", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("overall_score", sa.Integer(), nullable=True),
        sa.Column("structuring_score", sa.Integer(), nullable=True),
        sa.Column("quantitative_score", sa.Integer(), nullable=True),
        sa.Column("business_judgment_score", sa.Integer(), nullable=True),
        sa.Column("communication_score", sa.Integer(), nullable=True),
        sa.Column("synthesis_score", sa.Integer(), nullable=True),
        sa.Column("ai_feedback", sa.Text(), nullable=True),
        sa.Column("strengths", postgresql.ARRAY(sa.String()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("weaknesses", postgresql.ARRAY(sa.String()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("recommendations", sa.Text(), nullable=True),
        sa.Column("evaluated_by_prompt_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], name=op.f("fk_case_attempts_case_id_cases"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["evaluated_by_prompt_id"], ["prompts.id"], name=op.f("fk_case_attempts_evaluated_by_prompt_id_prompts"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_case_attempts_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_case_attempts")),
    )
    op.create_index(op.f("ix_case_attempts_id"), "case_attempts", ["id"], unique=False)
    op.create_index(op.f("ix_case_attempts_user_id"), "case_attempts", ["user_id"], unique=False)
    op.create_index(op.f("ix_case_attempts_case_id"), "case_attempts", ["case_id"], unique=False)
    op.create_index(op.f("ix_case_attempts_evaluated_by_prompt_id"), "case_attempts", ["evaluated_by_prompt_id"], unique=False)

    op.create_table(
        "case_answers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("attempt_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("answer_text", sa.Text(), nullable=True),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("ai_feedback", sa.Text(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["attempt_id"], ["case_attempts.id"], name=op.f("fk_case_answers_attempt_id_case_attempts"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["question_id"], ["case_questions.id"], name=op.f("fk_case_answers_question_id_case_questions"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_case_answers")),
    )
    op.create_index(op.f("ix_case_answers_id"), "case_answers", ["id"], unique=False)
    op.create_index(op.f("ix_case_answers_attempt_id"), "case_answers", ["attempt_id"], unique=False)
    op.create_index(op.f("ix_case_answers_question_id"), "case_answers", ["question_id"], unique=False)

    op.create_table(
        "assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("category", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("difficulty", sa.String(), nullable=False, server_default=sa.text("'Medium'")),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("time_limit_minutes", sa.Integer(), nullable=False, server_default=sa.text("25")),
        sa.Column("skills", postgresql.ARRAY(sa.String()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assessments")),
    )
    op.create_index(op.f("ix_assessments_id"), "assessments", ["id"], unique=False)

    op.create_table(
        "assessment_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_type", sa.String(), nullable=False, server_default=sa.text("'mcq'")),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("options", postgresql.JSONB(), nullable=True),
        sa.Column("correct_option_index", sa.Integer(), nullable=True),
        sa.Column("correct_answer", sa.Text(), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("points", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("difficulty", sa.String(), nullable=False, server_default=sa.text("'Medium'")),
        sa.Column("skill_tag", sa.String(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["assessment_id"], ["assessments.id"], name=op.f("fk_assessment_questions_assessment_id_assessments"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assessment_questions")),
    )
    op.create_index(op.f("ix_assessment_questions_id"), "assessment_questions", ["id"], unique=False)
    op.create_index(op.f("ix_assessment_questions_assessment_id"), "assessment_questions", ["assessment_id"], unique=False)

    op.create_table(
        "assessment_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'in_progress'")),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("time_spent_seconds", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("percentile", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["assessment_id"], ["assessments.id"], name=op.f("fk_assessment_attempts_assessment_id_assessments"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_assessment_attempts_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assessment_attempts")),
    )
    op.create_index(op.f("ix_assessment_attempts_id"), "assessment_attempts", ["id"], unique=False)
    op.create_index(op.f("ix_assessment_attempts_user_id"), "assessment_attempts", ["user_id"], unique=False)
    op.create_index(op.f("ix_assessment_attempts_assessment_id"), "assessment_attempts", ["assessment_id"], unique=False)

    op.create_table(
        "assessment_answers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("attempt_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("selected_option_index", sa.Integer(), nullable=True),
        sa.Column("free_text_answer", sa.Text(), nullable=True),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.Column("points_earned", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("time_spent_seconds", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["attempt_id"], ["assessment_attempts.id"], name=op.f("fk_assessment_answers_attempt_id_assessment_attempts"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["question_id"], ["assessment_questions.id"], name=op.f("fk_assessment_answers_question_id_assessment_questions"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_assessment_answers")),
    )
    op.create_index(op.f("ix_assessment_answers_id"), "assessment_answers", ["id"], unique=False)
    op.create_index(op.f("ix_assessment_answers_attempt_id"), "assessment_answers", ["attempt_id"], unique=False)
    op.create_index(op.f("ix_assessment_answers_question_id"), "assessment_answers", ["question_id"], unique=False)

    op.create_table(
        "drills",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(), nullable=False, server_default=sa.text("'Structuring'")),
        sa.Column("difficulty", sa.String(), nullable=False, server_default=sa.text("'Medium'")),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default=sa.text("10")),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("skills", postgresql.ARRAY(sa.String()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_ai_generated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("generated_by_prompt_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["generated_by_prompt_id"], ["prompts.id"], name=op.f("fk_drills_generated_by_prompt_id_prompts"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_drills")),
    )
    op.create_index(op.f("ix_drills_id"), "drills", ["id"], unique=False)
    op.create_index(op.f("ix_drills_generated_by_prompt_id"), "drills", ["generated_by_prompt_id"], unique=False)

    op.create_table(
        "drill_questions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("drill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("question_type", sa.String(), nullable=False, server_default=sa.text("'mcq'")),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("options", postgresql.JSONB(), nullable=True),
        sa.Column("correct_option_index", sa.Integer(), nullable=True),
        sa.Column("correct_answer", sa.Text(), nullable=True),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("time_limit_seconds", sa.Integer(), nullable=True),
        sa.Column("difficulty", sa.String(), nullable=False, server_default=sa.text("'Medium'")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["drill_id"], ["drills.id"], name=op.f("fk_drill_questions_drill_id_drills"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_drill_questions")),
    )
    op.create_index(op.f("ix_drill_questions_id"), "drill_questions", ["id"], unique=False)
    op.create_index(op.f("ix_drill_questions_drill_id"), "drill_questions", ["drill_id"], unique=False)

    op.create_table(
        "drill_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("drill_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'completed'")),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_questions", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("correct_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("time_spent_seconds", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["drill_id"], ["drills.id"], name=op.f("fk_drill_attempts_drill_id_drills"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_drill_attempts_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_drill_attempts")),
    )
    op.create_index(op.f("ix_drill_attempts_id"), "drill_attempts", ["id"], unique=False)
    op.create_index(op.f("ix_drill_attempts_user_id"), "drill_attempts", ["user_id"], unique=False)
    op.create_index(op.f("ix_drill_attempts_drill_id"), "drill_attempts", ["drill_id"], unique=False)

    op.create_table(
        "applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("stage", sa.String(), nullable=False, server_default=sa.text("'Preparing'")),
        sa.Column("preparation", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_applications_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_applications")),
    )
    op.create_index(op.f("ix_applications_id"), "applications", ["id"], unique=False)
    op.create_index(op.f("ix_applications_user_id"), "applications", ["user_id"], unique=False)

    op.create_table(
        "prompts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("purpose", sa.String(), nullable=False, server_default=sa.text("'interviewer'")),
        sa.Column("version", sa.String(), nullable=False, server_default=sa.text("'v1'")),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("system_prompt", sa.Text(), nullable=False),
        sa.Column("user_prompt_template", sa.Text(), nullable=True),
        sa.Column("variables", postgresql.JSONB(), nullable=True, server_default=sa.text("'[]'")),
        sa.Column("output_schema", postgresql.JSONB(), nullable=True),
        sa.Column("model", sa.String(), nullable=False, server_default=sa.text("'gpt-4o'")),
        sa.Column("temperature", sa.Numeric(precision=3, scale=2), nullable=False, server_default=sa.text("0.7")),
        sa.Column("top_p", sa.Numeric(precision=3, scale=2), nullable=True),
        sa.Column("max_tokens", sa.Integer(), nullable=True),
        sa.Column("prompt_techniques", postgresql.JSONB(), nullable=True, server_default=sa.text("'[]'")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("parent_prompt_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("parent_version", sa.String(), nullable=True),
        sa.Column("changelog", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_prompts")),
    )
    op.create_index(op.f("ix_prompts_id"), "prompts", ["id"], unique=False)
    op.create_index(op.f("ix_prompts_name"), "prompts", ["name"], unique=False)

    op.create_table(
        "ai_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_type", sa.String(), nullable=False, server_default=sa.text("'case_interview'")),
        sa.Column("related_resource_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("related_resource_type", sa.String(), nullable=True),
        sa.Column("prompt_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("model_used", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'active'")),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_tokens", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("total_latency_ms", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("metadata_", postgresql.JSONB(), nullable=True, server_default=sa.text("'{}'")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            onupdate=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["prompt_id"], ["prompts.id"], name=op.f("fk_ai_sessions_prompt_id_prompts"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_ai_sessions_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_sessions")),
    )
    op.create_index(op.f("ix_ai_sessions_id"), "ai_sessions", ["id"], unique=False)
    op.create_index(op.f("ix_ai_sessions_user_id"), "ai_sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_ai_sessions_prompt_id"), "ai_sessions", ["prompt_id"], unique=False)

    op.create_table(
        "ai_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.String(), nullable=False, server_default=sa.text("'interviewer'")),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("structured_output", postgresql.JSONB(), nullable=True),
        sa.Column("tokens_used", sa.Integer(), nullable=True),
        sa.Column("latency_ms", sa.Integer(), nullable=True),
        sa.Column("sequence_number", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["session_id"], ["ai_sessions.id"], name=op.f("fk_ai_messages_session_id_ai_sessions"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ai_messages")),
    )
    op.create_index(op.f("ix_ai_messages_id"), "ai_messages", ["id"], unique=False)
    op.create_index(op.f("ix_ai_messages_session_id"), "ai_messages", ["session_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_ai_messages_session_id"), table_name="ai_messages")
    op.drop_index(op.f("ix_ai_messages_id"), table_name="ai_messages")
    op.drop_table("ai_messages")
    op.drop_index(op.f("ix_ai_sessions_prompt_id"), table_name="ai_sessions")
    op.drop_index(op.f("ix_ai_sessions_user_id"), table_name="ai_sessions")
    op.drop_index(op.f("ix_ai_sessions_id"), table_name="ai_sessions")
    op.drop_table("ai_sessions")
    op.drop_index(op.f("ix_prompts_name"), table_name="prompts")
    op.drop_index(op.f("ix_prompts_id"), table_name="prompts")
    op.drop_table("prompts")
    op.drop_index(op.f("ix_applications_user_id"), table_name="applications")
    op.drop_index(op.f("ix_applications_id"), table_name="applications")
    op.drop_table("applications")
    op.drop_index(op.f("ix_drill_attempts_drill_id"), table_name="drill_attempts")
    op.drop_index(op.f("ix_drill_attempts_user_id"), table_name="drill_attempts")
    op.drop_index(op.f("ix_drill_attempts_id"), table_name="drill_attempts")
    op.drop_table("drill_attempts")
    op.drop_index(op.f("ix_drill_questions_drill_id"), table_name="drill_questions")
    op.drop_index(op.f("ix_drill_questions_id"), table_name="drill_questions")
    op.drop_table("drill_questions")
    op.drop_index(op.f("ix_drills_generated_by_prompt_id"), table_name="drills")
    op.drop_index(op.f("ix_drills_id"), table_name="drills")
    op.drop_table("drills")
    op.drop_index(op.f("ix_assessment_answers_question_id"), table_name="assessment_answers")
    op.drop_index(op.f("ix_assessment_answers_attempt_id"), table_name="assessment_answers")
    op.drop_index(op.f("ix_assessment_answers_id"), table_name="assessment_answers")
    op.drop_table("assessment_answers")
    op.drop_index(op.f("ix_assessment_attempts_assessment_id"), table_name="assessment_attempts")
    op.drop_index(op.f("ix_assessment_attempts_user_id"), table_name="assessment_attempts")
    op.drop_index(op.f("ix_assessment_attempts_id"), table_name="assessment_attempts")
    op.drop_table("assessment_attempts")
    op.drop_index(op.f("ix_assessment_questions_assessment_id"), table_name="assessment_questions")
    op.drop_index(op.f("ix_assessment_questions_id"), table_name="assessment_questions")
    op.drop_table("assessment_questions")
    op.drop_index(op.f("ix_assessments_id"), table_name="assessments")
    op.drop_table("assessments")
    op.drop_index(op.f("ix_case_answers_question_id"), table_name="case_answers")
    op.drop_index(op.f("ix_case_answers_attempt_id"), table_name="case_answers")
    op.drop_index(op.f("ix_case_answers_id"), table_name="case_answers")
    op.drop_table("case_answers")
    op.drop_index(op.f("ix_case_attempts_evaluated_by_prompt_id"), table_name="case_attempts")
    op.drop_index(op.f("ix_case_attempts_case_id"), table_name="case_attempts")
    op.drop_index(op.f("ix_case_attempts_user_id"), table_name="case_attempts")
    op.drop_index(op.f("ix_case_attempts_id"), table_name="case_attempts")
    op.drop_table("case_attempts")
    op.drop_index(op.f("ix_case_questions_case_id"), table_name="case_questions")
    op.drop_index(op.f("ix_case_questions_id"), table_name="case_questions")
    op.drop_table("case_questions")
    op.drop_index(op.f("ix_cases_generated_by_prompt_id"), table_name="cases")
    op.drop_index(op.f("ix_cases_id"), table_name="cases")
    op.drop_table("cases")
    op.drop_index(op.f("ix_user_skills_skill_id"), table_name="user_skills")
    op.drop_index(op.f("ix_user_skills_user_id"), table_name="user_skills")
    op.drop_index(op.f("ix_user_skills_id"), table_name="user_skills")
    op.drop_table("user_skills")
    op.drop_index(op.f("ix_skills_name"), table_name="skills")
    op.drop_index(op.f("ix_skills_id"), table_name="skills")
    op.drop_table("skills")
