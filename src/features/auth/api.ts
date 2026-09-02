import api, { extractApiMessage } from "@/lib/api-client";

export interface SignUpPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthResult {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    is_active: boolean;
    created_at: string;
  };
  profile: any;
}

export interface AuthRepository {
  signUp(payload: SignUpPayload): Promise<{ data?: AuthResult; error?: string }>;
  signIn(payload: SignInPayload): Promise<{ data?: AuthResult; error?: string }>;
  me(): Promise<{ user: any; profile: any } | null>;
  signOut(): void;
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
}

export class ApiAuthRepository implements AuthRepository {
  getToken(): string | null {
    return localStorage.getItem("access_token");
  }
  setToken(token: string): void {
    localStorage.setItem("access_token", token);
  }
  clearToken(): void {
    localStorage.removeItem("access_token");
  }
  signOut(): void {
    this.clearToken();
  }

  async signUp(
    payload: SignUpPayload,
  ): Promise<{ data?: AuthResult; error?: string }> {
    try {
      const { data } = await api.post<AuthResult>("/api/auth/signup", {
        full_name: payload.fullName,
        email: payload.email,
        password: payload.password,
      });
      if (data?.access_token) this.setToken(data.access_token);
      return { data };
    } catch (err: any) {
      return { error: extractApiMessage(err, "Sign up failed") };
    }
  }

  async signIn(
    payload: SignInPayload,
  ): Promise<{ data?: AuthResult; error?: string }> {
    try {
      const { data } = await api.post<AuthResult>("/api/auth/login", payload);
      if (data?.access_token) this.setToken(data.access_token);
      return { data };
    } catch (err: any) {
      return { error: extractApiMessage(err, "Invalid email or password") };
    }
  }

  async me(): Promise<{ user: any; profile: any } | null> {
    if (!this.getToken()) return null;
    try {
      const { data } = await api.get("/api/auth/me");
      return data as any;
    } catch {
      this.clearToken();
      return null;
    }
  }
}

export const authRepository: AuthRepository = new ApiAuthRepository();

export const authApi = {
  signUp: (p: SignUpPayload) => authRepository.signUp(p),
  signIn: (p: SignInPayload) => authRepository.signIn(p),
  me: () => authRepository.me(),
  signOut: () => authRepository.signOut(),
  getToken: () => authRepository.getToken(),
};
