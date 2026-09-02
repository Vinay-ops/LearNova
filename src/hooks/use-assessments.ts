import { useState, useEffect, useCallback } from "react";
import { assessmentsApi } from "@/features/assessments";
import type { AssessmentData, AssessmentAttempt, AssessmentAnswer, AssessmentQuestion, ID } from "@/types";

export function useAssessments() {
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentsApi.list();
      setAssessments(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { assessments, loading, error, reload: load };
}

export function useAssessmentQuestions(assessmentId: ID | undefined) {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assessmentId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await assessmentsApi.listQuestions(assessmentId);
        setQuestions(data);
      } catch {
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [assessmentId]);

  return { questions, loading };
}

export function useAssessmentAttempts(userId: ID | undefined) {
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await assessmentsApi.listAttempts(userId);
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

export function useAssessmentAttemptState() {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const createAttempt = useCallback(async (userId: ID, assessmentId: ID) => {
    const attempt = await assessmentsApi.createAttempt(userId, assessmentId);
    setAttemptId(attempt.id);
    return attempt;
  }, []);

  const completeAttempt = useCallback(
    async (attemptId: ID, data: Partial<AssessmentAttempt>) => {
      const updated = await assessmentsApi.completeAttempt("", attemptId);
      return updated;
    },
    [],
  );

  const saveAnswer = useCallback(
    async (questionId: ID, answer: Partial<AssessmentAnswer>) => {
      if (!attemptId) return;
      const saved = await assessmentsApi.saveAnswer(attemptId, questionId, answer);
      return saved;
    },
    [attemptId],
  );

  return { attemptId, setAttemptId, answers, setAnswers, createAttempt, completeAttempt, saveAnswer };
}
