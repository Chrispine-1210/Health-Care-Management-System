import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, unwrapApiResponse } from '@/lib/queryClient';

export function useOrders() {
  return useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return unwrapApiResponse(await res.json());
    },
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create order');
      return unwrapApiResponse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
  });
}

export function useUpdateOrder() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update order');
      return unwrapApiResponse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
  });
}
