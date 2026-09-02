import api from "@/lib/api-client";
import type {
  CaseData,
  CaseAttempt,
  CaseAnswer,
  CaseQuestion,
  CaseType,
  ID,
} from "@/types";
import { practiceCases } from "@/data/mock-data";

export interface CaseRepository {
  list(): Promise<CaseData[]>;
  get(id: ID): Promise<CaseData | undefined>;
  createAttempt(userId: ID, caseId: ID): Promise<CaseAttempt>;
  getAttempt(userId: ID, attemptId: ID): Promise<CaseAttempt | undefined>;
  getActiveAttempt(userId: ID, caseId: ID): Promise<CaseAttempt | undefined>;
  listAttempts(userId: ID, caseId?: ID): Promise<CaseAttempt[]>;
  updateAttempt(userId: ID, attemptId: ID, updates: Partial<CaseAttempt>): Promise<CaseAttempt>;
  completeAttempt(userId: ID, attemptId: ID): Promise<CaseAttempt>;
  listQuestions(caseId: ID): Promise<CaseQuestion[]>;
  listAnswers(attemptId: ID): Promise<CaseAnswer[]>;
  saveAnswer(
    attemptId: ID,
    questionId: ID,
    answer: Partial<CaseAnswer>,
  ): Promise<CaseAnswer>;
}

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export class MockCaseRepository implements CaseRepository {
  private attempts = new Map<string, CaseAttempt>();
  private answers: CaseAnswer[] = [];

  async list(): Promise<CaseData[]> {
    return practiceCases.map((c) => ({
      ...c,
      type: c.type as CaseType,
      case_type: c.type as CaseType,
      duration_minutes: c.duration,
    }));
  }

  async get(id: ID): Promise<CaseData | undefined> {
    const found = practiceCases.find((c) => c.id === id);
    if (!found) return undefined;
    return {
      ...found,
      type: found.type as CaseType,
      case_type: found.type as CaseType,
      duration_minutes: found.duration,
    };
  }

  async createAttempt(userId: ID, caseId: ID): Promise<CaseAttempt> {
    const now = new Date().toISOString();
    const attempt: CaseAttempt = {
      id: uid(),
      user_id: userId,
      case_id: caseId,
      status: "in_progress",
      current_question_index: 0,
      started_at: now,
      elapsed_seconds: 0,
      strengths: [],
      weaknesses: [],
    };
    this.attempts.set(attempt.id, attempt);
    return attempt;
  }

  async getAttempt(_userId: ID, attemptId: ID): Promise<CaseAttempt | undefined> {
    return this.attempts.get(attemptId);
  }

  async getActiveAttempt(userId: ID, caseId: ID): Promise<CaseAttempt | undefined> {
    for (const a of this.attempts.values()) {
      if (a.user_id === userId && a.case_id === caseId && a.status === "in_progress") {
        return a;
      }
    }
    return undefined;
  }

  async listAttempts(userId: ID, caseId?: ID): Promise<CaseAttempt[]> {
    return Array.from(this.attempts.values()).filter(
      (a) => a.user_id === userId && (!caseId || a.case_id === caseId),
    );
  }

  async updateAttempt(
    _userId: ID,
    attemptId: ID,
    updates: Partial<CaseAttempt>,
  ): Promise<CaseAttempt> {
    const existing = this.attempts.get(attemptId);
    if (!existing) throw new Error(`Attempt ${attemptId} not found`);
    const updated = { ...existing, ...updates };
    this.attempts.set(attemptId, updated);
    return updated;
  }

  async completeAttempt(
    userId: ID,
    attemptId: ID,
  ): Promise<CaseAttempt> {
    return this.updateAttempt(userId, attemptId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
  }

  async listQuestions(_caseId: ID): Promise<CaseQuestion[]> {
    return [];
  }

  async listAnswers(attemptId: ID): Promise<CaseAnswer[]> {
    return this.answers.filter((a) => a.attempt_id === attemptId);
  }

  async saveAnswer(
    attemptId: ID,
    questionId: ID,
    answer: Partial<CaseAnswer>,
  ): Promise<CaseAnswer> {
    const now = new Date().toISOString();
    const a: CaseAnswer = {
      id: uid(),
      attempt_id: attemptId,
      question_id: questionId,
      answer_text: answer.answer_text,
      score: answer.score,
      ai_feedback: answer.ai_feedback,
      duration_seconds: answer.duration_seconds,
      created_at: now,
      updated_at: now,
    };
    this.answers.push(a);
    return a;
  }
}

function mapCaseResponse(raw: any): CaseData {
  return {
    ...raw,
    type: raw.case_type,
    duration: raw.duration_minutes,
    completed: false,
    score: undefined,
  };
}

export class ApiCaseRepository implements CaseRepository {
  async list(): Promise<CaseData[]> {
    const { data } = await api.get<any[]>("/api/cases");
    return data.map(mapCaseResponse);
  }

  async get(id: ID): Promise<CaseData | undefined> {
    const { data } = await api.get<any>(`/api/cases/${id}`);
    return mapCaseResponse(data);
  }

  async createAttempt(_userId: ID, caseId: ID): Promise<CaseAttempt> {
    const { data } = await api.post<CaseAttempt>("/api/cases/attempts", {
      case_id: caseId,
    });
    return data;
  }

  async getAttempt(_userId: ID, attemptId: ID): Promise<CaseAttempt | undefined> {
    const { data } = await api.get<CaseAttempt>(`/api/cases/attempts/${attemptId}`);
    return data;
  }

  async getActiveAttempt(
    userId: ID,
    caseId: ID,
  ): Promise<CaseAttempt | undefined> {
    const attempts = await this.listAttempts(userId, caseId);
    return attempts.find((a) => a.status === "in_progress");
  }

  async listAttempts(userId: ID, caseId?: ID): Promise<CaseAttempt[]> {
    const { data } = await api.get<CaseAttempt[]>("/api/cases/attempts", {
      params: { case_id: caseId, user_id: userId },
    });
    return data;
  }

  async updateAttempt(
    _userId: ID,
    attemptId: ID,
    updates: Partial<CaseAttempt>,
  ): Promise<CaseAttempt> {
    const { data } = await api.put<CaseAttempt>(
      `/api/cases/attempts/${attemptId}`,
      updates,
    );
    return data;
  }

  async completeAttempt(userId: ID, attemptId: ID): Promise<CaseAttempt> {
    return this.updateAttempt(userId, attemptId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
  }

  async listQuestions(caseId: ID): Promise<CaseQuestion[]> {
    return [];
  }

  async listAnswers(attemptId: ID): Promise<CaseAnswer[]> {
    return [];
  }

  async saveAnswer(
    attemptId: ID,
    questionId: ID,
    answer: Partial<CaseAnswer>,
  ): Promise<CaseAnswer> {
    const { data } = await api.post<CaseAnswer>("/api/cases/answers", {
      attempt_id: attemptId,
      question_id: questionId,
      ...answer,
    });
    return data;
  }
}

const USE_API = true;
export const caseRepository: CaseRepository = USE_API
  ? new ApiCaseRepository()
  : new MockCaseRepository();

export const casesApi = {
  list: () => caseRepository.list(),
  get: (id: ID) => caseRepository.get(id),
  createAttempt: (userId: ID, caseId: ID) =>
    caseRepository.createAttempt(userId, caseId),
  getAttempt: (userId: ID, attemptId: ID) =>
    caseRepository.getAttempt(userId, attemptId),
  getActiveAttempt: (userId: ID, caseId: ID) =>
    caseRepository.getActiveAttempt(userId, caseId),
  listAttempts: (userId: ID, caseId?: ID) =>
    caseRepository.listAttempts(userId, caseId),
  updateAttempt: (userId: ID, attemptId: ID, updates: Partial<CaseAttempt>) =>
    caseRepository.updateAttempt(userId, attemptId, updates),
  completeAttempt: (userId: ID, attemptId: ID) =>
    caseRepository.completeAttempt(userId, attemptId),
  listQuestions: (caseId: ID) => caseRepository.listQuestions(caseId),
  listAnswers: (attemptId: ID) => caseRepository.listAnswers(attemptId),
  saveAnswer: (
    attemptId: ID,
    questionId: ID,
    answer: Partial<CaseAnswer>,
  ) => caseRepository.saveAnswer(attemptId, questionId, answer),
};
