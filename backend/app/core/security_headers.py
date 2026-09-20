"""HTTP security headers for API responses.

IMPORTANT SCOPE NOTE
--------------------
Headers set here apply to **API responses** (JSON). They cannot protect the
single-page app, because the browser only applies a document's CSP to the
document itself — and the SPA's HTML is served by the static host (Vercel),
not by FastAPI. The headers that actually protect the app are therefore also
declared in:

* ``vercel.json``  → ``headers`` (production, served by Vercel)
* ``vite.config.ts`` → a dev-server plugin (local parity with production)

This module covers the API surface: ``X-Content-Type-Options``,
``Referrer-Policy``, ``Permissions-Policy``, HSTS and the frame protections.

The ``Content-Security-Policy`` value here is intentionally restrictive
(``default-src 'none'``) because these are JSON payloads that should never load
or execute anything.
"""

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from .config import settings

# The voice interview uses the Web Speech API, so the microphone must be
# allowed for same-origin. Everything else is denied.
PERMISSIONS_POLICY = (
    "accelerometer=(), "
    "autoplay=(), "
    "camera=(), "
    "display-capture=(), "
    "encrypted-media=(), "
    "fullscreen=(self), "
    "geolocation=(), "
    "gyroscope=(), "
    "magnetometer=(), "
    "microphone=(self), "
    "midi=(), "
    "payment=(), "
    "usb=()"
)

# API responses are data, never documents: nothing may be loaded or executed.
API_CONTENT_SECURITY_POLICY = (
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
)


def _frame_headers() -> dict[str, str]:
    """Clickjacking protection, relaxed only when embedding is configured."""
    if settings.embed_allowed_origins:
        return {
            "Content-Security-Policy": API_CONTENT_SECURITY_POLICY.replace(
                "frame-ancestors 'none'",
                "frame-ancestors " + " ".join(settings.embed_allowed_origins),
            )
        }
    return {"X-Frame-Options": "DENY"}


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach defence-in-depth headers to every API response."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", PERMISSIONS_POLICY)
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")
        response.headers.setdefault(
            "Content-Security-Policy", API_CONTENT_SECURITY_POLICY
        )
        for key, value in _frame_headers().items():
            response.headers.setdefault(key, value)

        # HSTS only when we are genuinely serving production over TLS. Sending it
        # from a local HTTP deployment would pin localhost to HTTPS in the
        # developer's browser and is painful to undo.
        if settings.is_production:
            response.headers.setdefault(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains",
            )

        return response
