"""Lightweight in-process rate limiting for AI and authentication endpoints.

SCOPE AND LIMITATIONS (documented intentionally):
- The limiter is per-process and in-memory. On a single Vercel serverless
  instance (or a single uvicorn worker) this is real protection; across many
  concurrent lambdas the effective limit is `limit x instances`. This is a
  deliberate MVP trade-off — the alternative is Redis, which this project
  explicitly does not add. It is still sufficient to stop runaway client
  loops, credential stuffing from one host, and obvious abuse of the paid
  Groq API in a single-instance deploy.
  **Launch requirement:** for a multi-instance production deployment this must
  move to a shared store (Redis/Upstash) or the platform's edge rate limiting.
- Entries are pruned lazily on each check, so memory stays bounded by the
  number of *active* users within the window.
- ``settings.RATE_LIMIT_ENABLED`` turns the whole layer off. It defaults to
  True and exists so the automated test suite (which creates hundreds of
  accounts from a single synthetic client) does not trip auth limits it is not
  trying to exercise. Never disable it in production.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, status

from .config import settings


class RateLimiter:
    """Fixed-window-per-user limiter backed by a deque of timestamps."""

    def __init__(self, max_requests: int, window_seconds: int) -> None:
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str, scope: str = "default") -> None:
        """Raise 429 when the caller exceeds the allowance; prune old entries."""
        now = time.monotonic()
        bucket_key = (scope, key)
        with self._lock:
            hits = self._hits[bucket_key]
            while hits and now - hits[0] > self.window_seconds:
                hits.popleft()
            if len(hits) >= self.max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=(
                        f"Rate limit reached ({self.max_requests} requests per "
                        f"{self.window_seconds}s for this action). Please wait a "
                        "moment and try again."
                    ),
                )
            hits.append(now)
            # Opportunistic global prune: occasionally drop empty buckets so
            # the dict cannot grow unbounded across distinct users.
            if len(self._hits) > 10_000:
                for k in [k for k, v in self._hits.items() if not v]:
                    del self._hits[k]


# Per-endpoint allowances. AI calls cost real money (Groq) and take seconds;
# everything else stays unrestricted. Tuned for normal human usage with
# headroom for legitimate retries.
AI_RATE_LIMITS = {
    "quiz_generate": RateLimiter(max_requests=10, window_seconds=60),
    "interview_chat": RateLimiter(max_requests=40, window_seconds=60),
    "evaluation": RateLimiter(max_requests=15, window_seconds=60),
    "feedback": RateLimiter(max_requests=15, window_seconds=60),
    "recommendations": RateLimiter(max_requests=15, window_seconds=60),
    "resume_parse": RateLimiter(max_requests=10, window_seconds=60),
    # File uploads run the same AI parse and are also an abuse vector in their
    # own right (CPU-bound extraction + multipart bodies), so they are limited
    # independently of the JSON parse path.
    "resume_upload": RateLimiter(max_requests=10, window_seconds=60),
    "learning_chat": RateLimiter(max_requests=40, window_seconds=60),
    "case_generate": RateLimiter(max_requests=10, window_seconds=60),
}


def enforce_ai_rate_limit(scope: str, user_id: str) -> None:
    """Apply the named AI rate limit for this user (raises 429 when exceeded)."""
    if not settings.RATE_LIMIT_ENABLED:
        return
    limiter = AI_RATE_LIMITS.get(scope)
    if limiter is not None:
        limiter.check(key=str(user_id), scope=scope)


# ---------------------------------------------------------------------------
# Authentication limits
# ---------------------------------------------------------------------------
#
# Signup and login are the only unauthenticated, credential-handling endpoints,
# so they need limits that are keyed differently from the AI ones (which are
# per authenticated user). The caller supplies the bucket key: the normalised
# email when known, otherwise the client IP. Rate limiting a login by email
# means an attacker cannot bypass it by rotating source addresses, and the IP
# fallback stops one host spraying many different accounts.
#
# Deliberately conservative rather than tight: Argon2 verification is already
# CPU-expensive, and an over-aggressive login limit is a trivial denial of
# service against real users behind a shared NAT.
AUTH_RATE_LIMITS = {
    "signup": RateLimiter(max_requests=10, window_seconds=600),
    "login": RateLimiter(max_requests=15, window_seconds=300),
}


def enforce_auth_rate_limit(scope: str, key: str) -> None:
    """Apply the named auth rate limit for this bucket key (raises 429)."""
    if not settings.RATE_LIMIT_ENABLED:
        return
    limiter = AUTH_RATE_LIMITS.get(scope)
    if limiter is not None:
        limiter.check(key=str(key), scope=f"auth:{scope}")
