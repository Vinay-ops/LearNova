import api from "@/lib/api-client";
import type {
  ApplicationData,
  ID,
} from "@/types";

export interface ApplicationRepository {
  list(userId: ID): Promise<ApplicationData[]>;
  get(userId: ID, id: ID): Promise<ApplicationData | undefined>;
  create(
    userId: ID,
    data: Omit<ApplicationData, "id" | "createdAt" | "updatedAt" | "user_id">,
  ): Promise<ApplicationData>;
  update(userId: ID, id: ID, data: Partial<ApplicationData>): Promise<ApplicationData>;
  remove(userId: ID, id: ID): Promise<void>;
}

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const mockSeed = [
  { id: "app-1", company: "BCG", role: "Associate", deadline: "2026-09-15", stage: "Applied" as const, preparation: 84 },
  { id: "app-2", company: "Bain", role: "Consultant", deadline: "2026-09-20", stage: "OA" as const, preparation: 71 },
  { id: "app-3", company: "Deloitte", role: "Analyst", deadline: "2026-09-25", stage: "Preparing" as const, preparation: 45 },
  { id: "app-4", company: "McKinsey", role: "Associate", deadline: "2026-10-01", stage: "Preparing" as const, preparation: 62 },
  { id: "app-5", company: "Kearney", role: "Consultant", deadline: "2026-10-10", stage: "Preparing" as const, preparation: 30 },
];

export class MockApplicationRepository implements ApplicationRepository {
  private store = new Map<string, ApplicationData>();

  constructor() {
    mockSeed.forEach((a) => {
      const now = new Date().toISOString();
      this.store.set(a.id, { ...a, createdAt: now, updatedAt: now });
    });
  }

  async list(): Promise<ApplicationData[]> {
    return Array.from(this.store.values());
  }

  async get(_userId: ID, id: ID): Promise<ApplicationData | undefined> {
    return this.store.get(id);
  }

  async create(
    _userId: ID,
    data: Omit<ApplicationData, "id" | "createdAt" | "updatedAt" | "user_id">,
  ): Promise<ApplicationData> {
    const now = new Date().toISOString();
    const app: ApplicationData = { ...data, id: uid(), createdAt: now, updatedAt: now };
    this.store.set(app.id, app);
    return app;
  }

  async update(
    _userId: ID,
    id: ID,
    data: Partial<ApplicationData>,
  ): Promise<ApplicationData> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Application ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async remove(_userId: ID, id: ID): Promise<void> {
    this.store.delete(id);
  }
}

function mapApplicationResponse(raw: any): ApplicationData {
  return {
    ...raw,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    deadline: raw.deadline || undefined,
  };
}

export class ApiApplicationRepository implements ApplicationRepository {
  async list(): Promise<ApplicationData[]> {
    const { data } = await api.get<any[]>("/api/applications");
    return data.map(mapApplicationResponse);
  }

  async get(_userId: ID, id: ID): Promise<ApplicationData | undefined> {
    const { data } = await api.get<any>(`/api/applications/${id}`);
    return mapApplicationResponse(data);
  }

  async create(
    _userId: ID,
    data: Omit<ApplicationData, "id" | "createdAt" | "updatedAt" | "user_id">,
  ): Promise<ApplicationData> {
    const { data: created } = await api.post<ApplicationData>("/api/applications", data);
    return created;
  }

  async update(
    _userId: ID,
    id: ID,
    updates: Partial<ApplicationData>,
  ): Promise<ApplicationData> {
    const { data } = await api.put<ApplicationData>(`/api/applications/${id}`, updates);
    return data;
  }

  async remove(_userId: ID, id: ID): Promise<void> {
    await api.delete(`/api/applications/${id}`);
  }
}

const USE_API = true;
export const applicationRepository: ApplicationRepository = USE_API
  ? new ApiApplicationRepository()
  : new MockApplicationRepository();

export const applicationsApi = {
  list: (userId: ID) => applicationRepository.list(userId),
  get: (userId: ID, id: ID) => applicationRepository.get(userId, id),
  create: (
    userId: ID,
    data: Omit<ApplicationData, "id" | "createdAt" | "updatedAt" | "user_id">,
  ) => applicationRepository.create(userId, data),
  update: (userId: ID, id: ID, data: Partial<ApplicationData>) =>
    applicationRepository.update(userId, id, data),
  remove: (userId: ID, id: ID) => applicationRepository.remove(userId, id),
};
