import api from "@/lib/api-client";

export interface LearningSession {
  id: string;
  user_id: string;
  session_type: string;
  topic?: string;
  learner_level: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LearningMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | string;
  content: string;
  created_at: string;
}

export interface LearningChatResult {
  session_id: string;
  reply: string;
  message_id: string;
  role: string;
}

export const learningApi = {
  createSession: (topic: string, learnerLevel = "Beginner") =>
    api
      .post<LearningSession>("/api/learning/sessions", {
        topic,
        learner_level: learnerLevel,
      })
      .then((r) => r.data),

  listSessions: () =>
    api.get<LearningSession[]>("/api/learning/sessions").then((r) => r.data),

  getSession: (sessionId: string) =>
    api
      .get<LearningSession>(`/api/learning/sessions/${sessionId}`)
      .then((r) => r.data),

  listMessages: (sessionId: string) =>
    api
      .get<LearningMessage[]>(`/api/learning/sessions/${sessionId}/messages`)
      .then((r) => r.data),

  sendMessage: (sessionId: string, content: string) =>
    api
      .post<LearningChatResult>(`/api/learning/sessions/${sessionId}/messages`, {
        content,
      })
      .then((r) => r.data),
};

