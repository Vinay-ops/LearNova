import { useState, useEffect, useCallback } from "react";
import { drillsApi } from "@/features/drills";
import type { DrillData, DrillAttempt, ID } from "@/types";

export function useDrills() {
  const [drills, setDrills] = useState<DrillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await drillsApi.list();
      setDrills(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load drills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { drills, loading, error, reload: load };
}

export function useDrillAttempts(userId: ID | undefined) {
  const [attempts, setAttempts] = useState<DrillAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await drillsApi.listAttempts(userId);
      setAttempts(data);
    } catch {
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { attempts, loading, reload: load };
}

export function useDrillAttemptActions() {
  const createAttempt = useCallback(async (userId: ID, drillId: ID) => {
    return await drillsApi.createAttempt(userId, drillId);
  }, []);

  const saveAttempt = useCallback(
    async (userId: ID, drillId: ID, result: Partial<DrillAttempt>) => {
      return await drillsApi.saveAttempt(userId, drillId, result);
    },
    [],
  );

  return { createAttempt, saveAttempt };
}
