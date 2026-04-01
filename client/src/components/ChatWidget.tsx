import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useChatContacts,
  useConversationMessages,
  useConversations,
  useMarkConversationAsRead,
  useSendMessage,
} from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatWidgetProps {
  userId?: string;
  userRole?: string;
  recipientRole?: string;
  recipientId?: string;
  onlinUsers?: Array<{ id: string; name: string; role: string; status: "online" | "offline" }>;
}

const roleColors: Record<string, string> = {
  driver: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
  pharmacist: "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100",
  customer: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  staff: "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100",
  admin: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
};

export function ChatWidget({ recipientId }: ChatWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState(recipientId ?? "");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: contacts = [] } = useChatContacts();
  const { data: conversations = [] } = useConversations();
  const { data: messages = [] } = useConversationMessages(selectedConversationId, {
    enabled: isOpen && !!selectedConversationId,
  });
  const markConversationAsRead = useMarkConversationAsRead();
  const sendMessage = useSendMessage();

  useEffect(() => {
    if (recipientId) {
      setSelectedConversationId(recipientId);
    }
  }, [recipientId]);

  useEffect(() => {
    if (!selectedConversationId) {
      const fallbackConversation =
        recipientId || conversations[0]?.conversationId || contacts[0]?.id || "";
      if (fallbackConversation) {
        setSelectedConversationId(fallbackConversation);
      }
    }
  }, [contacts, conversations, recipientId, selectedConversationId]);

  useEffect(() => {
    if (isOpen && selectedConversationId) {
      markConversationAsRead.mutate({ conversationId: selectedConversationId, scope: "mine" });
    }
  }, [isOpen, selectedConversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const selectedConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.conversationId === selectedConversationId),
    [conversations, selectedConversationId],
  );

  const selectedContact = useMemo(
    () =>
      contacts.find((contact) => contact.id === selectedConversationId) ||
      contacts.find((contact) => contact.id === selectedConversation?.participantId),
    [contacts, selectedConversation, selectedConversationId],
  );

  const onlineContacts = useMemo(
    () => contacts.filter((contact) => contact.status === "online"),
    [contacts],
  );

  const handleSendMessage = () => {
    if (!draft.trim() || !selectedConversationId) {
      return;
    }

    sendMessage.mutate(
      {
        recipientId: selectedConversationId,
        content: draft,
      },
      {
        onSuccess: () => {
          setDraft("");
        },
      },
    );
  };

  if (!user) {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        variant="default"
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg"
        data-testid="button-chat-toggle"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 flex h-[36rem] w-[26rem] max-w-[calc(100vw-2rem)] flex-col shadow-2xl">
      <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-lg">Team Chat</CardTitle>
          <p className="text-sm text-muted-foreground">
            Message the right role without leaving your dashboard.
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 shrink-0"
          data-testid="button-chat-close"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Online Now
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {onlineContacts.length > 0 ? (
              onlineContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setSelectedConversationId(contact.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition hover:opacity-90 ${
                    roleColors[contact.role] ?? "bg-muted"
                  } ${selectedConversationId === contact.id ? "ring-2 ring-primary/40" : ""}`}
                  data-testid={`badge-user-${contact.id}`}
                >
                  {contact.name}
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No active teammates online right now.</p>
            )}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[auto,1fr,auto] gap-3">
          <div className="rounded-lg border">
            <div className="border-b px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Recent Conversations
              </p>
            </div>
            <ScrollArea className="h-28">
              <div className="space-y-1 p-2">
                {conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.conversationId}
                      type="button"
                      onClick={() => setSelectedConversationId(conversation.conversationId)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        selectedConversationId === conversation.conversationId
                          ? "border-primary bg-primary/5"
                          : "border-transparent hover:border-border hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{conversation.participantName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {conversation.lastMessage}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant="outline"
                            className={roleColors[conversation.participantRole] ?? "bg-muted"}
                          >
                            {conversation.participantRole}
                          </Badge>
                          {conversation.unread > 0 && (
                            <Badge className="bg-primary text-primary-foreground">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-sm text-muted-foreground">
                    Select an online user to start the first conversation.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex min-h-0 flex-col rounded-lg border">
            <div className="border-b px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {selectedContact?.name || selectedConversation?.participantName || "Choose a user"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedContact?.role || selectedConversation?.participantRole || "No role selected"}
                  </p>
                </div>
                {selectedContact?.status && (
                  <Badge variant={selectedContact.status === "online" ? "default" : "secondary"}>
                    {selectedContact.status}
                  </Badge>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1 px-3 py-3">
              <div className="space-y-3">
                {selectedConversationId ? (
                  messages.length > 0 ? (
                    messages.map((message) => {
                      const isMine = message.senderId === user.id;

                      return (
                        <div
                          key={message.id}
                          className={isMine ? "text-right" : "text-left"}
                          data-testid={`message-${message.id}`}
                        >
                          <div
                            className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 ${
                              isMine
                                ? "bg-primary text-primary-foreground"
                                : roleColors[message.senderRole] ?? "bg-muted"
                            }`}
                          >
                            <p className="mb-1 text-xs font-semibold">
                              {isMine ? "You" : message.senderName}
                            </p>
                            <p className="break-words text-sm">{message.content}</p>
                            <p className="mt-1 text-[11px] opacity-75">
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                      No messages yet. Send the first one to open the conversation.
                    </div>
                  )
                ) : (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    Pick a role contact above to start chatting.
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={
                selectedConversationId ? "Type a message..." : "Select a user to start chatting"
              }
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={!selectedConversationId || sendMessage.isPending}
              data-testid="input-chat-message"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!selectedConversationId || !draft.trim() || sendMessage.isPending}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
