import { useState, useEffect, useCallback } from "react";
import { casesApi } from "@/features/cases";
import type { CaseData, CaseAttempt, CaseAnswer, CaseQuestion, ID } from "@/types";

export function useCases() {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await casesApi.list();
      setCases(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getCase = useCallback(
    async (id: ID) => {
      try {
        return await casesApi.get(id);
      } catch {
        return undefined;
      }
    },
    [],
  );

  return { cases, loading, error, reload: load, getCase };
}

export function useCaseAttempt(userId: ID | undefined, caseId: ID | undefined) {
  const [attempt, setAttempt] = useState<CaseAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !caseId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const active = await casesApi.getActiveAttempt(userId, caseId);
        setAttempt(active || null);
      } catch {
        setAttempt(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, caseId]);

  const createAttempt = useCallback(
    async (uid: ID, cid: ID) => {
      const a = await casesApi.createAttempt(uid, cid);
      setAttempt(a);
      return a;
    },
    [],
  );

  const completeAttempt = useCallback(
    async (attemptId: ID) => {
      const updated = await casesApi.completeAttempt(userId || "", attemptId);
      setAttempt(updated);
      return updated;
    },
    [userId],
  );

  const updateAttempt = useCallback(
    async (attemptId: ID, updates: Partial<CaseAttempt>) => {
      const updated = await casesApi.updateAttempt(userId || "", attemptId, updates);
      setAttempt(updated);
      return updated;
    },
    [userId],
  );

  const evaluateAttempt = useCallback(
    async (attemptId: ID) => {
      const evaluated = await casesApi.evaluateAttempt(attemptId);
      setAttempt(evaluated);
      return evaluated;
    },
    [],
  );

  return {
    attempt,
    loading,
    createAttempt,
    completeAttempt,
    updateAttempt,
    evaluateAttempt,
    setAttempt,
  };
}

export function useCaseQuestions(caseId: ID | undefined) {
  const [questions, setQuestions] = useState<CaseQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await casesApi.listQuestions(caseId);
        setQuestions(data);
      } catch {
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [caseId]);

  return { questions, loading };
}

export function useCaseAnswers(attemptId: ID | undefined) {
  const [answers, setAnswers] = useState<CaseAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await casesApi.listAnswers(attemptId);
        setAnswers(data);
      } catch {
        setAnswers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  const saveAnswer = useCallback(
    async (questionId: ID, answer: Partial<CaseAnswer>) => {
      if (!attemptId) return;
      const saved = await casesApi.saveAnswer(attemptId, questionId, answer);
      setAnswers((prev) => {
        const idx = prev.findIndex((a) => a.question_id === questionId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      return saved;
    },
    [attemptId],
  );

  return { answers, loading, saveAnswer };
}

export function useCaseAttempts(userId: ID | undefined) {
  const [attempts, setAttempts] = useState<CaseAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await casesApi.listAttempts(userId);
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
