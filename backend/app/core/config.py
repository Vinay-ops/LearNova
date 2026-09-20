from typing import List, Optional
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration — secrets and genuinely per-environment values.

    Required env vars (see .env.example): DATABASE_URL, GROQ_API_KEY,
    JWT_SECRET, FRONTEND_URL, ENVIRONMENT (plus the frontend's VITE_API_URL).

    The Groq endpoint and model are deliberately NOT env-driven — they are code
    constants in ``app/ai/client.py`` (``GROQ_BASE_URL`` / ``GROQ_MODEL``)
    because they are neither secret nor environment-specific.
    """

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        case_sensitive=True,
        extra="ignore",
    )

    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    FRONTEND_URL: str = "http://localhost:5173"

    LLM_TEMPERATURE: float = 0.7

    # AI provider: Groq via its OpenAI-compatible endpoint. Only the key is
    # configured here; the base URL and model are constants in app/ai/client.py.
    GROQ_API_KEY: Optional[str] = None

    ENVIRONMENT: str = "development"

    # Explicit list of allowed browser origins for CORS. Preferred over
    # FRONTEND_URL in production; FRONTEND_URL is still honoured as a fallback
    # so existing deployments keep working. A wildcard is never permitted when
    # credentials are enabled (see frontend_origins).
    FRONTEND_ORIGINS: str = ""

    # Origins allowed to embed the app in a frame. Empty means embedding is
    # refused (X-Frame-Options: DENY / frame-ancestors 'none'), which is the
    # correct production default for clickjacking protection. Set this only for
    # deployments that must be embedded (e.g. a preview harness).
    EMBED_ALLOWED_ORIGINS: str = ""

    # Master switch for the in-process rate limiter. Enabled by default; the
    # test suite disables it so bulk account creation is not throttled.
    RATE_LIMIT_ENABLED: bool = True

    # When set, GET /api/health returns full infrastructure diagnostics to a
    # caller presenting this value in X-Health-Token. Without it, production
    # gets the minimal probe only.
    HEALTH_DETAIL_TOKEN: Optional[str] = None

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() in ("production", "prod")

    @staticmethod
    def _split(raw: str) -> List[str]:
        return [o.strip().rstrip("/") for o in (raw or "").split(",") if o.strip()]

    @property
    def frontend_origins(self) -> List[str]:
        """Allowed CORS origins.

        FRONTEND_ORIGINS wins when set; otherwise FRONTEND_URL.

        A ``*`` is stripped rather than honoured: this API sends
        ``Access-Control-Allow-Credentials: true``, and browsers reject a
        wildcard together with credentials. Silently accepting ``*`` would
        either break the app or, worse, invite someone to "fix" it by disabling
        credentials. Explicit origins only.
        """
        origins = self._split(self.FRONTEND_ORIGINS) or self._split(self.FRONTEND_URL)
        origins = [o for o in origins if o != "*"]
        if not origins and not self.is_production:
            origins = ["http://localhost:5173", "http://localhost:3000"]
        return origins

    @property
    def embed_allowed_origins(self) -> List[str]:
        return self._split(self.EMBED_ALLOWED_ORIGINS)


settings = Settings()
