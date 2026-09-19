"""Lightweight in-process rate limiting for AI generation endpoints.

SCOPE AND LIMITATIONS (documented intentionally):
- The limiter is per-process and in-memory. On a single Vercel serverless
  instance (or a single uvicorn worker) this is real protection; across many
  concurrent lambdas the effective limit is `limit x instances`. This is a
  deliberate MVP trade-off — the alternative is Redis, which this project
  explicitly does not add. It is still sufficient to stop runaway client
  loops and obvious abuse of the paid Groq API in a single-instance deploy.
- Entries are pruned lazily on each check, so memory stays bounded by the
  number of *active* users within the window.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from typing import Deque, Dict, Tuple

from fastapi import HTTPException, status


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
    "learning_chat": RateLimiter(max_requests=40, window_seconds=60),
    "case_generate": RateLimiter(max_requests=10, window_seconds=60),
}


def enforce_ai_rate_limit(scope: str, user_id: str) -> None:
    """Apply the named AI rate limit for this user (raises 429 when exceeded)."""
    limiter = AI_RATE_LIMITS.get(scope)
    if limiter is not None:
        limiter.check(key=str(user_id), scope=scope)
