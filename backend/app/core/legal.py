"""Legal document versions and consent rules.

The published Terms & Conditions and Privacy Policy each carry an explicit
version identifier. Consent is recorded against the version that was actually
shown, because a bare ``terms_accepted = true`` cannot answer the only question
that matters in a dispute: *which* terms did this person agree to?

Version format is ``YYYY-MM-DD`` (the revision's publication date). It must be
changed **only** when the published document changes materially: every user
whose recorded version differs from the current one is re-prompted to accept,
so bumping a version unnecessarily creates friction for real users.

See ``docs/LEGAL_REVIEW_REQUIRED.md`` — the shipping legal text is a structured
placeholder and has NOT been reviewed by counsel.
"""

# Bump when the published Terms & Conditions revision changes.
TERMS_VERSION = "2026-09-20"
# Bump when the published Privacy Policy revision changes.
PRIVACY_VERSION = "2026-09-20"

# Where the published documents live. Used for server-side logging/audit trails
# and to let a client render the right link; the frontend uses its own
# VITE_TERMS_URL / VITE_PRIVACY_URL so the production domain is configurable
# rather than hardcoded throughout the codebase.
TERMS_PATH = "/terms"
PRIVACY_PATH = "/privacy"


def requires_terms_acceptance(terms_version: str | None) -> bool:
    """True when this user has not accepted the CURRENT terms revision."""
    return (terms_version or "") != TERMS_VERSION


def requires_privacy_acceptance(privacy_version: str | None) -> bool:
    """True when this user has not accepted the CURRENT privacy revision."""
    return (privacy_version or "") != PRIVACY_VERSION


def consent_requires_action(
    terms_version: str | None, privacy_version: str | None
) -> bool:
    return requires_terms_acceptance(terms_version) or requires_privacy_acceptance(
        privacy_version
    )
