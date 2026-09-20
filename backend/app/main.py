from contextlib import asynccontextmanager
from typing import Any
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
from starlette.middleware.base import BaseHTTPMiddleware
import traceback

from .core.config import settings
from .core.logging import LOG_LEVEL, setup_logging, log_api_error, get_logger
from .core.security_headers import SecurityHeadersMiddleware
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

# Requests larger than this are rejected before they reach a route. The resume
# upload caps files at 2 MB, so this leaves headroom for multipart framing while
# still refusing a trivially large body that would otherwise be buffered and
# parsed. (Without this, Starlette buffers the whole body into memory.)
MAX_REQUEST_BYTES = 4 * 1024 * 1024


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject oversized request bodies early (413) instead of buffering them."""

    async def dispatch(self, request: Request, call_next):
        raw_length = request.headers.get("content-length")
        if raw_length:
            try:
                if int(raw_length) > MAX_REQUEST_BYTES:
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={
                            "detail": "Request body is too large.",
                            "code": "request_too_large",
                        },
                    )
            except ValueError:
                # A non-numeric Content-Length is malformed; let the server's
                # own parsing reject it rather than guessing here.
                pass
        return await call_next(request)


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)

# CORS is explicit-origins only. A wildcard is never used because this API
# accepts `Authorization` headers and must never become readable by an arbitrary
# origin. Settings.frontend_origins strips "*" defensively.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Accept-Language"],
    max_age=600,
)


@app.get("/api/health", tags=["health"])
def health(request: Request):
    """Health check and DB probe.

    Full infrastructure diagnostics (DB host/port, driver error text, config
    warnings) are sensitive internal details. They are returned only in
    non-production, or to a caller presenting ``X-Health-Token`` matching
    ``HEALTH_DETAIL_TOKEN``. Everything else gets a minimal, non-revealing
    probe so an unauthenticated caller cannot fingerprint the deployment.
    """
    _token = settings.HEALTH_DETAIL_TOKEN
    verbose = (not settings.is_production) or bool(
        _token and request.headers.get("x-health-token") == _token
    )
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
                missing_columns = conn.execute(
                    text(
                        "SELECT column_name FROM information_schema.columns "
                        "WHERE table_schema = 'public' AND table_name = 'users' "
                        "AND column_name IN ("
                        "'terms_accepted', 'terms_version', 'terms_accepted_at', "
                        "'privacy_policy_accepted', 'privacy_policy_version', "
                        "'privacy_policy_accepted_at')"
                    )
                ).scalars().all()
                expected_columns = {
                    "terms_accepted",
                    "terms_version",
                    "terms_accepted_at",
                    "privacy_policy_accepted",
                    "privacy_policy_version",
                    "privacy_policy_accepted_at",
                }
                missing_columns = sorted(expected_columns - set(missing_columns))
                db_probe = {
                    "status": "error" if missing_columns else "ok",
                    "category": "schema_drift" if missing_columns else None,
                    "missing_columns": missing_columns,
                    "hints": [
                        "Run `python -m alembic upgrade head` against the deployed database."
                    ]
                    if missing_columns
                    else [],
                }
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

    if not verbose:
        # Public probe: alive, plus whether the database answered. No host,
        # port, driver message or configuration warning is disclosed.
        return {
            "status": overall,
            "version": "0.2.0",
            "database": {"probe": {"status": db_probe.get("status", "skipped")}},
        }

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


def scrub_validation_errors(errors: Any) -> list[dict[str, Any]]:
    """Strip submitted values out of Pydantic/FastAPI validation errors.

    Pydantic v2 includes an ``input`` key holding the value that failed, and a
    ``ctx`` key that can hold the raised exception. Echoing those back to the
    client — and into the logs — leaks the request body. For ``/api/auth/signup``
    that means the user's **plaintext password** would be returned in the 422
    response and written to the application log whenever the password policy or
    the consent checkbox rejected the request. Only the field location, the
    machine-readable error type and the human message are safe to surface.
    """
    scrubbed: list[dict[str, Any]] = []
    for error in errors or []:
        if not isinstance(error, dict):
            continue
        scrubbed.append(
            {
                "loc": error.get("loc"),
                "type": error.get("type"),
                "msg": error.get("msg"),
            }
        )
    return scrubbed


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    safe_errors = scrub_validation_errors(exc.errors())
    log_api_error(
        request.method, request.url.path, 422,
        error_detail=safe_errors,
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": safe_errors, "code": "validation_error"},
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
            "errors": scrub_validation_errors(exc.errors()),
            "traceback": traceback.format_exc(limit=10),
        },
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Response schema validation failed",
            "code": "response_validation_error",
            "errors": (
                scrub_validation_errors(exc.errors())
                if not settings.is_production
                else None
            ),
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
    # Production responses never carry the exception message, its class name or
    # a traceback. The detail is in the structured server log instead.
    if settings.is_production:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Something went wrong. Please try again.",
                "code": "internal_error",
            },
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": str(exc),
            "code": "internal_error",
            "error_type": type(exc).__name__,
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
