import api from "@/lib/api-client";
import type {
  ID,
  AISession,
  AIMessage,
  AIChatResponse,
  AIEvaluationResponse,
  AIFeedbackResponse,
  Recommendations,
  StructuredEvaluation,
  PromptVersionInfo,
} from "@/types";

export interface AIInterviewRepository {
  createSession(
    userId: ID,
    caseId?: ID,
    caseAttemptId?: ID,
  ): Promise<AISession>;
  getSession(sessionId: ID): Promise<AISession | undefined>;
  listSessions(userId: ID): Promise<AISession[]>;
  listMessages(sessionId: ID): Promise<AIMessage[]>;
  appendMessage(
    sessionId: ID,
    role: "interviewer" | "candidate" | "system",
    content: string,
    structured?: any,
  ): Promise<AIMessage>;
  sendMessage(
    sessionId: ID | undefined,
    caseId: ID | undefined,
    caseAttemptId: ID | undefined,
    message: string,
    history?: AIMessage[],
  ): Promise<AIChatResponse>;
  evaluateCase(caseAttemptId: ID): Promise<AIEvaluationResponse>;
  generateFeedback(caseId: ID, attemptId: ID): Promise<AIFeedbackResponse>;
  generateRecommendations(): Promise<Recommendations>;
  listPrompts(purpose?: string, name?: string): Promise<any[]>;
  listPromptVersions(name: string): Promise<any[]>;
  getPrompt(name: string, version?: string): Promise<PromptVersionInfo | undefined>;
}

export class MockAIInterviewRepository implements AIInterviewRepository {
  private sessions = new Map<string, AISession>();
  private messages: AIMessage[] = [];

