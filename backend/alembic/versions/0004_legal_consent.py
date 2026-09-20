"""add legal consent columns to users

Revision ID: 0004_legal_consent
Revises: 0003_resumes_readiness
Create Date: 2026-09-20 09:00:00.000000

Stores Terms & Conditions / Privacy Policy consent as an explicit VERSION plus
a server-side acceptance timestamp, rather than a bare boolean. A boolean alone
cannot establish which revision of a document a user actually agreed to.

EXISTING ROWS: the new boolean columns default to FALSE and the version columns
are NULL, so pre-existing accounts are deliberately NOT grandfathered into the
current terms. They are prompted to accept the current revision on their next
visit (see app/core/legal.py and the /api/auth/accept-terms endpoint). Marking
them accepted here would fabricate consent that was never given.

NOTE: revision ids must stay within 32 characters — Alembic stores them in
``alembic_version.version_num``, which is VARCHAR(32).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0004_legal_consent"
down_revision: Union[str, None] = "0003_resumes_readiness"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_CONSENT_COLUMNS = (
    sa.Column(
        "terms_accepted",
        sa.Boolean(),
        nullable=False,
        server_default=sa.false(),
    ),
    sa.Column("terms_version", sa.String(length=32), nullable=True),
    sa.Column("terms_accepted_at", sa.DateTime(timezone=True), nullable=True),
    sa.Column(
        "privacy_policy_accepted",
        sa.Boolean(),
        nullable=False,
        server_default=sa.false(),
    ),
    sa.Column("privacy_policy_version", sa.String(length=32), nullable=True),
    sa.Column("privacy_policy_accepted_at", sa.DateTime(timezone=True), nullable=True),
)


def upgrade() -> None:
    for column in _CONSENT_COLUMNS:
        op.add_column("users", column)


def downgrade() -> None:
    for column in reversed(_CONSENT_COLUMNS):
        op.drop_column("users", column.name)
