import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

/**
 * Unified API hook for common operations
 */

export function useApiList<T>(endpoint: string, enabled = true) {
  return useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
      return res.json() as Promise<T[]>;
    },
    enabled,
  });
}

export function useApiSingle<T>(endpoint: string, enabled = true) {
  return useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
      const data = await res.json();
      return data.data || data as T;
    },
    enabled,
  });
}

export function useApiMutation<TData, TError = unknown>(method: 'POST' | 'PATCH' | 'DELETE' = 'POST') {
  return useMutation<TData, TError, { endpoint: string; data?: any }>({
    mutationFn: async ({ endpoint, data }) => {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
  });
}

export function useApiAction(endpoint: string, method: 'POST' | 'PATCH' | 'DELETE' = 'POST') {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return res.json();
    },
  });
}
