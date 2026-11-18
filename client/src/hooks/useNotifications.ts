import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, resolveApiUrl } from '@/lib/queryClient';
import { getAuthToken } from '@/lib/authSession';

export interface ConversationSummary {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  updatedAt?: string;
  unread: number;
  online: boolean;
}

/**
 * Notifications hook - Real-time notifications
 */

export function useNotifications() {
  return useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      const res = await fetch(resolveApiUrl('/api/notifications'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(resolveApiUrl(`/api/notifications/${notificationId}/read`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });
}

export function useConversations() {
  return useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const res = await fetch(resolveApiUrl('/api/conversations'), {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async (data: { recipientId: string; content: string }) => {
      const res = await fetch(resolveApiUrl('/api/messages'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
}
