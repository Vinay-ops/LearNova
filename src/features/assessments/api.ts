import api from "@/lib/api-client";
import type {
  AssessmentData,
  AssessmentAttempt,
  AssessmentAnswer,
  AssessmentQuestion,
  ID,
} from "@/types";
import { assessments } from "@/data/mock-data";

export interface AssessmentRepository {
  list(): Promise<AssessmentData[]>;
  get(id: ID): Promise<AssessmentData | undefined>;
  createAttempt(userId: ID, assessmentId: ID): Promise<AssessmentAttempt>;
  getAttempt(userId: ID, attemptId: ID): Promise<AssessmentAttempt | undefined>;
  listAttempts(userId: ID): Promise<AssessmentAttempt[]>;
  updateAttempt(userId: ID, attemptId: ID, updates: Partial<AssessmentAttempt>): Promise<AssessmentAttempt>;
  completeAttempt(userId: ID, attemptId: ID): Promise<AssessmentAttempt>;
  listQuestions(assessmentId: ID): Promise<AssessmentQuestion[]>;
  listAnswers(attemptId: ID): Promise<AssessmentAnswer[]>;
  saveAnswer(
    attemptId: ID,
    questionId: ID,
    answer: Partial<AssessmentAnswer>,
  ): Promise<AssessmentAnswer>;
}

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export class MockAssessmentRepository implements AssessmentRepository {
  private attempts = new Map<string, AssessmentAttempt>();
  private answers: AssessmentAnswer[] = [];

  async list(): Promise<AssessmentData[]> {
    return assessments;
  }

  async get(id: ID): Promise<AssessmentData | undefined> {
    return assessments.find((a) => a.id === id);
  }

  async createAttempt(userId: ID, assessmentId: ID): Promise<AssessmentAttempt> {
    const found = assessments.find((a) => a.id === assessmentId);
    const now = new Date().toISOString();
    const attempt: AssessmentAttempt = {
      id: uid(),
      user_id: userId,
      assessment_id: assessmentId,
      status: "in_progress",
      started_at: now,
      time_spent_seconds: 0,
      total_questions: found?.questions || 0,
      correct_count: 0,
    };
    this.attempts.set(attempt.id, attempt);
    return attempt;
  }

  async getAttempt(_userId: ID, attemptId: ID): Promise<AssessmentAttempt | undefined> {
    return this.attempts.get(attemptId);
  }

  async listAttempts(userId: ID): Promise<AssessmentAttempt[]> {
    return Array.from(this.attempts.values()).filter((a) => a.user_id === userId);
  }

  async updateAttempt(
    _userId: ID,
    attemptId: ID,
    updates: Partial<AssessmentAttempt>,
  ): Promise<AssessmentAttempt> {
    const existing = this.attempts.get(attemptId);
    if (!existing) throw new Error(`Attempt ${attemptId} not found`);
    const updated = { ...existing, ...updates };
    this.attempts.set(attemptId, updated);
    return updated;
  }

  async completeAttempt(userId: ID, attemptId: ID): Promise<AssessmentAttempt> {
    return this.updateAttempt(userId, attemptId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
  }

  async listQuestions(_assessmentId: ID): Promise<AssessmentQuestion[]> {
    return [];
  }

  async listAnswers(attemptId: ID): Promise<AssessmentAnswer[]> {
    return this.answers.filter((a) => a.attempt_id === attemptId);
  }

  async saveAnswer(
    attemptId: ID,
    questionId: ID,
    answer: Partial<AssessmentAnswer>,
  ): Promise<AssessmentAnswer> {
    const a: AssessmentAnswer = {
      id: uid(),
      attempt_id: attemptId,
      question_id: questionId,
      selected_option_index: answer.selected_option_index,
      free_text_answer: answer.free_text_answer,
      is_correct: answer.is_correct,
      points_earned: answer.points_earned || 0,
      time_spent_seconds: answer.time_spent_seconds,
    };
    this.answers.push(a);
    return a;
  }
}

function mapAssessmentResponse(raw: any): AssessmentData {
  return {
    ...raw,
    questions: raw.total_questions,
    timeMinutes: raw.time_limit_minutes,
    completed: false,
    score: undefined,
  };
}

export class ApiAssessmentRepository implements AssessmentRepository {
  async list(): Promise<AssessmentData[]> {
    const { data } = await api.get<any[]>("/api/assessments");
    return data.map(mapAssessmentResponse);
  }

  async get(id: ID): Promise<AssessmentData | undefined> {
    const { data } = await api.get<any>(`/api/assessments/${id}`);
    return mapAssessmentResponse(data);
  }

  async createAttempt(_userId: ID, assessmentId: ID): Promise<AssessmentAttempt> {
    const { data } = await api.post<AssessmentAttempt>(
      "/api/assessments/attempts",
      { assessment_id: assessmentId },
    );
    return data;
  }

  async getAttempt(_userId: ID, attemptId: ID): Promise<AssessmentAttempt | undefined> {
    const { data } = await api.get<AssessmentAttempt>(
      `/api/assessments/attempts/${attemptId}`,
    );
    return data;
  }

  async listAttempts(_userId: ID): Promise<AssessmentAttempt[]> {
    return [];
  }

  async updateAttempt(
    _userId: ID,
    attemptId: ID,
    updates: Partial<AssessmentAttempt>,
  ): Promise<AssessmentAttempt> {
    const { data } = await api.put<AssessmentAttempt>(
      `/api/assessments/attempts/${attemptId}`,
      updates,
    );
    return data;
  }

  async completeAttempt(userId: ID, attemptId: ID): Promise<AssessmentAttempt> {
    return this.updateAttempt(userId, attemptId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
  }

  async listQuestions(_assessmentId: ID): Promise<AssessmentQuestion[]> {
    return [];
  }

  async listAnswers(_attemptId: ID): Promise<AssessmentAnswer[]> {
    return [];
  }

  async saveAnswer(
    attemptId: ID,
    questionId: ID,
    answer: Partial<AssessmentAnswer>,
  ): Promise<AssessmentAnswer> {
    const { data } = await api.post<AssessmentAnswer>(
      "/api/assessments/answers",
      { attempt_id: attemptId, question_id: questionId, ...answer },
    );
    return data;
  }
}

const USE_API = true;
export const assessmentRepository: AssessmentRepository = USE_API
  ? new ApiAssessmentRepository()
  : new MockAssessmentRepository();

export const assessmentsApi = {
  list: () => assessmentRepository.list(),
  get: (id: ID) => assessmentRepository.get(id),
  createAttempt: (userId: ID, assessmentId: ID) =>
    assessmentRepository.createAttempt(userId, assessmentId),
  getAttempt: (userId: ID, attemptId: ID) =>
    assessmentRepository.getAttempt(userId, attemptId),
  listAttempts: (userId: ID) => assessmentRepository.listAttempts(userId),
  updateAttempt: (userId: ID, attemptId: ID, updates: Partial<AssessmentAttempt>) =>
    assessmentRepository.updateAttempt(userId, attemptId, updates),
  completeAttempt: (userId: ID, attemptId: ID) =>
    assessmentRepository.completeAttempt(userId, attemptId),
  listQuestions: (assessmentId: ID) =>
    assessmentRepository.listQuestions(assessmentId),
  listAnswers: (attemptId: ID) => assessmentRepository.listAnswers(attemptId),
  saveAnswer: (
    attemptId: ID,
    questionId: ID,
    answer: Partial<AssessmentAnswer>,
  ) => assessmentRepository.saveAnswer(attemptId, questionId, answer),
};
