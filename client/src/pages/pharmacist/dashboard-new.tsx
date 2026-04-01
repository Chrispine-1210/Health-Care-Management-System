import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Branch, Delivery, Order, Prescription, Product, StockBatch, User } from "@shared/schema";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleWorkspacePanel } from "@/components/RoleWorkspacePanel";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChatWidget } from "@/components/ChatWidget";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  FileCheck,
  MessageSquareText,
  ShieldAlert,
  XCircle,
} from "lucide-react";

type InventoryBatch = StockBatch & {
  product?: Product | null;
  branch?: Branch | null;
};

type ManagedOrder = Order & {
  customer?: User | null;
  delivery?: Delivery | null;
};

export default function PharmacistDashboardNew() {
  const { toast } = useToast();
  const { user, isPharmacist, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isPharmacist)) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Redirecting to login.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 500);
    }
  }, [authLoading, isAuthenticated, isPharmacist, setLocation, toast]);

  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions/pending"],
    enabled: isAuthenticated && isPharmacist,
  });

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<InventoryBatch[]>({
    queryKey: ["/api/admin/inventory"],
    enabled: isAuthenticated && isPharmacist,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<ManagedOrder[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && isPharmacist,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
    enabled: isAuthenticated && isPharmacist,
  });

  const assignedBranch = branches.find((branch) => branch.id === user?.branchId);

  const { data: conversations = [] } = useConversations({
    enabled: isAuthenticated && isPharmacist,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      apiRequest("PATCH", `/api/prescriptions/${id}/review`, {
        status,
        reviewNotes:
          status === "approved"
            ? "Pharmacist review completed. Clinically safe for fulfillment."
            : "Pharmacist review blocked. Follow-up required before fulfillment.",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/prescriptions/pending"] });
      toast({
        title: "Prescription updated",
        description: "The clinical decision has been recorded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Review failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handoffMutation = useMutation({
    mutationFn: (orderId: string) =>
      apiRequest("PATCH", `/api/orders/${orderId}`, {
        status: "ready",
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Handoff approved",
        description: "Operations can now move this medicine into fulfillment.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Handoff update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clinicalFlags = useMemo(
    () =>
      prescriptions.filter(
        (prescription) =>
          (prescription.patientAllergies?.length ?? 0) > 0 ||
          (prescription.patientConditions?.length ?? 0) > 0,
      ),
    [prescriptions],
  );

  const lowStockItems = useMemo(
    () => inventory.filter((batch) => batch.quantity < 50),
    [inventory],
  );

  const expiringSoon = useMemo(() => {
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() + 3);

    return inventory.filter((batch) => {
      const expiryDate = new Date(batch.expiryDate);
      return expiryDate >= new Date() && expiryDate <= threshold;
    });
  }, [inventory]);

  const handoffQueue = useMemo(
    () => orders.filter((order) => ["confirmed", "processing"].includes(order.status)),
    [orders],
  );

  const readyOrders = useMemo(
    () => orders.filter((order) => order.status === "ready"),
    [orders],
  );

  const customerSupportThreads = useMemo(
    () => conversations.filter((conversation) => conversation.participantRole === "customer"),
    [conversations],
  );

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const renderLoadingStack = () =>
    Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36 w-full" />);

  return (
    <DashboardShell
      role="Pharmacist"
      title="Clinical Operations Dashboard"
      description="Review prescriptions and allergy risks, keep stock safe, approve medicine handoff to operations, and support customers in chat without crossing into driver or admin work."
      meta={
        assignedBranch ? (
          <Badge variant="outline">Branch scope: {assignedBranch.name}</Badge>
        ) : (
          <Badge variant="destructive">No branch assigned</Badge>
        )
      }
      actions={(
        <>
          <Button variant="outline" onClick={() => setLocation("/pharmacist/prescriptions")}>
            <FileCheck className="mr-2 h-4 w-4" />
            Prescription Queue
          </Button>
          <Button variant="outline" onClick={() => setLocation("/pharmacist/inventory")}>
            <Boxes className="mr-2 h-4 w-4" />
            Inventory Risk
          </Button>
          <ChatWidget />
          <Button variant="outline" onClick={signOut} data-testid="button-logout">
            Sign Out
          </Button>
        </>
      )}
    >

      <RoleWorkspacePanel
        role="pharmacist"
        title="Pharmacist Routes"
        description="Navigate the clinical review, inventory, support, and performance tools reserved for pharmacists."
        excludeKeys={["dashboard"]}
        limit={5}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Pending Review"
          value={prescriptions.length}
          description="Prescriptions waiting for pharmacist action"
          tone="warning"
          testId="card-pending-prescriptions"
        />
        <MetricCard
          title="Clinical Flags"
          value={clinicalFlags.length}
          description="Allergy or condition review required"
          tone="danger"
        />
        <MetricCard
          title="Low Stock Risk"
          value={lowStockItems.length}
          description="Batches below the safe threshold"
          tone="danger"
        />
        <MetricCard
          title="Handoff Queue"
          value={handoffQueue.length}
          description="Orders waiting for pharmacist release"
          tone="info"
        />
        <MetricCard
          title="Customer Support Threads"
          value={customerSupportThreads.length}
          description="Active customer conversations"
          tone="success"
        />
      </div>

      <Tabs defaultValue="clinical" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-4">
          <TabsTrigger value="clinical">Clinical Review</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Risk</TabsTrigger>
          <TabsTrigger value="handoff">Operations Handoff</TabsTrigger>
          <TabsTrigger value="support">Customer Support</TabsTrigger>
        </TabsList>

        <TabsContent value="clinical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prescription and Allergy Review</CardTitle>
              <CardDescription>
                Review new submissions with allergy and condition context before approving medicine.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {prescriptionsLoading ? (
                renderLoadingStack()
              ) : prescriptions.length > 0 ? (
                prescriptions.slice(0, 6).map((prescription) => (
                  <div
                    key={prescription.id}
                    className="rounded-xl border p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            Prescription #{prescription.id.slice(0, 8)}
                          </p>
                          <Badge variant="outline">{prescription.status.replace(/_/g, " ")}</Badge>
                          {(prescription.patientAllergies?.length ?? 0) > 0 && (
                            <Badge className="bg-rose-600">Allergy flag</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Submitted {new Date(prescription.createdAt!).toLocaleString()}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-lg border bg-muted/30 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Allergies
                            </p>
                            <p className="mt-1 text-sm">
                              {prescription.patientAllergies?.join(", ") || "No allergy history recorded"}
                            </p>
                          </div>
                          <div className="rounded-lg border bg-muted/30 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Conditions
                            </p>
                            <p className="mt-1 text-sm">
                              {prescription.patientConditions?.join(", ") || "No chronic conditions recorded"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/pharmacist/prescriptions/${prescription.id}`)}
                        >
                          Open Detail
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            reviewMutation.mutate({ id: prescription.id, status: "approved" })
                          }
                          disabled={reviewMutation.isPending}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            reviewMutation.mutate({ id: prescription.id, status: "rejected" })
                          }
                          disabled={reviewMutation.isPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">No prescriptions are waiting right now</p>
                  <p className="text-sm text-muted-foreground">
                    Newly uploaded prescriptions will appear here for pharmacist review.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Low-Stock Risk</CardTitle>
                <CardDescription>Items closest to stock-out and branch-level replenishment pressure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {inventoryLoading ? (
                  renderLoadingStack()
                ) : lowStockItems.length > 0 ? (
                  lowStockItems.slice(0, 6).map((batch) => (
                    <div key={batch.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{batch.product?.name || "Unknown product"}</p>
                          <p className="text-sm text-muted-foreground">
                            {batch.branch?.name || "Unknown branch"} • Batch {batch.batchNumber}
                          </p>
                        </div>
                        <Badge variant="destructive">{batch.quantity} units</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <ShieldAlert className="mx-auto mb-3 h-8 w-8 text-primary" />
                    <p className="font-medium">No low-stock items</p>
                    <p className="text-sm text-muted-foreground">
                      Current stock levels are within the pharmacist safety threshold.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expiry Watch</CardTitle>
                <CardDescription>Medication batches expiring in the next 90 days.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {inventoryLoading ? (
                  renderLoadingStack()
                ) : expiringSoon.length > 0 ? (
                  expiringSoon.slice(0, 6).map((batch) => (
                    <div key={batch.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{batch.product?.name || "Unknown product"}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires {new Date(batch.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{batch.quantity} units</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" />
                    <p className="font-medium">No urgent expiry risk</p>
                    <p className="text-sm text-muted-foreground">
                      Batches approaching expiry will appear here for pharmacist action.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="handoff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approve Medicine Handoff</CardTitle>
              <CardDescription>
                Release clinically cleared orders to operations after pharmacist checks are complete.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordersLoading ? (
                renderLoadingStack()
              ) : handoffQueue.length > 0 ? (
                handoffQueue.map((order) => (
                  <div key={order.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                          <Badge variant="outline">{order.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Customer:{" "}
                          {[order.customer?.firstName, order.customer?.lastName]
                            .filter(Boolean)
                            .join(" ") || order.customer?.email || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total: MK {Number(order.total || 0).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => handoffMutation.mutate(order.id)}
                        disabled={handoffMutation.isPending}
                      >
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Approve Handoff
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <ClipboardCheck className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">No orders are waiting for pharmacist release</p>
                  <p className="text-sm text-muted-foreground">
                    Confirmed and processing orders will appear here once they need handoff approval.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Released to Operations</CardTitle>
              <CardDescription>Orders already marked ready for staff and dispatch handling.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {readyOrders.length > 0 ? (
                readyOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveryAddress || "No delivery address"} • {order.deliveryCity || "Counter"}
                      </p>
                    </div>
                    <Badge className="bg-emerald-600">Ready</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Orders marked ready by the pharmacist will appear here.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Support Threads</CardTitle>
              <CardDescription>
                Keep direct customer support inside the pharmacist workflow for medication guidance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {customerSupportThreads.length > 0 ? (
                customerSupportThreads.map((conversation) => (
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation("/pharmacist/inbox")}
                        >
                          <MessageSquareText className="mr-2 h-4 w-4" />
                          Open Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <MessageSquareText className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">No customer chats yet</p>
                  <p className="text-sm text-muted-foreground">
                    Pharmacist support conversations will appear here as customers reach out.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold">Need to continue a medication conversation?</p>
                <p className="text-sm text-muted-foreground">
                  Use the pharmacist chat tools to guide customers without leaving the clinical workflow.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setLocation("/pharmacist/inbox")}>
                  Open Inbox
                </Button>
                <Button onClick={() => setLocation("/pharmacist/prescriptions")}>
                  Review Next Prescription
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
