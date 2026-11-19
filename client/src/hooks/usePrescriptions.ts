import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, resolveApiUrl } from '@/lib/queryClient';
import { getAuthToken } from '@/lib/authSession';

export function usePrescriptions() {
  return useQuery({
    queryKey: ['/api/prescriptions'],
    queryFn: async () => {
      const res = await fetch(resolveApiUrl('/api/prescriptions'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch prescriptions');
      return res.json();
    },
  });
}

export function useUploadPrescription() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(resolveApiUrl('/api/prescriptions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to upload prescription');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
    },
  });
}

export function useApprovePrescription() {
  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const res = await fetch(resolveApiUrl(`/api/prescriptions/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ status: approved ? 'approved' : 'rejected' }),
      });
      if (!res.ok) throw new Error('Failed to update prescription');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
    },
  });
}
