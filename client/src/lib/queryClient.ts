import { QueryClient, QueryFunction } from "@tanstack/react-query";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function resolveApiUrl(url: string) {
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
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export function apiRequest(method: string, url: string, data?: unknown): Promise<Response>;
export function apiRequest(url: string, method: string, data?: unknown): Promise<Response>;
export function apiRequest(url: string, options: RequestInit): Promise<Response>;
export async function apiRequest(first: string, second: string | RequestInit, third?: unknown): Promise<Response> {
  const firstIsMethod = /^(GET|POST|PUT|PATCH|DELETE)$/i.test(first);
  const url = firstIsMethod ? second as string : first;
  const method = firstIsMethod ? first : typeof second === 'string' ? second : second.method || 'GET';
  const data = firstIsMethod || typeof second === 'string' ? third : second.body;
  const res = await fetch(resolveApiUrl(url), {
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
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const res = await fetch(resolveApiUrl(url), {
      headers: getAuthHeaders(),
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
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
