from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
import traceback

from .core.config import settings
from .core.logging import LOG_LEVEL, setup_logging, log_api_error, get_logger
from .ai import bootstrap_prompts
from .api import (
    auth_router,
    profiles_router,
    users_router,
    applications_router,
    progress_router,
    cases_router,
    assessments_router,
    drills_router,
    ai_router,
    prompts_router,
    learning_router,
    quizzes_router,
    resumes_router,
)

logger = get_logger("casepilot.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup logic AFTER the FastAPI app is constructed so any failure
    is caught by exception handlers (not a hard import-time crash).

    Vercel serverless functions re-import the module on every cold start.
    If startup code runs at module import (e.g. ``create_engine``,
    ``bootstrap_prompts`` touching the DB) and fails, FastAPI never even
    registers and you get ``FUNCTION_INVOCATION_FAILED`` with no logs.
    Running it here instead keeps the app alive and error responses sane.
    """
    try:
        setup_logging(LOG_LEVEL)
    except Exception as e:  # pragma: no cover - defensive
        print(f"[startup] setup_logging failed: {e!r}")

    try:
        bootstrap_prompts()
    except Exception as e:  # pragma: no cover - defensive
        # bootstrap_prompts only registers in-memory templates; failure here
        # means an import error in a prompt module. Log and continue; the
        # first real AI call will fail anyway with a clear error.
        try:
            logger.error(
                "bootstrap_prompts failed — proceeding with empty registry",
                extra={"error_type": type(e).__name__, "error_msg": str(e)},
            )
        except Exception:
            print(f"[startup] bootstrap_prompts failed: {e!r}")

    yield


app = FastAPI(
    title="Learnova API",
    version="0.2.0",
    lifespan=lifespan,
    description=(
        "Learnova — AI-powered consulting interview preparation platform. "
        "Architecture supports auth, profiles, cases, assessments, drills, "
        "applications, progress tracking, AI interviewer, evaluations, and "
        "prompt engineering experimentation."
    ),
)

_origins = settings.frontend_origins
if not _origins:
    _origins = ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", tags=["health"])
def health():
    """Health check that also reports DATABASE_URL diagnostics and a live DB
    connection probe. On Vercel this is the first URL to hit to debug env-var
    issues without needing a login attempt.
    """
    from urllib.parse import urlparse
    from .db.database import get_engine, _normalize_database_url
    from sqlalchemy import text
    from sqlalchemy.exc import SQLAlchemyError

    raw_url = settings.DATABASE_URL or ""
    try:
        norm = _normalize_database_url(raw_url)
    except Exception as e:
        norm = f"<normalize failed: {e!r}>"

    # Parse host:port without leaking password
    host = port = scheme = path = None
    try:
        parsed = urlparse(norm) if isinstance(norm, str) else None
        if parsed:
            scheme = parsed.scheme
            host = parsed.hostname
            port = parsed.port
            path = parsed.path
    except Exception:
        pass

    # Detect common config mistakes
    warnings = []
    if not raw_url:
        warnings.append("DATABASE_URL is EMPTY — backend env var not set")
    if scheme and "postgres" in scheme and host and host.endswith(".supabase.com"):
        if "pooler" not in host:
            warnings.append(
                "Using DIRECT Supabase host (db.<ref>.supabase.com). Vercel is IPv4-only "
                "and cannot reach the IPv6 direct host. Switch to Session Pooler host "
                "(aws-0-<region>.pooler.supabase.com)."
            )
    if scheme and "postgres" in scheme and port is not None and port != 6543 and host and "pooler" in str(host):
        warnings.append(
            f"Session Pooler port should be 6543, got {port}. Pooler does NOT "
            "listen on 5432 — that will timeout / refuse."
        )
    if scheme and "postgres" in scheme and raw_url and "sslmode=require" not in raw_url:
        warnings.append(
            "DATABASE_URL missing ?sslmode=require. Supabase pooler requires "
            "TLS; connection will be rejected otherwise."
        )
    if not settings.JWT_SECRET:
        warnings.append("JWT_SECRET is EMPTY — token creation will crash")

    # Actually try a one-off DB probe using engine.connect() so we know the
    # credentials + network work without relying on an endpoint that needs auth.
    db_probe = {"status": "skipped"}
    if raw_url and scheme and "sqlite" not in str(scheme):
        try:
            engine = get_engine()
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                db_probe = {"status": "ok"}
        except SQLAlchemyError as e:
            inner = getattr(e, "orig", None)
            inner_msg = str(inner) if inner is not None else str(e)
            # Classify the error so operators can act immediately
            category = "database_error"
            if "password authentication" in inner_msg.lower():
                category = "bad_password"
                hints = [
                    "Supabase DB password may have been reset recently. "
                    "Go to Supabase → Database → Reset database password, then "
                    "paste the NEW password (URL-encoded if special chars) "
                    "into Vercel Backend DATABASE_URL."
                ]
            elif "timeout" in inner_msg.lower() or "refused" in inner_msg.lower() or "cannot assign" in inner_msg.lower():
                category = "network"
                hints = [
                    "Ensure pooler host is used (aws-0-REGION.pooler.supabase.com)",
                    "Ensure port is 6543 (NOT 5432) for pooler",
                    "Ensure ?sslmode=require is appended",
                ]
            elif "ssl" in inner_msg.lower() or "tls" in inner_msg.lower():
                category = "ssl"
                hints = ["Append ?sslmode=require to DATABASE_URL"]
            else:
                hints = []
            db_probe = {
                "status": "error",
                "category": category,
                "error_type": type(e).__name__,
                "driver_error_type": type(inner).__name__ if inner is not None else None,
                "message": inner_msg,
                "hints": hints,
            }
        except Exception as e:
            db_probe = {
                "status": "error",
                "category": "unknown",
                "error_type": type(e).__name__,
                "message": str(e),
            }

    overall = "ok"
    if warnings or db_probe.get("status") == "error":
        overall = "degraded"

    payload = {
        "status": overall,
        "version": "0.2.0",
        "phase": "Phase 5 (Cases, Assessments, Drills) implemented",
        "modules": {
            "auth": "Phase 1 - Complete",
            "profiles": "Phase 1 - Complete",
            "applications": "Phase 2 - Complete",
            "progress": "Phase 2 - Complete",
            "cases": "Phase 3 - API ready",
            "assessments": "Phase 4 - API ready",
            "drills": "Phase 5 - API ready",
            "ai_interview": "Phase 6-7 - Sessions, adaptive chat, evaluation, feedback, recommendations",
            "evaluations": "Phase 8 - Wired via evaluator prompt + server-side persistence",
            "recommendations": "Phase 9 - Wired (deterministic + LLM enrichment)",
            "prompts": "Phase 6 - Prompt registry exposed",
        },
        "env": {
            "environment": settings.ENVIRONMENT,
            "jwt_secret_set": bool(settings.JWT_SECRET),
            "groq_api_key_set": bool(settings.GROQ_API_KEY),
            "frontend_url": settings.FRONTEND_URL,
        },
        "database": {
            "scheme": scheme,
            "host": host,
            "port": port,
            "path": path,
            "uses_pooler": "pooler" in str(host) if host else False,
            "has_sslmode_require": "sslmode=require" in raw_url,
            "warnings": warnings,
            "probe": db_probe,
        },
    }
    return payload


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    log_api_error(
        request.method, request.url.path, 422,
        error_detail=exc.errors(),
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "code": "validation_error"},
    )


@app.exception_handler(PydanticValidationError)
async def response_validation_exception_handler(
    request: Request, exc: PydanticValidationError
) -> JSONResponse:
    logger.error(
        "response validation failed",
        extra={
            "method": request.method,
            "path": request.url.path,
            "errors": exc.errors(),
            "traceback": traceback.format_exc(limit=10),
        },
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Response schema validation failed",
            "code": "response_validation_error",
            "errors": exc.errors() if settings.ENVIRONMENT == "development" else None,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    tb_str = traceback.format_exc(limit=15)
    logger.error(
        "unhandled exception",
        extra={
            "method": request.method,
            "path": request.url.path,
            "error_type": type(exc).__name__,
            "error_msg": str(exc),
            "traceback": tb_str,
        },
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": (
                str(exc)
                if settings.ENVIRONMENT == "development"
                else "Internal server error"
            ),
            "code": "internal_error",
            "error_type": type(exc).__name__ if settings.ENVIRONMENT == "development" else None,
        },
    )


app.include_router(auth_router)
app.include_router(profiles_router)
app.include_router(users_router)
app.include_router(applications_router)
app.include_router(progress_router)
app.include_router(cases_router)
app.include_router(assessments_router)
app.include_router(drills_router)
app.include_router(ai_router)
app.include_router(prompts_router)
app.include_router(learning_router)
app.include_router(quizzes_router)
app.include_router(resumes_router)
