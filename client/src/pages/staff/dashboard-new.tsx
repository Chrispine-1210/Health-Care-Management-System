import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Branch, ContentItem, Delivery, Order, Product, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleWorkspacePanel } from "@/components/RoleWorkspacePanel";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChatWidget } from "@/components/ChatWidget";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  MessageSquareText,
  Pill,
  ShoppingCart,
  Truck,
  XCircle,
} from "lucide-react";

type OrderApproval = Order & {
  customer?: User | null;
  requiresApproval: boolean;
  approvalReason?: string;
};

type ManagedOrder = Order & {
  customer?: User | null;
  delivery?: Delivery | null;
};

export default function StaffDashboardNew() {
  const { toast } = useToast();
  const { user, isStaff, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isStaff)) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Redirecting to login.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 500);
    }
  }, [authLoading, isAuthenticated, isStaff, setLocation, toast]);

  const { data: pendingApprovals = [], isLoading: approvalsLoading } = useQuery<OrderApproval[]>({
    queryKey: ["/api/staff/approvals"],
    enabled: isAuthenticated && isStaff,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<ManagedOrder[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && isStaff,
  });

  const { data: oversightConversations = [] } = useConversations({
    scope: "all",
    enabled: isAuthenticated && isStaff,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
    enabled: isAuthenticated && isStaff,
  });
  const assignedBranch = branches.find((branch) => branch.id === user?.branchId);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated && isStaff,
  });

  const { data: contentItems = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/public"],
    enabled: isAuthenticated && isStaff,
  });

  const approveOrderMutation = useMutation({
    mutationFn: (orderId: string) => apiRequest("PATCH", `/api/orders/${orderId}/approve`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/staff/approvals"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order approved",
        description: "The order has moved into the fulfillment workflow.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectOrderMutation = useMutation({
    mutationFn: (orderId: string) => apiRequest("PATCH", `/api/orders/${orderId}/reject`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/staff/approvals"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order rejected",
        description: "The transaction was removed from the active queue.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fulfillmentOrders = useMemo(
    () => orders.filter((order) => ["confirmed", "processing", "ready", "in_transit"].includes(order.status)),
    [orders],
  );

  const readyForDispatch = useMemo(
    () => orders.filter((order) => order.status === "ready"),
    [orders],
  );

  const activeDeliveries = useMemo(
    () => orders.filter((order) => order.status === "in_transit"),
    [orders],
  );

  const completionRate = useMemo(() => {
    if (orders.length === 0) {
      return 0;
    }

    return Math.round((orders.filter((order) => order.status === "delivered").length / orders.length) * 100);
  }, [orders]);

  const approvalRate = useMemo(() => {
    const reviewedCount = orders.filter((order) => order.status !== "pending").length;
    if (orders.length === 0) {
      return 0;
    }

    return Math.round((reviewedCount / orders.length) * 100);
  }, [orders]);

  const activeBranchCount = useMemo(
    () => branches.filter((branch) => branch.isActive).length,
    [branches],
  );

  const activeProductCount = useMemo(
    () => products.filter((product) => product.isActive).length,
    [products],
  );

  const publishedContentCount = useMemo(
    () => contentItems.filter((item) => item.status === "published").length,
    [contentItems],
  );

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const renderLoadingStack = () =>
    Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-32 w-full" />);

  return (
    <DashboardShell
      role="Staff"
      title="Operations Fulfillment Hub"
      description="Monitor chats and transactions, keep order approvals and fulfillment moving, and maintain visibility across branches, products, content, and platform performance."
      meta={
        assignedBranch ? (
          <Badge variant="outline">Branch scope: {assignedBranch.name}</Badge>
        ) : (
          <Badge variant="destructive">No branch assigned</Badge>
        )
      }
      actions={(
        <>
          <Button variant="outline" onClick={() => setLocation("/staff/pos")}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            POS Transactions
          </Button>
          <Button variant="outline" onClick={() => setLocation("/staff/orders")}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Fulfillment Queue
          </Button>
          <ChatWidget />
          <Button variant="outline" onClick={signOut} data-testid="button-logout">
            Sign Out
          </Button>
        </>
      )}
    >

      <div className="rounded-2xl border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Logged in as</p>
        <p className="text-lg font-semibold">
          {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Staff"}
        </p>
        <p className="text-sm text-muted-foreground">
          Focused on order approvals, transaction monitoring, fulfillment, and operations chat oversight.
        </p>
      </div>

      <RoleWorkspacePanel
        role="staff"
        title="Staff Routes"
        description="Move between approval, fulfillment, POS, inbox, and performance tools built for staff operations."
        excludeKeys={["dashboard"]}
        limit={4}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Pending Approvals"
          value={pendingApprovals.length}
          description="Orders still waiting for staff action"
          tone="warning"
          testId="card-pending-approvals"
        />
        <MetricCard
          title="Ready for Dispatch"
          value={readyForDispatch.length}
          description="Fulfillment items prepared for the next step"
          tone="info"
        />
        <MetricCard
          title="Active Deliveries"
          value={activeDeliveries.length}
          description="Transactions currently in transit"
          tone="success"
        />
        <MetricCard
          title="Chats Monitored"
          value={oversightConversations.length}
          description="Live conversations visible to operations"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Branches Visible"
          value={activeBranchCount}
          description={`of ${branches.length} registered branches active`}
          tone="info"
        />
        <MetricCard
          title="Active Products"
          value={activeProductCount}
          description="Catalog items currently available for operations"
        />
        <MetricCard
          title="Published Content"
          value={publishedContentCount}
          description="Live content assets affecting the platform"
          tone="success"
        />
      </div>

      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-5">
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="fulfillment">Fulfillment</TabsTrigger>
          <TabsTrigger value="chat">Chat Monitor</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Approval Queue</CardTitle>
              <CardDescription>
                Review new transactions and decide whether they move into the active fulfillment flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvalsLoading ? (
                renderLoadingStack()
              ) : pendingApprovals.length > 0 ? (
                pendingApprovals.map((order) => (
                  <div key={order.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                          <Badge className="bg-amber-500">Pending</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Customer:{" "}
                          {[order.customer?.firstName, order.customer?.lastName]
                            .filter(Boolean)
                            .join(" ") || order.customer?.email || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total: MK {Number(order.total || 0).toLocaleString()} •{" "}
                          {order.deliveryAddress || "Counter collection"}
                        </p>
                        {order.approvalReason && (
                          <p className="text-sm text-amber-700">{order.approvalReason}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          onClick={() => rejectOrderMutation.mutate(order.id)}
                          disabled={approveOrderMutation.isPending || rejectOrderMutation.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          onClick={() => approveOrderMutation.mutate(order.id)}
                          disabled={approveOrderMutation.isPending || rejectOrderMutation.isPending}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">No approvals are waiting</p>
                  <p className="text-sm text-muted-foreground">
                    New orders will appear here as soon as they need staff review.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fulfillment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fulfillment Pipeline</CardTitle>
              <CardDescription>
                Track active transactions as they move from approval into dispatch and delivery.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ordersLoading ? (
                renderLoadingStack()
              ) : fulfillmentOrders.length > 0 ? (
                fulfillmentOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                          <Badge variant="outline">{order.status}</Badge>
                          {order.status === "ready" && <Badge className="bg-sky-600">Dispatch next</Badge>}
                          {order.status === "in_transit" && (
                            <Badge className="bg-emerald-600">Driver active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {[order.customer?.firstName, order.customer?.lastName]
                            .filter(Boolean)
                            .join(" ") || order.customer?.email || "Unknown customer"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.deliveryAddress || "Counter"} • MK {Number(order.total || 0).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => setLocation("/staff/orders")}>
                        Open Queue
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <Truck className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">No active fulfillment items</p>
                  <p className="text-sm text-muted-foreground">
                    Confirmed, ready, and in-transit orders will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operations Chat Monitor</CardTitle>
              <CardDescription>
                Monitor the live conversations that affect transactions, fulfillment, and delivery continuity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {oversightConversations.length > 0 ? (
                oversightConversations.map((conversation) => (
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
                        <p className="mt-2 text-xs text-muted-foreground">
                          Updated {new Date(conversation.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {conversation.unread > 0 && <Badge>{conversation.unread} unread</Badge>}
                        <Button variant="outline" size="sm" onClick={() => setLocation("/staff/inbox")}>
                          <MessageSquareText className="mr-2 h-4 w-4" />
                          Open Inbox
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <MessageSquareText className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">No operations chats yet</p>
                  <p className="text-sm text-muted-foreground">
                    Role-to-role chat activity will appear here as soon as the team starts coordinating.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branch, Product, and Content Oversight</CardTitle>
              <CardDescription>
                Operational visibility into the branch footprint, approved catalog, and live content affecting customer and fulfillment workflows.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Branch Network</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Monitor branch readiness and active locations supporting orders.
                    </p>
                  </div>
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-4 text-2xl font-bold text-sky-600">{activeBranchCount}</p>
                <p className="text-xs text-muted-foreground">Active branches in the live network</p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Product Catalog</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Keep an eye on what customers and staff can currently transact against.
                    </p>
                  </div>
                  <Pill className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-4 text-2xl font-bold text-primary">{activeProductCount}</p>
                <p className="text-xs text-muted-foreground">Approved and active medicines</p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Live Content</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track public-facing guidance and platform content already published.
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-4 text-2xl font-bold text-emerald-600">{publishedContentCount}</p>
                <p className="text-xs text-muted-foreground">Published customer-facing content items</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance Snapshot</CardTitle>
              <CardDescription>
                Track the operational health of approvals, fulfillment, and delivery movement.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Approval Progress</span>
                  <span className="font-semibold">{approvalRate}%</span>
                </div>
                <Progress value={approvalRate} />
                <p className="text-sm text-muted-foreground">
                  Measures how much of the total order volume has moved beyond pending review.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold">{completionRate}%</span>
                </div>
                <Progress value={completionRate} />
                <p className="text-sm text-muted-foreground">
                  Reflects how much of the order pipeline has already reached delivery completion.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Live Oversight</span>
                  <span className="font-semibold">{oversightConversations.length} chats</span>
                </div>
                <Progress value={Math.min(oversightConversations.length * 20, 100)} />
                <p className="text-sm text-muted-foreground">
                  Highlights how much active conversation context the operations team is monitoring.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
