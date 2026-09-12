import api from "@/lib/api-client";
import type {
  ID,
  AISession,
  AIMessage,
  AIChatResponse,
  AIEvaluationResponse,
  AIFeedbackResponse,
  Recommendations,
  PromptVersionInfo,
  ResumeData,
  ResumeParseResponse,
  ResumeRecord,
} from "@/types";

export interface AIInterviewRepository {
  createSession(
    userId: ID,
    caseId?: ID,
    caseAttemptId?: ID,
    metadata?: Record<string, unknown>,
  ): Promise<AISession>;
  getSession(sessionId: ID): Promise<AISession>;
  listSessions(userId: ID): Promise<AISession[]>;
  deleteSession(sessionId: ID): Promise<void>;
  abandonSession(sessionId: ID): Promise<AISession>;
  listMessages(sessionId: ID): Promise<AIMessage[]>;
  appendMessage(
    sessionId: ID,
    role: "interviewer" | "candidate" | "system" | "user" | "assistant",
    content: string,
    structured?: any,
  ): Promise<AIMessage>;
  sendMessage(params: {
    sessionId?: ID;
    caseId?: ID;
    caseAttemptId?: ID;
    topic?: string;
    difficulty?: string;
    role?: string;
    resume?: ResumeData;
    resumeId?: ID;
    message: string;
  }): Promise<AIChatResponse>;
  parseResume(file: File, role?: string): Promise<ResumeParseResponse>;
  listResumes(): Promise<ResumeRecord[]>;
  saveResume(params: {
    filename: string;
    source_type?: string;
    role?: string;
    resume: ResumeData;
  }): Promise<ResumeRecord>;
  updateResume(
    resumeId: ID,
    params: { filename?: string; role?: string; resume?: ResumeData },
  ): Promise<ResumeRecord>;
  deleteResume(resumeId: ID): Promise<void>;
  completeInterview(sessionId: ID): Promise<AISession>;
  evaluateCase(caseAttemptId: ID): Promise<AIEvaluationResponse>;
  evaluateSession(sessionId: ID): Promise<AIEvaluationResponse>;
  generateFeedback(caseId: ID, attemptId: ID): Promise<AIFeedbackResponse>;
  generateFeedbackForSession(sessionId: ID): Promise<AIFeedbackResponse>;
  generateRecommendations(sessionId?: ID): Promise<Recommendations>;
  listPrompts(purpose?: string, name?: string): Promise<any[]>;
  listPromptVersions(name: string): Promise<any[]>;
  getPrompt(name: string, version?: string): Promise<PromptVersionInfo | undefined>;
}

export class ApiAIInterviewRepository implements AIInterviewRepository {
  async createSession(
    _userId: ID,
    caseId?: ID,
    _caseAttemptId?: ID,
    metadata?: Record<string, unknown>,
  ): Promise<AISession> {
    const { data } = await api.post<AISession>("/api/ai/sessions", {
      session_type: "case_interview",
      related_resource_id: caseId,
      related_resource_type: caseId ? "case" : undefined,
      metadata_: metadata || {},
    });
    return data;
  }

  async getSession(sessionId: ID): Promise<AISession> {
    const { data } = await api.get<AISession>(`/api/ai/sessions/${sessionId}`);
    return data;
  }

  async listSessions(_userId: ID): Promise<AISession[]> {
    const { data } = await api.get<AISession[]>("/api/ai/sessions");
    return data;
  }

  async deleteSession(sessionId: ID): Promise<void> {
    await api.delete(`/api/ai/sessions/${sessionId}`);
  }

