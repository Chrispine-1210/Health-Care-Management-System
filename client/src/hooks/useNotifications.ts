import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, unwrapApiResponse } from "@/lib/queryClient";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string | number | Date;
};

export type ChatContact = {
  id: string;
  name: string;
  role: string;
  status: "online" | "offline";
};

export type ConversationSummary = {
  conversationId: string;
  participantId: string;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  unread: number;
  updatedAt: string | number | Date;
  messageCount: number;
  online: boolean;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  content: string;
  createdAt: string | number | Date;
  read: boolean;
};

function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getApiData<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const authHeaders = getAuthHeaders();
  if (authHeaders.Authorization) {
    headers.set("Authorization", authHeaders.Authorization);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed request: ${response.status}`);
  }

  return unwrapApiResponse<T>(await response.json());
}

export function useNotifications() {
  return useQuery({
    queryKey: ["/api/notifications"],
    queryFn: () => getApiData<NotificationItem[]>("/api/notifications"),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationAsRead() {
  return useMutation({
    mutationFn: (notificationId: string) =>
      getApiData<NotificationItem>(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });
}

export function useChatContacts() {
  return useQuery({
    queryKey: ["/api/chat/contacts"],
    queryFn: () => getApiData<ChatContact[]>("/api/chat/contacts"),
    refetchInterval: 15000,
  });
}

export function useConversations(options?: { scope?: "mine" | "all"; enabled?: boolean }) {
  const scope = options?.scope ?? "mine";

  return useQuery({
    queryKey: ["/api/conversations", scope],
    queryFn: () =>
      getApiData<ConversationSummary[]>(
        `/api/conversations${scope === "all" ? "?scope=all" : ""}`,
      ),
    enabled: options?.enabled ?? true,
    refetchInterval: 10000,
  });
}

export function useConversationMessages(
  conversationId?: string,
  options?: { scope?: "mine" | "all"; enabled?: boolean },
) {
  const scope = options?.scope ?? "mine";

  return useQuery({
    queryKey: ["/api/conversations/messages", conversationId, scope],
    queryFn: () =>
      getApiData<ChatMessage[]>(
        `/api/conversations/${conversationId}/messages${scope === "all" ? "?scope=all" : ""}`,
      ),
    enabled: Boolean(conversationId) && (options?.enabled ?? true),
    refetchInterval: 5000,
  });
}

export function useMarkConversationAsRead() {
  return useMutation({
    mutationFn: async ({
      conversationId,
      scope = "mine",
    }: {
      conversationId: string;
      scope?: "mine" | "all";
    }) =>
      getApiData<{ conversationId: string; read: boolean }>(
        `/api/conversations/${conversationId}/read${scope === "all" ? "?scope=all" : ""}`,
        {
          method: "PATCH",
        },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", variables.scope ?? "mine"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations/messages", variables.conversationId, variables.scope ?? "mine"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: (data: { recipientId: string; content: string }) =>
      getApiData<ChatMessage>("/api/messages", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_message, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations/messages", variables.recipientId, "mine"],
      });
    },
  });
}
