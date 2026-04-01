import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include', // important for cookies/session auth
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      const err = await res.json();
      message = err?.message || message;
    } catch {}
    throw new Error(message);
  }

  const data = await res.json();

  // Support { success, data } pattern
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data;
  }

  return data;
}

/**
 * Fetch list endpoint
 */
export function useApiList<T>(endpoint: string, enabled = true) {
  return useQuery({
    queryKey: [endpoint],
    queryFn: () => apiFetch<T[]>(endpoint),
    enabled,
  });
}

/**
 * Fetch single resource
 */
export function useApiSingle<T>(endpoint: string, enabled = true) {
  return useQuery({
    queryKey: [endpoint],
    queryFn: () => apiFetch<T>(endpoint),
    enabled,
  });
}

/**
 * Flexible mutation hook
 */
export function useApiMutation<TData, TVariables = any>(
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST',
  invalidateKeys: string[] = []
) {
  return useMutation<TData, Error, { endpoint: string; data?: TVariables }>({
    mutationFn: ({ endpoint, data }) =>
      apiFetch<TData>(endpoint, {
        method,
        body: data ? JSON.stringify(data) : undefined,
      }),

    onSuccess: () => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
  });
}

/**
 * Action tied to a fixed endpoint
 */
export function useApiAction<TData, TVariables = any>(
  endpoint: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST',
  invalidateKeys: string[] = []
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: (data) =>
      apiFetch<TData>(endpoint, {
        method,
        body: data ? JSON.stringify(data) : undefined,
      }),

    onSuccess: () => {
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
  });
}