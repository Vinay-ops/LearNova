import axios from "axios";

// VITE_API_URL is optional: when unset, requests go to the same origin
// (relative /api paths), which is how the Vercel services setup routes
// /api/* to the FastAPI backend. Set it locally to point at the dev backend.
const env = (import.meta as any).env ?? {};
const configuredUrl: string = env.VITE_API_URL || env.VITE_API_BASE_URL || "";
// Never ship a localhost API URL in a production build: ignore it and fall
// back to same-origin /api calls (the Vercel services rewrite handles routing).
const isLocalUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?($|\/)/.test(configuredUrl);
export const API_BASE_URL = env.PROD && isLocalUrl ? "" : configuredUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("access_token");
    }
    return Promise.reject(error);
  },
);

export function extractApiMessage(error: any, fallback = "Request failed"): string {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const msg = detail
      .map((d: any) => (typeof d?.msg === "string" ? d.msg : String(d)))
      .join("; ");
    if (msg) return msg;
  }
  if (error?.message && typeof error.message === "string") return error.message;
  return fallback;
}

export default api;
