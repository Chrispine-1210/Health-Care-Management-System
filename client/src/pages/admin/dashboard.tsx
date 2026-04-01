import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Branch, ContentItem, Delivery, Order, Product, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useConversations } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleWorkspacePanel } from "@/components/RoleWorkspacePanel";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChatWidget } from "@/components/ChatWidget";
import {
  Bell,
  Building2,
  ClipboardList,
  FileText,
  MessageSquareText,
  Package,
  Pill,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

type DashboardStats = {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalUsers: number;
  totalProducts: number;
  lowStockItems: number;
  expiringItems: number;
  pendingPrescriptions: number;
  activeDeliveries: number;
  revenueGrowth: number;
  ordersGrowth: number;
};

type ManagedOrder = Order & {
  customer?: User | null;
  delivery?: Delivery | null;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const { isAdmin, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Redirecting to login.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 500);
    }
  }, [authLoading, isAdmin, isAuthenticated, setLocation, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: orders = [] } = useQuery<ManagedOrder[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/admin/branches"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: content = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: oversightConversations = [] } = useConversations({
    scope: "all",
    enabled: isAuthenticated && isAdmin,
  });

  const orderMonitor = useMemo(() => {
    const pending = orders.filter((order) => order.status === "pending").length;
    const ready = orders.filter((order) => order.status === "ready").length;
    const inTransit = orders.filter((order) => order.status === "in_transit").length;
    const delivered = orders.filter((order) => order.status === "delivered").length;

    return {
      pending,
      ready,
      inTransit,
      delivered,
    };
  }, [orders]);

  const publishedContent = useMemo(
    () => content.filter((item) => item.status === "published").length,
    [content],
  );

  const unreadConversationCount = useMemo(
    () => oversightConversations.filter((conversation) => conversation.unread > 0).length,
    [oversightConversations],
  );

  const completionRate = useMemo(() => {
    if (orders.length === 0) {
      return 0;
    }

    return Math.round((orderMonitor.delivered / orders.length) * 100);
  }, [orderMonitor.delivered, orders.length]);

  const activeBranchRate = useMemo(() => {
    if (branches.length === 0) {
      return 0;
    }

    return Math.round((branches.filter((branch) => branch.isActive).length / branches.length) * 100);
  }, [branches]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const quickActions = [
    {
      title: "Branch Control",
      description: "Open branch coverage, routing, and operational ownership.",
      href: "/admin/branches",
      icon: Building2,
      count: branches.length,
    },
    {
      title: "Product Catalog",
      description: "Manage approved medicines, catalog quality, and availability.",
      href: "/admin/products",
      icon: Pill,
      count: products.length,
    },
    {
      title: "Content Studio",
      description: "Publish marketing and educational content across the platform.",
      href: "/admin/content",
      icon: FileText,
      count: publishedContent,
    },
    {
      title: "Order Control",
      description: "Review live transactions and move problem orders quickly.",
      href: "/admin/orders",
      icon: ClipboardList,
      count: orders.length,
    },
    {
      title: "Ops Inbox",
      description: "Monitor role-to-role chat and operational escalations.",
      href: "/admin/inbox",
      icon: Bell,
      count: unreadConversationCount,
    },
    {
      title: "User Roles",
      description: "Inspect access boundaries, roles, and branch assignment.",
      href: "/admin/users",
      icon: Users,
      count: stats?.totalUsers ?? 0,
    },
  ];

  return (
    <DashboardShell
      role="Admin"
      title="Platform Control Center"
      description="Monitor chats and transactions, control branches, products, and content, manage order flow, and track performance across the entire Thandizo platform."
      actions={(
        <>
          <Button variant="outline" onClick={() => setLocation("/admin/branches")}>
            <Building2 className="mr-2 h-4 w-4" />
            Branch Control
          </Button>
          <Button variant="outline" onClick={() => setLocation("/admin/inbox")}>
            <Bell className="mr-2 h-4 w-4" />
            Ops Inbox
          </Button>
          <ChatWidget />
          <Button variant="outline" onClick={signOut} data-testid="button-logout">
            Sign Out
          </Button>
        </>
      )}
    >

      <RoleWorkspacePanel
        role="admin"
        title="Admin Routes"
        description="Open the governance, fulfillment, content, and monitoring routes assigned to the admin role."
        excludeKeys={["dashboard"]}
        limit={6}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Revenue"
          value={
            statsLoading
              ? <Skeleton className="h-8 w-24" />
              : `MK ${(stats?.totalRevenue ?? 0).toLocaleString()}`
          }
          description={`Growth ${stats?.revenueGrowth ?? 0}% month over month`}
          tone="success"
        />
        <MetricCard
          title="Orders"
          value={statsLoading ? <Skeleton className="h-8 w-20" /> : stats?.totalOrders ?? 0}
          description={`Growth ${stats?.ordersGrowth ?? 0}% month over month`}
          tone="info"
        />
        <MetricCard
          title="Pending Prescriptions"
          value={statsLoading ? <Skeleton className="h-8 w-14" /> : stats?.pendingPrescriptions ?? 0}
          description="Clinical items still awaiting pharmacist review"
          tone="warning"
        />
        <MetricCard
          title="Active Deliveries"
          value={statsLoading ? <Skeleton className="h-8 w-12" /> : stats?.activeDeliveries ?? 0}
          description="Orders currently moving through driver workflows"
          tone="info"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active Branches"
          value={branches.filter((branch) => branch.isActive).length}
          description={`of ${branches.length} registered branches`}
        />
        <MetricCard
          title="Low Stock Risk"
          value={stats?.lowStockItems ?? 0}
          description="Inventory items below reorder threshold"
          tone="danger"
        />
        <MetricCard
          title="Published Content"
          value={publishedContent}
          description="Live pages and marketing articles"
          tone="success"
        />
        <MetricCard
          title="Unread Chat Escalations"
          value={unreadConversationCount}
          description="Conversations requiring oversight attention"
          tone="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Control Actions</CardTitle>
          <CardDescription>
            Direct entry points into the systems the admin role is responsible for governing.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => (
            <div key={action.href} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{action.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                </div>
                <action.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="outline">{action.count}</Badge>
                <Button variant="outline" size="sm" onClick={() => setLocation(action.href)}>
                  Open
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Oversight</CardTitle>
            <CardDescription>High-level movement across pending, ready, in-transit, and delivered orders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="mt-2 text-2xl font-bold text-amber-600">{orderMonitor.pending}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="mt-2 text-2xl font-bold text-sky-600">{orderMonitor.ready}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">In Transit</p>
                <p className="mt-2 text-2xl font-bold text-blue-600">{orderMonitor.inTransit}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">{orderMonitor.delivered}</p>
              </div>
            </div>

            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[order.customer?.firstName, order.customer?.lastName]
                          .filter(Boolean)
                          .join(" ") || order.customer?.email || "Unknown customer"}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      MK {Number(order.total || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat Oversight</CardTitle>
            <CardDescription>Conversation visibility across customers, pharmacists, staff, and drivers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {oversightConversations.length > 0 ? (
              oversightConversations.slice(0, 8).map((conversation) => (
                <div key={conversation.conversationId} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{conversation.participantName}</p>
                        <Badge variant="outline">{conversation.participantRole}</Badge>
                        {conversation.online && <Badge className="bg-emerald-600">Online</Badge>}
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {conversation.unread > 0 && <Badge>{conversation.unread}</Badge>}
                        <Button variant="outline" size="sm" onClick={() => setLocation("/admin/inbox")}>
                          <MessageSquareText className="mr-2 h-4 w-4" />
                          View
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <MessageSquareText className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-medium">No conversations to monitor yet</p>
                <p className="text-sm text-muted-foreground">
                  Live chat activity will appear here as teams coordinate across the platform.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Snapshot</CardTitle>
          <CardDescription>Platform-wide indicators that help the admin keep the system healthy.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery Completion</span>
              <span className="font-semibold">{completionRate}%</span>
            </div>
            <Progress value={completionRate} />
            <p className="text-sm text-muted-foreground">
              Percentage of total orders that have already reached successful delivery.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Branch Availability</span>
              <span className="font-semibold">{activeBranchRate}%</span>
            </div>
            <Progress value={activeBranchRate} />
            <p className="text-sm text-muted-foreground">
              Share of registered branches that are active and ready for operational assignment.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Revenue Momentum</span>
              <span className="font-semibold">{stats?.revenueGrowth ?? 0}%</span>
            </div>
            <Progress value={Math.max(Math.min((stats?.revenueGrowth ?? 0) + 50, 100), 0)} />
            <p className="text-sm text-muted-foreground">
              Relative measure of commercial growth to help prioritize expansion and attention.
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
