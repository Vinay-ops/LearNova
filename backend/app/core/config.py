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

    @property
    def frontend_origins(self) -> List[str]:
        raw = self.FRONTEND_URL or ""
        origins = [o.strip() for o in raw.split(",") if o.strip()]
        if self.ENVIRONMENT == "development" and not origins:
            origins = ["http://localhost:5173", "http://localhost:3000"]
        return origins


settings = Settings()
