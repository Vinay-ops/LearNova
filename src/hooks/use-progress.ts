import { useState, useEffect, useCallback } from "react";
import { progressApi } from "@/features/progress";
import type { ProgressSummary, SkillScore, ID } from "@/types";

export function useProgress(userId: ID | undefined) {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await progressApi.getSummary(userId);
      setSummary(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load progress");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const recalculate = useCallback(async () => {
    try {
      await progressApi.recalculateReadiness(userId || "");
      await load();
    } catch {
      /* noop */
    }
  }, [userId, load]);

  return { summary, loading, error, reload: load, recalculate };
}
