import { QueryClient, QueryFunction } from "@tanstack/react-query";

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

export function unwrapApiResponse<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export async function apiRequest(
  url: string,
  init?: RequestInit,
): Promise<Response>;
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response>;
export async function apiRequest(
  url: string,
  method: string,
  data?: unknown,
): Promise<Response>;
export async function apiRequest(
  arg1: string,
  arg2?: string | RequestInit,
  arg3?: unknown,
): Promise<Response> {
  const isHttpMethod = (value: string) =>
    ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(value.toUpperCase());

  let url: string;
  let init: RequestInit = {};
  let data: unknown | undefined;

  if (arg2 === undefined || typeof arg2 === "object") {
    // (url, init)
    url = arg1;
    init = arg2 ?? {};
  } else if (typeof arg2 === "string") {
    // (method, url, data) or (url, method, data)
    if (isHttpMethod(arg1) && !isHttpMethod(arg2)) {
      url = arg2;
      init = { method: arg1 };
      data = arg3;
    } else {
      url = arg1;
      init = { method: arg2 };
      data = arg3;
    }
  } else {
    // Unreachable, but keeps TS happy.
    url = arg1;
    init = {};
  }

  // Let per-request headers override defaults.
  const headers: HeadersInit = {
    ...getAuthHeaders(),
    ...(init.headers || {}),
  };

  // If the caller already provided a body, respect it. Otherwise stringify `data`.
  const body =
    init.body !== undefined ? init.body : data !== undefined ? JSON.stringify(data) : undefined;

  const res = await fetch(url, {
    ...init,
    headers,
    body,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> =>
  async ({ queryKey }) => {
    const unauthorizedBehavior = options.on401;
    const res = await fetch(queryKey.join("/") as string, {
      headers: getAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as T;
    }

    await throwIfResNotOk(res);
    return unwrapApiResponse<T>(await res.json());
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
