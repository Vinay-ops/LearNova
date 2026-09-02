from typing import List, Optional
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
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

    LOG_LEVEL: str = "INFO"

    OPENAI_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gpt-4o"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: Optional[int] = None

    # OpenRouter configuration
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_MODEL: str = "openai/gpt-4o"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_APP_NAME: str = "Learnova"
    OPENROUTER_SITE_URL: Optional[str] = None

    ENVIRONMENT: str = "development"

    @property
    def frontend_origins(self) -> List[str]:
        raw = self.FRONTEND_URL or ""
        origins = [o.strip() for o in raw.split(",") if o.strip()]
        if self.ENVIRONMENT == "development" and not origins:
            origins = ["http://localhost:5173", "http://localhost:3000"]
        return origins


settings = Settings()