  private uid() {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  async createSession(
    userId: ID,
    caseId?: ID,
    _caseAttemptId?: ID,
  ): Promise<AISession> {
    const now = new Date().toISOString();
    const session: AISession = {
      id: this.uid(),
      user_id: userId,
      session_type: "case_interview",
      related_resource_id: caseId,
      related_resource_type: caseId ? "case" : undefined,
      status: "active",
      started_at: now,
      total_tokens: 0,
      total_latency_ms: 0,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(sessionId: ID): Promise<AISession | undefined> {
    return this.sessions.get(sessionId);
  }

  async listSessions(userId: ID): Promise<AISession[]> {
    return Array.from(this.sessions.values()).filter((s) => s.user_id === userId);
  }

  async listMessages(sessionId: ID): Promise<AIMessage[]> {
    return this.messages.filter((m) => m.session_id === sessionId);
  }

  async appendMessage(
    sessionId: ID,
    role: "interviewer" | "candidate" | "system",
    content: string,
    structured?: any,
  ): Promise<AIMessage> {
    const msg: AIMessage = {
      id: this.uid(),
      session_id: sessionId,
      role,
      content,
      structured_output: structured,
      sequence_number:
        this.messages.filter((m) => m.session_id === sessionId).length + 1,
      created_at: new Date().toISOString(),
    };
    this.messages.push(msg);
    return msg;
  }

  async sendMessage(
    _sessionId: ID | undefined,
    _caseId: ID | undefined,
    _caseAttemptId: ID | undefined,
    _message: string,
    _history?: AIMessage[],
  ): Promise<AIChatResponse> {
    return {
      session_id: this.uid(),
      message:
        "AI interviewer stub. Configure LLM provider in Phase 7 to enable real responses.",
      next_question: undefined,
      structured_output: undefined,
    };
  }

  async evaluateCase(
    caseAttemptId: ID,
  ): Promise<AIEvaluationResponse> {
    const evaluation: StructuredEvaluation = {
      overall_score: 0,
      skills: [],
      strengths: [],
      improvements: [],
      recommendations: [],
    };
    return {
      case_attempt_id: caseAttemptId,
      evaluation,
      ai_session_id: undefined,
    };
  }

  async generateFeedback(
    _caseId: ID,
    _attemptId: ID,
  ): Promise<AIFeedbackResponse> {
    return {
      overall_score: 0,
      max_score: 100,
      skill_breakdown: [],
      strengths: [],
    };
  }

  async generateRecommendations(): Promise<Recommendations> {
    return {
      recommended_cases: [],
      recommended_drills: [],
      next_best_action:
        "Complete a practice case this session to maintain momentum.",
      reasoning: "AI recommendations coming in Phase 9.",
    };
  }

  async listPrompts(): Promise<any[]> {
    return [
      { name: "interviewer", versions: ["v1"] },
      { name: "evaluator", versions: ["v1"] },
      { name: "case_generation", versions: ["v1"] },
      { name: "feedback", versions: ["v1"] },
      { name: "recommendations", versions: ["v1"] },
    ];
  }

  async listPromptVersions(_name: string): Promise<any[]> {
    return [];
  }

  async getPrompt(
    name: string,
    version = "v1",
  ): Promise<PromptVersionInfo | undefined> {
    return {
      name,
      purpose: name,
      version,
      system_prompt: "",
      user_prompt_template: "",
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
    };
  }
}

export class ApiAIInterviewRepository implements AIInterviewRepository {
  async createSession(
    _userId: ID,
    caseId?: ID,
    _caseAttemptId?: ID,
  ): Promise<AISession> {
    const { data } = await api.post<AISession>("/api/ai/sessions", {
      session_type: "case_interview",
      related_resource_id: caseId,
      related_resource_type: caseId ? "case" : undefined,
    });
    return data;
  }

  async getSession(sessionId: ID): Promise<AISession | undefined> {
    const { data } = await api.get<AISession>(`/api/ai/sessions/${sessionId}`);
    return data;
  }

  async listSessions(_userId: ID): Promise<AISession[]> {
    const { data } = await api.get<AISession[]>("/api/ai/sessions");
    return data;
  }

  async listMessages(sessionId: ID): Promise<AIMessage[]> {
    const { data } = await api.get<AIMessage[]>(
      `/api/ai/sessions/${sessionId}/messages`,
    );
    return data;
  }

  async appendMessage(
    sessionId: ID,
    role: "interviewer" | "candidate" | "system",
    content: string,
    structured?: any,
  ): Promise<AIMessage> {
    const { data } = await api.post<AIMessage>(
      `/api/ai/sessions/${sessionId}/messages`,
      {
        session_id: sessionId,
        role,
        content,
        structured_output: structured,
      },
    );
    return data;
  }

  async sendMessage(
    _sessionId: ID | undefined,
    caseId: ID | undefined,
    caseAttemptId: ID | undefined,
    message: string,
    _history?: AIMessage[],
  ): Promise<AIChatResponse> {
    const { data } = await api.post<AIChatResponse>("/api/ai/interview/chat", {
      case_id: caseId,
      case_attempt_id: caseAttemptId,
      message,
    });
    return data;
  }

  async evaluateCase(caseAttemptId: ID): Promise<AIEvaluationResponse> {
    const { data } = await api.post<AIEvaluationResponse>(
      "/api/ai/evaluation",
      { case_attempt_id: caseAttemptId },
    );
    return data;
  }

  async generateFeedback(
    caseId: ID,
    attemptId: ID,
  ): Promise<AIFeedbackResponse> {
    const { data } = await api.post<AIFeedbackResponse>("/api/ai/feedback", {
      case_id: caseId,
      attempt_id: attemptId,
    });
    return data;
  }

  async generateRecommendations(): Promise<Recommendations> {
    const { data } = await api.post<Recommendations>(
      "/api/ai/recommendations",
      {},
    );
    return data;
  }

  async listPrompts(purpose?: string, name?: string): Promise<any[]> {
    const { data } = await api.get("/api/prompts", {
      params: { purpose, name },
    });
    return data;
  }

  async listPromptVersions(name: string): Promise<any[]> {
    const { data } = await api.get(`/api/prompts/${name}/versions`);
    return data;
  }

  async getPrompt(
    name: string,
    version?: string,
  ): Promise<PromptVersionInfo | undefined> {
    const v = version || "latest";
    const { data } = await api.get(`/api/prompts/${name}/${v}`);
    return data;
  }
}

const USE_API = false;
export const aiInterviewRepository: AIInterviewRepository = USE_API
  ? new ApiAIInterviewRepository()
  : new MockAIInterviewRepository();

export const aiInterviewApi = {
  createSession: (userId: ID, caseId?: ID, caseAttemptId?: ID) =>
    aiInterviewRepository.createSession(userId, caseId, caseAttemptId),
  getSession: (sessionId: ID) => aiInterviewRepository.getSession(sessionId),
  listSessions: (userId: ID) => aiInterviewRepository.listSessions(userId),
  listMessages: (sessionId: ID) => aiInterviewRepository.listMessages(sessionId),
  appendMessage: (
    sessionId: ID,
    role: "interviewer" | "candidate" | "system",
    content: string,
    structured?: any,
  ) => aiInterviewRepository.appendMessage(sessionId, role, content, structured),
  sendMessage: (
    sessionId: ID | undefined,
    caseId: ID | undefined,
    caseAttemptId: ID | undefined,
    message: string,
    history?: AIMessage[],
  ) =>
    aiInterviewRepository.sendMessage(
      sessionId,
      caseId,
      caseAttemptId,
      message,
      history,
    ),
  evaluateCase: (caseAttemptId: ID) =>
    aiInterviewRepository.evaluateCase(caseAttemptId),
  generateFeedback: (caseId: ID, attemptId: ID) =>
    aiInterviewRepository.generateFeedback(caseId, attemptId),
  generateRecommendations: () =>
    aiInterviewRepository.generateRecommendations(),
  listPrompts: (purpose?: string, name?: string) =>
    aiInterviewRepository.listPrompts(purpose, name),
  listPromptVersions: (name: string) =>
    aiInterviewRepository.listPromptVersions(name),
  getPrompt: (name: string, version?: string) =>
    aiInterviewRepository.getPrompt(name, version),
};
