import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, resolveApiUrl } from '@/lib/queryClient';
import { getAuthToken } from '@/lib/authSession';

export function useOrders() {
  return useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const res = await fetch(resolveApiUrl('/api/orders'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    },
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(resolveApiUrl('/api/orders'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create order');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
  });
}

export function useUpdateOrder() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(resolveApiUrl(`/api/orders/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update order');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
  });
}
