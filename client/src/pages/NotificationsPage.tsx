import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  ConversationSummary,
  NotificationItem,
  useConversations,
  useMarkNotificationAsRead,
  useNotifications,
} from "@/hooks/useNotifications";
import { Bell, CheckCircle2, FileText, MessageSquareText, Package, Truck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CustomerNav } from "@/components/CustomerNav";
import { canMonitorOperations } from "@shared/roleCapabilities";

type OrderSummary = {
  id: string;
  status: string;
  paymentStatus: string;
  total: string;
  customer?: { firstName?: string | null; lastName?: string | null } | null;
};

export default function NotificationsPage() {
  const { user, isCustomer } = useAuth();
  const canMonitorOps = canMonitorOperations(user?.role);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const { data: oversightConversations = [] } = useConversations({
    scope: "all",
    enabled: canMonitorOps,
  });
  const { data: orders = [] } = useQuery<OrderSummary[]>({
    queryKey: ["/api/orders"],
    enabled: canMonitorOps,
  });

  const filteredNotifications =
    filter === "unread" ? notifications.filter((notification) => !notification.read) : notifications;
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const orderMonitor = useMemo(() => {
    const pending = orders.filter((order) => order.status === "pending").length;
    const inTransit = orders.filter((order) => order.status === "in_transit").length;
    const completed = orders.filter((order) => order.status === "delivered").length;

    return {
      total: orders.length,
      pending,
      inTransit,
      completed,
    };
  }, [orders]);

  const escalationCount = useMemo(
    () => oversightConversations.filter((conversation) => conversation.unread > 0).length,
    [oversightConversations],
  );

  if (isLoading) {
    return <LoadingSpinner text="Loading notifications..." />;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "order":
        return <Package className="h-4 w-4 text-blue-600" />;
      case "delivery":
        return <Truck className="h-4 w-4 text-green-600" />;
      case "prescription":
        return <FileText className="h-4 w-4 text-violet-600" />;
      case "chat":
        return <MessageSquareText className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Inbox</p>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay on top of delivery, order, prescription, and chat activity.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
          >
            Unread
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Marked Read</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">
              {notifications.length - unreadCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {canMonitorOps && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Operations Monitor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Orders</p>
                  <p className="mt-2 text-2xl font-bold">{orderMonitor.total}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="mt-2 text-2xl font-bold text-amber-600">{orderMonitor.pending}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">In Transit</p>
                  <p className="mt-2 text-2xl font-bold text-sky-600">{orderMonitor.inTransit}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600">{orderMonitor.completed}</p>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Conversation Escalations</p>
                    <p className="text-sm text-muted-foreground">
                      Admin and staff oversight across role-to-role messaging activity.
                    </p>
                  </div>
                  <Badge>{escalationCount} active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chat Oversight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {oversightConversations.length > 0 ? (
                  oversightConversations.slice(0, 8).map((conversation: ConversationSummary) => (
                    <div key={conversation.conversationId} className="rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{conversation.participantName}</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {conversation.lastMessage}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Updated {new Date(conversation.updatedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="outline">{conversation.participantRole}</Badge>
                          {conversation.unread > 0 && <Badge>{conversation.unread}</Badge>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center">
                    <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" />
                    <p className="font-medium">No active conversations yet</p>
                    <p className="text-sm text-muted-foreground">
                      New customer, pharmacist, staff, and driver chats will appear here.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-medium">You are all caught up</p>
                <p className="text-sm text-muted-foreground">
                  New updates will appear here as your orders, chats, and prescriptions progress.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification: NotificationItem) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                    notification.read ? "bg-muted/30" : "border-primary/25 bg-primary/5"
                  }`}
                >
                  <div className="mt-1 rounded-full bg-background p-2 shadow-sm">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={notification.read ? "text-muted-foreground" : "font-medium"}>
                        {notification.title}
                      </p>
                      <Badge variant="outline">{notification.type}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={markAsRead.isPending}
                      onClick={() => markAsRead.mutate(notification.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isCustomer) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNav />
        <main className="container mx-auto px-4 py-8">{content}</main>
      </div>
    );
  }

  return <div className="space-y-6 p-6">{content}</div>;
}
