import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  id: string;
  sender: string;
  senderRole: string;
  message: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  userId?: string;
  userRole?: string;
  recipientRole?: string;
  recipientId?: string;
  onlinUsers?: Array<{ id: string; name: string; role: string; status: "online" | "offline" }>;
}

export function ChatWidget({ userId, userRole, recipientRole, recipientId, onlinUsers = [] }: ChatWidgetProps) {
  const { user, isDriver, isPharmacist, isCustomer, isStaff, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "System",
      senderRole: "system",
      message: "Welcome to Thandizo Pharmacy Chat",
      timestamp: new Date(),
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedRecipient, setSelectedRecipient] = useState(recipientId || "");

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      driver: "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100",
      pharmacist: "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100",
      customer: "bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100",
      staff: "bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100",
      admin: "bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100",
    };
    return roleColors[role] || "bg-gray-100 dark:bg-gray-800";
  };

  const getCurrentRole = () => {
    if (isDriver) return "driver";
    if (isPharmacist) return "pharmacist";
    if (isCustomer) return "customer";
    if (isStaff) return "staff";
    if (isAdmin) return "admin";
    return "user";
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: `${user?.firstName} ${user?.lastName}`,
      senderRole: getCurrentRole(),
      message: newMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  const availableRecipients = onlinUsers.filter((u) => u.id !== user?.id);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        variant="default"
        className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-lg data-testid-chat-toggle"
        data-testid="button-chat-toggle"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-96 shadow-xl flex flex-col data-testid-chat-widget">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Thandizo Chat</CardTitle>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6"
          data-testid="button-chat-close"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden">
        {/* Online Users */}
        {availableRecipients.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">ONLINE USERS</p>
            <div className="flex flex-wrap gap-1">
              {availableRecipients.map((user) => (
                <Badge
                  key={user.id}
                  variant="outline"
                  className={`cursor-pointer ${getRoleColor(user.role)}`}
                  onClick={() => setSelectedRecipient(user.id)}
                  data-testid={`badge-user-${user.id}`}
                >
                  {user.name} ({user.role})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 border rounded-md p-3">
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-sm ${
                  msg.sender === user?.firstName ? "text-right" : "text-left"
                }`}
                data-testid={`message-${msg.id}`}
              >
                <div
                  className={`inline-block px-3 py-2 rounded-lg max-w-xs ${
                    msg.senderRole === "system"
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      : msg.sender === user?.firstName
                        ? "bg-primary text-primary-foreground"
                        : `${getRoleColor(msg.senderRole)}`
                  }`}
                >
                  {msg.senderRole !== "system" && (
                    <p className="text-xs font-semibold mb-1">{msg.sender}</p>
                  )}
                  <p className="break-words">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Type message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            className="text-sm"
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
