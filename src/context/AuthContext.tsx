import React, { createContext, useCallback, useEffect, useState } from "react";
import api, { extractApiMessage } from "@/lib/api-client";

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  readonly password?: string;
  readonly name?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  experience_level: string | null;
  target_firms: string[];
  interview_date: string | null;
  readiness_score: number;
  created_at: string;
  updated_at: string;
  readonly userId?: string;
  readonly name?: string;
  readonly email?: string;
  readonly targetFirms?: string[];
  readonly experienceLevel?: string;
  readonly interviewDate?: string | null;
}

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function normalizeBackendToLegacy(user: any, profile: any): { u: User; p: Profile } {
  const baseUser = {
    id: String(user?.id ?? ""),
    email: user?.email ?? "",
    is_active: Boolean(user?.is_active ?? true),
    created_at: user?.created_at ?? new Date().toISOString(),
  };
  const u: User = Object.create(baseUser, {
    name: {
      enumerable: true,
      configurable: true,
      get() {
        return profile?.full_name || this.email?.split("@")[0] || "";
      },
    },
    password: {
      enumerable: true,
      configurable: true,
      get() {
        return "";
      },
    },
  }) as User;

  const baseProfile = {
    id: String(profile?.id ?? ""),
    user_id: String(profile?.user_id ?? user?.id ?? ""),
    full_name: profile?.full_name ?? "",
    avatar_url: profile?.avatar_url ?? null,
    experience_level: profile?.experience_level ?? null,
    target_firms: profile?.target_firms ?? [],
    interview_date: profile?.interview_date ?? null,
    readiness_score: typeof profile?.readiness_score === "number" ? profile.readiness_score : 0,
    created_at: profile?.created_at ?? new Date().toISOString(),
    updated_at: profile?.updated_at ?? new Date().toISOString(),
  };
  const p: Profile = Object.create(baseProfile, {
    userId: { enumerable: true, configurable: true, get() { return String(this.user_id); } },
    name: { enumerable: true, configurable: true, get() { return this.full_name; } },
    email: { enumerable: true, configurable: true, get() { return user?.email ?? ""; } },
    targetFirms: { enumerable: true, configurable: true, get() { return this.target_firms || []; } },
    experienceLevel: { enumerable: true, configurable: true, get() { return this.experience_level || ""; } },
    interviewDate: {
      enumerable: true,
      configurable: true,
      get() {
        return this.interview_date ? new Date(this.interview_date).toISOString().slice(0, 10) : null;
      },
    },
  }) as Profile;

  return { u, p };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearLocal = useCallback(() => {
    localStorage.removeItem("access_token");
  }, []);

  const loadSession = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/api/auth/me");
      const { u, p } = normalizeBackendToLegacy(data.user, data.profile);
      setUser(u);
      setProfile(p);
    } catch (_e) {
      clearLocal();
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [clearLocal]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const signUp: AuthContextType["signUp"] = async (fullName, email, password) => {
    try {
      const { data } = await api.post("/api/auth/signup", {
        full_name: fullName,
        email,
        password,
      });
      if (data?.access_token) localStorage.setItem("access_token", data.access_token);
      const { u, p } = normalizeBackendToLegacy(data.user, data.profile);
      setUser(u);
      setProfile(p);
      return {};
    } catch (err: any) {
      return { error: extractApiMessage(err, "Sign up failed") };
    }
  };

  const signIn: AuthContextType["signIn"] = async (email, password) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      if (data?.access_token) localStorage.setItem("access_token", data.access_token);
      const { u, p } = normalizeBackendToLegacy(data.user, data.profile);
      setUser(u);
      setProfile(p);
      return {};
    } catch (err: any) {
      return { error: extractApiMessage(err, "Invalid email or password") };
    }
  };

  const signOut: AuthContextType["signOut"] = () => {
    clearLocal();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile: AuthContextType["refreshProfile"] = async () => {
    try {
      const { data } = await api.get("/api/profile");
      const { u, p } = normalizeBackendToLegacy(user || { id: data.user_id, email: "" }, data);
      setProfile(p);
      if (!user) setUser(u);
    } catch (_e) {
      /* noop */
    }
  };

  const updateProfile: AuthContextType["updateProfile"] = async (updates) => {
    try {
      const payload: any = {};
      if (typeof updates.full_name === "string") payload.full_name = updates.full_name;
      if (typeof updates.name === "string" && !payload.full_name) payload.full_name = updates.name;
      if ("avatar_url" in updates) payload.avatar_url = updates.avatar_url;
      if (typeof updates.experience_level === "string") payload.experience_level = updates.experience_level;
      if (typeof updates.experienceLevel === "string" && !payload.experience_level) payload.experience_level = updates.experienceLevel;
      if (Array.isArray(updates.target_firms)) payload.target_firms = updates.target_firms;
      if (Array.isArray(updates.targetFirms) && !payload.target_firms) payload.target_firms = updates.targetFirms;
      if ("interview_date" in updates) payload.interview_date = updates.interview_date;
      if (typeof updates.interviewDate === "string" && !("interview_date" in payload)) {
        payload.interview_date = updates.interviewDate ? new Date(updates.interviewDate).toISOString() : null;
      } else if (updates.interviewDate === null && !("interview_date" in payload)) {
        payload.interview_date = null;
      }
      const { data } = await api.put("/api/profile", payload);
      const { u, p } = normalizeBackendToLegacy(user || { id: data.user_id, email: "" }, data);
      setProfile(p);
      if (!user) setUser(u);
      return {};
    } catch (err: any) {
      return { error: extractApiMessage(err, "Failed to update profile") };
    }
  };

  const isAuthenticated = !!user && !!localStorage.getItem("access_token");

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { useAuth } from "@/hooks/use-auth";
