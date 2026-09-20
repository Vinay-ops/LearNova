"""add resumes and readiness_snapshots tables

Revision ID: 0003_resumes_readiness
Revises: 0002_remaining_tables
Create Date: 2026-09-04 09:00:00.000000

NOTE: the revision id MUST stay within 32 characters — Alembic stores it in
``alembic_version.version_num``, which it creates as VARCHAR(32). SQLite ignores
that length so an over-long id passes locally, but PostgreSQL rejects the insert
with "value too long for type character varying(32)" and the upgrade fails.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0003_resumes_readiness"
down_revision: Union[str, None] = "0002_remaining_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "resumes",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("source_type", sa.String(), nullable=True),
        sa.Column("role", sa.String(), nullable=True),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_resumes_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_resumes")),
    )
    op.create_index(op.f("ix_resumes_id"), "resumes", ["id"], unique=False)
    op.create_index(op.f("ix_resumes_user_id"), "resumes", ["user_id"], unique=False)

    op.create_table(
        "readiness_snapshots",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_readiness_snapshots_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_readiness_snapshots")),
    )
    op.create_index(op.f("ix_readiness_snapshots_id"), "readiness_snapshots", ["id"], unique=False)
    op.create_index(op.f("ix_readiness_snapshots_user_id"), "readiness_snapshots", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_readiness_snapshots_user_id"), table_name="readiness_snapshots")
    op.drop_index(op.f("ix_readiness_snapshots_id"), table_name="readiness_snapshots")
    op.drop_table("readiness_snapshots")
    op.drop_index(op.f("ix_resumes_user_id"), table_name="resumes")
    op.drop_index(op.f("ix_resumes_id"), table_name="resumes")
    op.drop_table("resumes")
