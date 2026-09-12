import { describe, expect, it, vi } from "vitest";
import {
  PENDING_SESSION_RETRY_DELAYS_MS,
  resolvePendingSession,
  scoreBadgeClass,
  statusBadgeClass,
} from "../../src/features/ai-interview/derive";
import type { AISession } from "../../src/types";

/**
 * Repro for the P1 pendingLoadId race:
 * navigate("/interview", { state: { loadSessionId } }) can fire before the
 * just-created session shows up in GET /api/ai/sessions. These tests drive the
 * pure resolver with a fake fetch so the race is deterministic (no network, no
 * React, instant backoff).
 */
function session(id: string, over: Partial<AISession> = {}): AISession {
  return {
    id,
    user_id: "u1",
    session_type: "case_interview",
    status: "active",
    started_at: "2026-09-04T10:00:00Z",
    total_tokens: 0,
    total_latency_ms: 0,
    metadata_: {},
    ...over,
  };
}

const noWait = async () => {};

describe("resolvePendingSession (navigate-to-session race)", () => {
  it("returns the target from the initial list without re-fetching", async () => {
    const target = session("s1");
    const fetchSessions = vi.fn();

    const outcome = await resolvePendingSession({
      sessionId: "s1",
      initialSessions: [target],
      fetchSessions,
    });

    expect(outcome).toEqual({
      status: "found",
      sessions: [target],
      session: target,
    });
    expect(fetchSessions).not.toHaveBeenCalled();
  });

  it("resolves once a later fetch includes a just-created session", async () => {
    const target = session("new-1");
    let call = 0;
    const fetchSessions = vi.fn(async () => {
      call += 1;
      // First list response is stale (the create → list race) then catches up.
      return call === 1 ? [session("older")] : [session("older"), target];
    });

    const outcome = await resolvePendingSession({
      sessionId: "new-1",
      initialSessions: [],
      fetchSessions,
      delaysMs: [0, 0, 0],
      sleep: noWait,
    });

    expect(outcome.status).toBe("found");
    if (outcome.status === "found") {
      expect(outcome.session).toBe(target);
      expect(outcome.sessions).toContain(target);
    }
    expect(fetchSessions).toHaveBeenCalledTimes(2);
  });

  it("fails gracefully (not_found) when the session never appears", async () => {
    const fetchSessions = vi.fn(async () => [session("other")]);

    const outcome = await resolvePendingSession({
      sessionId: "ghost",
      initialSessions: [session("other")],
      fetchSessions,
      delaysMs: [0, 0, 0],
      sleep: noWait,
    });

    expect(outcome).toEqual({ status: "not_found" });
    // Bounded: exactly one fetch per retry slot, never an infinite loop.
    expect(fetchSessions).toHaveBeenCalledTimes(3);
  });

  it("keeps the production retry budget ~5s or less", () => {
    const total = PENDING_SESSION_RETRY_DELAYS_MS.reduce((a, b) => a + b, 0);
    expect(PENDING_SESSION_RETRY_DELAYS_MS.length).toBe(3);
    expect(total).toBeLessThanOrEqual(5000);
  });

  it("keeps retrying through a transient fetch failure", async () => {
    const target = session("s2");
    let call = 0;
    const fetchSessions = vi.fn(async () => {
      call += 1;
      if (call === 1) throw new Error("network hiccup");
      return [target];
    });

    const outcome = await resolvePendingSession({
      sessionId: "s2",
      initialSessions: [],
      fetchSessions,
      delaysMs: [0, 0, 0],
      sleep: noWait,
    });

    expect(outcome.status).toBe("found");
    expect(fetchSessions).toHaveBeenCalledTimes(2);
  });

  it("stops retrying once the caller has navigated away", async () => {
    let cancelled = false;
    const fetchSessions = vi.fn(async () => {
      cancelled = true;
      return [session("x")];
    });

    const outcome = await resolvePendingSession({
      sessionId: "x",
      initialSessions: [],
      fetchSessions,
      delaysMs: [0, 0, 0],
      sleep: noWait,
      isCancelled: () => cancelled,
    });

    expect(outcome).toEqual({ status: "cancelled" });
  });
});

describe("badge colour semantics", () => {
  it("maps scores to the same bands as Progress/Dashboard", () => {
    expect(scoreBadgeClass(85)).toContain("emerald");
    expect(scoreBadgeClass(80)).toContain("emerald");
    expect(scoreBadgeClass(70)).toContain("purple");
    expect(scoreBadgeClass(65)).toContain("purple");
    expect(scoreBadgeClass(50)).toContain("amber");
  });

  it("maps statuses consistently across the app", () => {
    expect(statusBadgeClass("completed")).toContain("emerald");
    expect(statusBadgeClass("active")).toContain("amber");
    expect(statusBadgeClass("abandoned")).toContain("slate");
  });
});
