import api from "@/lib/api-client";

export interface QuizGenerateRequest {
  topic: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  question_count?: number;
  focus_subtopics?: string[];
}

export interface QuizGenerateResult {
  assessment_id: string;
  title: string;
  topic: string;
  difficulty: string;
  question_count: number;
}

export interface QuizSubtopicPerformance {
  subtopic: string;
  total: number;
  correct: number;
  percent: number;
  status: "strong" | "needs_practice";
}

export interface QuizAnalysis {
  assessment_id: string;
  attempt_id: string;
  score: number;
  correct_count: number;
  total_questions: number;
  unanswered: number;
  per_subtopic: QuizSubtopicPerformance[];
  strong_subtopics: string[];
  weak_subtopics: string[];
}

export const quizzesApi = {
  generate: (payload: QuizGenerateRequest) =>
    api
      .post<QuizGenerateResult>("/api/quizzes/generate", {
        topic: payload.topic,
        difficulty: payload.difficulty || "Medium",
        question_count: payload.question_count ?? 5,
        focus_subtopics: payload.focus_subtopics?.length
          ? payload.focus_subtopics
          : undefined,
      })
      .then((r) => r.data),

  analyzeAttempt: (attemptId: string) =>
    api
      .get<QuizAnalysis>(`/api/quizzes/attempts/${attemptId}/analysis`)
      .then((r) => r.data),
};

