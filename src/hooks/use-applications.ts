import { useState, useEffect, useCallback } from "react";
import { applicationsApi } from "@/features/applications";
import type { ApplicationData, ID } from "@/types";

export function useApplications(userId: ID | undefined) {
  const [apps, setApps] = useState<ApplicationData[]>([]);
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
      const data = await applicationsApi.list(userId);
      setApps(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (data: Omit<ApplicationData, "id" | "createdAt" | "updatedAt" | "user_id">) => {
      if (!userId) return;
      const created = await applicationsApi.create(userId, data);
      setApps((prev) => [created, ...prev]);
      return created;
    },
    [userId],
  );

  const update = useCallback(
    async (id: ID, data: Partial<ApplicationData>) => {
      if (!userId) return;
      const updated = await applicationsApi.update(userId, id, data);
      setApps((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    },
    [userId],
  );

  const remove = useCallback(
    async (id: ID) => {
      if (!userId) return;
      await applicationsApi.remove(userId, id);
      setApps((prev) => prev.filter((a) => a.id !== id));
    },
    [userId],
  );

  return { apps, loading, error, reload: load, create, update, remove };
}