  async abandonSession(sessionId: ID): Promise<AISession> {
    const { data } = await api.put<AISession>(`/api/ai/sessions/${sessionId}`, {
      status: "abandoned",
    });
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
    role: "interviewer" | "candidate" | "system" | "user" | "assistant",
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

  async sendMessage(params: {
    sessionId?: ID;
    caseId?: ID;
    caseAttemptId?: ID;
    topic?: string;
    difficulty?: string;
    role?: string;
    resume?: ResumeData;
    resumeId?: ID;
    message: string;
  }): Promise<AIChatResponse> {
    const { data } = await api.post<AIChatResponse>("/api/ai/interview/chat", {
      session_id: params.sessionId,
      case_id: params.caseId,
      case_attempt_id: params.caseAttemptId,
      topic: params.topic,
      difficulty: params.difficulty,
      role: params.role,
      resume: params.resume,
      resume_id: params.resumeId,
      message: params.message,
    });
    return data;
  }

  async parseResume(file: File, role?: string): Promise<ResumeParseResponse> {
    const form = new FormData();
    form.append("file", file);
    if (role) form.append("role", role);
    const { data } = await api.post<ResumeParseResponse>(
      "/api/ai/resume/parse",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  }

  async listResumes(): Promise<ResumeRecord[]> {
    const { data } = await api.get<ResumeRecord[]>("/api/resumes");
    return data;
  }

  async saveResume(params: {
    filename: string;
    source_type?: string;
    role?: string;
    resume: ResumeData;
  }): Promise<ResumeRecord> {
    const { data } = await api.post<ResumeRecord>("/api/resumes", {
      filename: params.filename,
      source_type: params.source_type || "parsed",
      role: params.role,
      resume: params.resume,
    });
    return data;
  }

  async updateResume(
    resumeId: ID,
    params: { filename?: string; role?: string; resume?: ResumeData },
  ): Promise<ResumeRecord> {
    const { data } = await api.patch<ResumeRecord>(`/api/resumes/${resumeId}`, params);
    return data;
  }

  async deleteResume(resumeId: ID): Promise<void> {
    await api.delete(`/api/resumes/${resumeId}`);
  }

  async completeInterview(sessionId: ID): Promise<AISession> {
    const { data } = await api.post<AISession>("/api/ai/interview/complete", {
      session_id: sessionId,
    });
    return data;
  }

  async evaluateCase(caseAttemptId: ID): Promise<AIEvaluationResponse> {
    const { data } = await api.post<AIEvaluationResponse>("/api/ai/evaluation", {
      case_attempt_id: caseAttemptId,
    });
    return data;
  }

  async evaluateSession(sessionId: ID): Promise<AIEvaluationResponse> {
    const { data } = await api.post<AIEvaluationResponse>("/api/ai/evaluation", {
      session_id: sessionId,
    });
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

  async generateFeedbackForSession(sessionId: ID): Promise<AIFeedbackResponse> {
    const { data } = await api.post<AIFeedbackResponse>("/api/ai/feedback", {
      session_id: sessionId,
    });
    return data;
  }

  async generateRecommendations(sessionId?: ID): Promise<Recommendations> {
    const { data } = await api.post<Recommendations>("/api/ai/recommendations", {
      session_id: sessionId,
    });
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

export const aiInterviewRepository: AIInterviewRepository =
  new ApiAIInterviewRepository();

export const aiInterviewApi = {
  createSession: (
    userId: ID,
    caseId?: ID,
    caseAttemptId?: ID,
    metadata?: Record<string, unknown>,
  ) => aiInterviewRepository.createSession(userId, caseId, caseAttemptId, metadata),
  getSession: (sessionId: ID) => aiInterviewRepository.getSession(sessionId),
  listSessions: (userId: ID) => aiInterviewRepository.listSessions(userId),
  deleteSession: (sessionId: ID) => aiInterviewRepository.deleteSession(sessionId),
  abandonSession: (sessionId: ID) => aiInterviewRepository.abandonSession(sessionId),
  listMessages: (sessionId: ID) => aiInterviewRepository.listMessages(sessionId),
  appendMessage: (
    sessionId: ID,
    role: "interviewer" | "candidate" | "system" | "user" | "assistant",
    content: string,
    structured?: any,
  ) => aiInterviewRepository.appendMessage(sessionId, role, content, structured),
  sendMessage: (params: {
    sessionId?: ID;
    caseId?: ID;
    caseAttemptId?: ID;
    topic?: string;
    difficulty?: string;
    role?: string;
    resume?: ResumeData;
    resumeId?: ID;
    message: string;
  }) => aiInterviewRepository.sendMessage(params),
  parseResume: (file: File, role?: string) =>
    aiInterviewRepository.parseResume(file, role),
  listResumes: () => aiInterviewRepository.listResumes(),
  saveResume: (params: {
    filename: string;
    source_type?: string;
    role?: string;
    resume: ResumeData;
  }) => aiInterviewRepository.saveResume(params),
  updateResume: (
    resumeId: ID,
    params: { filename?: string; role?: string; resume?: ResumeData },
  ) => aiInterviewRepository.updateResume(resumeId, params),
  deleteResume: (resumeId: ID) => aiInterviewRepository.deleteResume(resumeId),
  completeInterview: (sessionId: ID) =>
    aiInterviewRepository.completeInterview(sessionId),
  evaluateCase: (caseAttemptId: ID) =>
    aiInterviewRepository.evaluateCase(caseAttemptId),
  evaluateSession: (sessionId: ID) =>
    aiInterviewRepository.evaluateSession(sessionId),
  generateFeedback: (caseId: ID, attemptId: ID) =>
    aiInterviewRepository.generateFeedback(caseId, attemptId),
  generateFeedbackForSession: (sessionId: ID) =>
    aiInterviewRepository.generateFeedbackForSession(sessionId),
  generateRecommendations: (sessionId?: ID) =>
    aiInterviewRepository.generateRecommendations(sessionId),
  listPrompts: (purpose?: string, name?: string) =>
    aiInterviewRepository.listPrompts(purpose, name),
  listPromptVersions: (name: string) =>
    aiInterviewRepository.listPromptVersions(name),
  getPrompt: (name: string, version?: string) =>
    aiInterviewRepository.getPrompt(name, version),
};