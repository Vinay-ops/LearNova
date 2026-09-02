import api from "@/lib/api-client";
import type {
  DrillData,
  DrillAttempt,
  ID,
} from "@/types";
import { skillDrills } from "@/data/mock-data";

export interface DrillRepository {
  list(): Promise<DrillData[]>;
  get(id: ID): Promise<DrillData | undefined>;
  createAttempt(userId: ID, drillId: ID): Promise<DrillAttempt>;
  saveAttempt(
    userId: ID,
    drillId: ID,
    result: Partial<DrillAttempt>,
  ): Promise<DrillAttempt>;
  listAttempts(userId: ID): Promise<DrillAttempt[]>;
}

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export class MockDrillRepository implements DrillRepository {
  private attempts: DrillAttempt[] = [];

  async list(): Promise<DrillData[]> {
    return skillDrills.map((d) => ({
      ...d,
      duration_minutes: d.duration,
    }));
  }

  async get(id: ID): Promise<DrillData | undefined> {
    const found = skillDrills.find((d) => d.id === id);
    if (!found) return undefined;
    return { ...found, duration_minutes: found.duration };
  }

  async createAttempt(userId: ID, drillId: ID): Promise<DrillAttempt> {
    const now = new Date().toISOString();
    const attempt: DrillAttempt = {
      id: uid(),
      user_id: userId,
      drill_id: drillId,
      status: "in_progress",
      started_at: now,
      total_questions: 0,
      correct_count: 0,
      time_spent_seconds: 0,
    };
    this.attempts.push(attempt);
    return attempt;
  }

  async saveAttempt(
    userId: ID,
    drillId: ID,
    result: Partial<DrillAttempt>,
  ): Promise<DrillAttempt> {
    const now = new Date().toISOString();
    const attempt: DrillAttempt = {
      id: uid(),
      user_id: userId,
      drill_id: drillId,
      status: result.status || "completed",
      started_at: result.started_at || now,
      completed_at: result.completed_at || now,
      total_questions: result.total_questions || 0,
      correct_count: result.correct_count || 0,
      score: result.score,
      time_spent_seconds: result.time_spent_seconds || 0,
    };
    this.attempts.push(attempt);
    return attempt;
  }

  async listAttempts(userId: ID): Promise<DrillAttempt[]> {
    return this.attempts.filter((a) => a.user_id === userId);
  }
}

function mapDrillResponse(raw: any): DrillData {
  return {
    ...raw,
    duration: raw.duration_minutes,
    completed: false,
    score: undefined,
  };
}

export class ApiDrillRepository implements DrillRepository {
  async list(): Promise<DrillData[]> {
    const { data } = await api.get<any[]>("/api/drills");
    return data.map(mapDrillResponse);
  }

  async get(id: ID): Promise<DrillData | undefined> {
    const { data } = await api.get<any>(`/api/drills/${id}`);
    return mapDrillResponse(data);
  }

  async saveAttempt(
    userId: ID,
    drillId: ID,
    result: Partial<DrillAttempt>,
  ): Promise<DrillAttempt> {
    const { data } = await api.post<DrillAttempt>("/api/drills/attempts", {
      drill_id: drillId,
    });
    if (result.status || result.score != null || result.time_spent_seconds) {
      const { data: updated } = await api.put<DrillAttempt>(
        `/api/drills/attempts/${data.id}`,
        result,
      );
      return updated;
    }
    return data;
  }

  async createAttempt(_userId: ID, drillId: ID): Promise<DrillAttempt> {
    const { data } = await api.post<DrillAttempt>("/api/drills/attempts", {
      drill_id: drillId,
    });
    return data;
  }

  async listAttempts(_userId: ID): Promise<DrillAttempt[]> {
    const { data } = await api.get<DrillAttempt[]>("/api/drills/attempts");
    return data;
  }
}

const USE_API = true;
export const drillRepository: DrillRepository = USE_API
  ? new ApiDrillRepository()
  : new MockDrillRepository();

export const drillsApi = {
  list: () => drillRepository.list(),
  get: (id: ID) => drillRepository.get(id),
  createAttempt: (userId: ID, drillId: ID) =>
    drillRepository.createAttempt(userId, drillId),
  saveAttempt: (
    userId: ID,
    drillId: ID,
    result: Partial<DrillAttempt>,
  ) => drillRepository.saveAttempt(userId, drillId, result),
  listAttempts: (userId: ID) => drillRepository.listAttempts(userId),
};
