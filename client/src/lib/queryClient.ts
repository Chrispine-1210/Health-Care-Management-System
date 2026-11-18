import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { canRetryRead, readRetryDelay } from '@shared/retryPolicy';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export function resolveApiUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  if (!API_BASE_URL || !url.startsWith("/api")) return url;
  return `${API_BASE_URL}${url}`;
}

function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    await res.body?.cancel();
    const retrySeconds = Number(res.headers.get('retry-after'));
    throw new HttpError(res.status, res.headers.get('x-request-id'), Number.isFinite(retrySeconds) && retrySeconds > 0 ? Math.min(60_000, retrySeconds * 1000) : undefined);
  }
}

export class HttpError extends Error {
  constructor(public status: number, public requestId: string | null, public retryAfterMs?: number) {
    super(`Request failed (${status})${requestId ? ` · reference ${requestId}` : ''}`);
  }
}

export async function fetchWithDeadline(url: string, init: RequestInit, timeoutMs = 10_000) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  else init.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timer); init.signal?.removeEventListener('abort', abort); }
}

export function apiRequest(method: string, url: string, data?: unknown): Promise<Response>;
export function apiRequest(url: string, method: string, data?: unknown): Promise<Response>;
export function apiRequest(url: string, options: RequestInit): Promise<Response>;
export async function apiRequest(first: string, second: string | RequestInit, third?: unknown): Promise<Response> {
  const firstIsMethod = /^(GET|POST|PUT|PATCH|DELETE)$/i.test(first);
  const url = firstIsMethod ? second as string : first;
  const method = firstIsMethod ? first : typeof second === 'string' ? second : second.method || 'GET';
  const data = firstIsMethod || typeof second === 'string' ? third : second.body;
  const res = await fetchWithDeadline(resolveApiUrl(url), {
    method,
    headers: getAuthHeaders(),
    body: typeof data === 'string' ? data : data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const url = queryKey.join("/") as string;
    const res = await fetchWithDeadline(resolveApiUrl(url), {
      headers: getAuthHeaders(),
      signal,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (count, error) => canRetryRead(count, error instanceof HttpError ? error.status : undefined),
      retryDelay: (attempt, error) => error instanceof HttpError && error.retryAfterMs ? error.retryAfterMs : readRetryDelay(attempt),
    },
    mutations: {
      retry: false,
    },
  },
});
