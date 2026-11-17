/**
 * Central API client for ContractMind.
 * Uses the NEXT_PUBLIC_API_URL env var (falls back to live backend for production).
 * Automatically attaches Bearer token on every request.
 * On 401 responses (except login/register), clears auth and redirects to home.
 */
import { getToken, clearAuth } from "@/lib/auth";

const LIVE_BACKEND_URL = "https://legal-copilot-backend-088i.onrender.com";

// [UPDATED] FIX: Always fall back to the live backend URL if env var is missing.
// This prevents the frontend from accidentally hitting its own Vercel domain.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || LIVE_BACKEND_URL;

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiOptions {
  method?: RequestMethod;
  body?: Record<string, unknown> | FormData;
  headers?: Record<string, string>;
  /** Skip JSON serialisation (for FormData uploads) */
  isFormData?: boolean;
  /** Optional external AbortSignal for user cancellation */
  signal?: AbortSignal;
  /** Custom timeout in milliseconds (default: 180s for contract audits/uploads, 90s for standard requests) */
  timeoutMs?: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, isFormData = false, signal } = options;

  const token = getToken();
  const reqHeaders: Record<string, string> = { ...headers };

  if (token) {
    reqHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (!isFormData) {
    reqHeaders["Content-Type"] = "application/json";
    reqHeaders["Accept"] = "application/json";
  }

  const fullUrl = `${BASE_URL}${path}`;
  
  // [UPDATED] SECURITY: Never log the request body (contains passwords, PII, and contract text)
  // Only log the URL in development mode.
  if (process.env.NODE_ENV === "development") {
    console.log(`[API Call] ${method} ${fullUrl}`);
  }

  let res: Response;
  const controller = new AbortController();
  let abortedByCaller = Boolean(signal?.aborted);
  const handleExternalAbort = () => {
    abortedByCaller = true;
    controller.abort();
  };
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", handleExternalAbort, { once: true });
    }
  }

  // Contract audits, document ingestion, and playbook parsing require extra headroom (up to 180s / 3 min)
  // to tolerate upstream LLM retries and fallback switches (e.g. Gemini 503 -> Z.ai / Groq).
  const isHeavyOperation =
    path.includes("/contracts/upload") ||
    path.includes("/contracts/") ||
    path.includes("/playbook") ||
    isFormData;
  const effectiveTimeout = options.timeoutMs ?? (isHeavyOperation ? 180000 : 90000);
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

  try {
    res = await fetch(fullUrl, {
      method,
      headers: reqHeaders,
      signal: controller.signal,
      body:
        body !== undefined
          ? isFormData
            ? (body as FormData)
            : JSON.stringify(body)
          : undefined,
    });
  } catch (netErr: unknown) {
    const err = netErr as { name?: string };
    if (err?.name === "AbortError") {
      if (abortedByCaller || signal?.aborted) {
        throw new ApiError(499, "Request stopped by user.");
      }
      const timeoutSec = Math.round(effectiveTimeout / 1000);
      console.error(`[API Timeout] ${method} ${fullUrl} exceeded ${timeoutSec}s`);
      throw new ApiError(408, `Request timed out after ${timeoutSec}s. AI model might be busy.`);
    }
    console.error(`[API Network Error] ${method} ${fullUrl}:`, netErr);
    throw new ApiError(0, "Network connection error. Please verify backend connectivity.");
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener("abort", handleExternalAbort);
    }
  }

  // [UPDATED] FIX: Only clear auth if 401 occurs on a protected route (NOT login/register/demo-login).
  if (
    res.status === 401 &&
    !path.includes("/api/auth/login") &&
    !path.includes("/api/auth/register") &&
    !path.includes("/api/auth/demo-login")
  ) {
    const isLocalDemo = typeof window !== "undefined" && Boolean(localStorage.getItem("app_auth_v2"));
    if (!isLocalDemo) {
      clearAuth();
      throw new ApiError(401, "Session expired or unauthorized. Please log in.");
    }
    throw new ApiError(401, "Demo mode: Backend authentication pending.");
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      const rawDetail = json?.detail ?? json?.message;
      if (typeof rawDetail === "string") {
        detail = rawDetail;
      } else if (Array.isArray(rawDetail)) {
        // Format Pydantic 422 errors: [{ loc: ['body', 'field'], msg: '...' }]
        detail = rawDetail
          .map((d: { loc?: (string | number)[]; msg?: string }) => {
            const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : "";
            return field ? `${field}: ${d.msg}` : d.msg || JSON.stringify(d);
          })
          .join("; ");
      } else if (rawDetail && typeof rawDetail === "object") {
        detail = JSON.stringify(rawDetail);
      }
    } catch {
      /* noop */
    }
    if (res.status >= 500) {
      console.error(`[API Error] ${res.status} ${fullUrl}:`, detail);
    } else {
      console.warn(`[API Notice ${res.status}] ${fullUrl}:`, detail);
    }
    throw new ApiError(res.status, detail);
  }

  // 204 No Content
  if (res.status === 204) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[API Success] 204 No Content ${fullUrl}`);
    }
    return undefined as T;
  }

  const data = await res.json();
  
  // [UPDATED] SECURITY: Never log response data in production (contains PII & legal text)
  if (process.env.NODE_ENV === "development") {
    console.log(`[API Success] ${res.status} ${fullUrl}`);
  }
  
  return data as T;
}

// ─── Convenience wrappers ───────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, extraHeaders?: Record<string, string>, signal?: AbortSignal) =>
    request<T>(path, { method: "GET", headers: extraHeaders, signal }),

  post: <T>(
    path: string,
    body?: Record<string, unknown>,
    extraHeaders?: Record<string, string>,
    signal?: AbortSignal
  ) => request<T>(path, { method: "POST", body, headers: extraHeaders, signal }),

  patch: <T>(
    path: string,
    body?: Record<string, unknown>,
    extraHeaders?: Record<string, string>,
    signal?: AbortSignal
  ) => request<T>(path, { method: "PATCH", body, headers: extraHeaders, signal }),

  put: <T>(
    path: string,
    body?: Record<string, unknown>,
    extraHeaders?: Record<string, string>,
    signal?: AbortSignal
  ) => request<T>(path, { method: "PUT", body, headers: extraHeaders, signal }),

  delete: <T>(path: string, extraHeaders?: Record<string, string>, signal?: AbortSignal) =>
    request<T>(path, { method: "DELETE", headers: extraHeaders, signal }),

  upload: <T>(path: string, formData: FormData, signal?: AbortSignal, timeoutMs?: number) =>
    request<T>(path, {
      method: "POST",
      body: formData,
      isFormData: true,
      signal,
      timeoutMs: timeoutMs ?? 180000,
    }),

  downloadBlob: async (path: string): Promise<Blob> => {
    const token = getToken();
    const reqHeaders: Record<string, string> = {};
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
    const fullUrl = `${BASE_URL}${path}`;
    const res = await fetch(fullUrl, {
      method: "GET",
      headers: reqHeaders,
    });
    if (!res.ok) {
      throw new ApiError(res.status, "Failed to download file");
    }
    return res.blob();
  },
};

export default api;

