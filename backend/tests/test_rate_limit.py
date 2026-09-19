"""Tests for the lightweight AI rate limiter (429 on abuse, pass-through below limit)."""

import pytest
from fastapi import HTTPException

from app.core.rate_limit import RateLimiter, enforce_ai_rate_limit


def test_limiter_allows_requests_below_limit():
    limiter = RateLimiter(max_requests=3, window_seconds=60)
    for _ in range(3):
        limiter.check(key="user-1", scope="test")  # should not raise


def test_limiter_blocks_over_limit():
    limiter = RateLimiter(max_requests=3, window_seconds=60)
    for _ in range(3):
        limiter.check(key="user-1", scope="test")
    with pytest.raises(HTTPException) as exc:
        limiter.check(key="user-1", scope="test")
    assert exc.value.status_code == 429


def test_limiter_is_per_user():
    limiter = RateLimiter(max_requests=2, window_seconds=60)
    limiter.check(key="user-a", scope="test")
    limiter.check(key="user-a", scope="test")
    # different user is unaffected
    limiter.check(key="user-b", scope="test")
    with pytest.raises(HTTPException):
        limiter.check(key="user-a", scope="test")


def test_limiter_window_expiry(monkeypatch):
    import app.core.rate_limit as rl

    limiter = RateLimiter(max_requests=1, window_seconds=1)
    limiter.check(key="user-1", scope="test")
    with pytest.raises(HTTPException):
        limiter.check(key="user-1", scope="test")

    # simulate the window elapsing
    real_monotonic = rl.time.monotonic
    monkeypatch.setattr(rl.time, "monotonic", lambda: real_monotonic() + 5)
    limiter.check(key="user-1", scope="test")  # allowed again


def test_enforce_unknown_scope_is_noop():
    # Must not raise for scopes without a configured limiter.
    enforce_ai_rate_limit("nonexistent_scope", "user-1")
