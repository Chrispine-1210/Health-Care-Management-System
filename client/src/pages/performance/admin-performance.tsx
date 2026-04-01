import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AuditLog, Branch, ContentItem, Prescription, User } from "@shared/schema";
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, ShieldCheck, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useConversations } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AdminInsightsService, type ManagedOrder, type StockBatchWithDetails } from "@/lib/adminInsights";

export default function AdminPerformance() {
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const { data: orders = [], isLoading: ordersLoading } = useQuery<ManagedOrder[]>({
    queryKey: ["/api/orders", selectedBranchId],
    queryFn: async () => {
      const params = selectedBranchId ? `?branchId=${encodeURIComponent(selectedBranchId)}` : "";
      const res = await apiRequest("GET", `/api/orders${params}`);
      return res.json();
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: branches = [], isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: ["/api/admin/branches"],
  });

  const { data: stockBatches = [], isLoading: stockLoading } = useQuery<StockBatchWithDetails[]>({
    queryKey: ["/api/admin/inventory", selectedBranchId],
    queryFn: async () => {
      const params = selectedBranchId ? `?branchId=${encodeURIComponent(selectedBranchId)}` : "";
      const res = await apiRequest("GET", `/api/admin/inventory${params}`);
      return res.json();
    },
  });

  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions/pending"],
  });

  const { data: contentItems = [], isLoading: contentLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const { data: auditLogs = [], isLoading: auditLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin/audit-logs"],
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useConversations({
    scope: "all",
  });

  const loading =
    ordersLoading ||
    usersLoading ||
    branchesLoading ||
    stockLoading ||
    prescriptionsLoading ||
    contentLoading ||
    auditLoading ||
    conversationsLoading;

  const scopedBranches = useMemo(
    () =>
      selectedBranchId ? branches.filter((branch) => branch.id === selectedBranchId) : branches,
    [branches, selectedBranchId],
  );

  const scopedUsers = useMemo(
    () => (selectedBranchId ? users.filter((user) => user.branchId === selectedBranchId) : users),
    [selectedBranchId, users],
  );

  const orderSummary = useMemo(() => AdminInsightsService.buildOrderSummary(orders), [orders]);
  const inventorySummary = useMemo(
    () => AdminInsightsService.buildInventorySummary(stockBatches),
    [stockBatches],
  );
  const roleDistribution = useMemo(
    () => AdminInsightsService.buildRoleDistribution(scopedUsers),
    [scopedUsers],
  );
  const conversationSummary = useMemo(
    () => AdminInsightsService.buildConversationSummary(conversations),
    [conversations],
  );
  const contentSummary = useMemo(
    () => AdminInsightsService.buildContentSummary(contentItems),
    [contentItems],
  );
  const deliverySummary = useMemo(() => AdminInsightsService.buildDeliverySummary(orders), [orders]);
  const prescriptionSummary = useMemo(
    () => AdminInsightsService.buildPrescriptionSummary(prescriptions),
    [prescriptions],
  );

  const branchActivationRate = scopedBranches.length
    ? Math.round(
        (scopedBranches.filter((branch) => branch.isActive).length / scopedBranches.length) * 100,
      )
    : 0;

  const teamCoverage = roleDistribution.filter((entry) => entry.name !== "Customers");
  const branchLabel = scopedBranches[0]?.name ?? "All branches";

  if (loading) {
    return <div>Loading performance...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Performance</h1>
        <p className="text-muted-foreground">
          Accountability, service quality, and risk management across the whole platform.
        </p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="branch-performance-filter">Branch</Label>
          <select
            id="branch-performance-filter"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={selectedBranchId}
            onChange={(event) => setSelectedBranchId(event.target.value)}
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {branchLabel} performance for orders and inventory.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivery Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{orderSummary.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {deliverySummary.completed} completed of {Math.max(deliverySummary.totalTracked, orderSummary.total)} tracked transactions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-600">{orderSummary.paymentCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Share of orders with completed payment state
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Branch Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{branchActivationRate}%</div>
            <p className="text-xs text-muted-foreground">
              {scopedBranches.filter((branch) => branch.isActive).length} active of {scopedBranches.length} branches
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unread Escalations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{conversationSummary.unread}</div>
            <p className="text-xs text-muted-foreground">
              {conversationSummary.highAttention} conversations need urgent admin attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Service Quality Scorecard</CardTitle>
            <CardDescription>
              Platform-level targets that show how operations are holding together.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              {
                label: "Order completion",
                value: orderSummary.completionRate,
                helper: `${orderSummary.delivered} delivered, ${orderSummary.pending} still pending`,
              },
              {
                label: "Branch availability",
                value: branchActivationRate,
                helper: `${scopedBranches.filter((branch) => branch.isActive).length} branches active right now`,
              },
              {
                label: "Payment completion",
                value: orderSummary.paymentCompletionRate,
                helper: `${orderSummary.total} total orders in the current performance pool`,
              },
              {
                label: "Content publication readiness",
                value: contentSummary.total
                  ? Math.round((contentSummary.published / contentSummary.total) * 100)
                  : 0,
                helper: `${contentSummary.published} published, ${contentSummary.draft} draft assets pending`,
              },
            ].map((metric) => (
              <div key={metric.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{metric.label}</span>
                  <span>{metric.value}%</span>
                </div>
                <Progress value={metric.value} />
                <p className="text-xs text-muted-foreground">{metric.helper}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational Risk Board</CardTitle>
            <CardDescription>
              Immediate issues that can impact fulfillment, clinical safety, and support continuity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                title: "Pending orders",
                value: orderSummary.pending,
                detail: "Orders waiting for staff or admin approval",
                icon: ClipboardList,
                tone: "text-amber-600",
              },
              {
                title: "Pending prescriptions",
                value: prescriptionSummary.pending,
                detail: "Clinical reviews still sitting in the pharmacist queue",
                icon: ShieldCheck,
                tone: "text-sky-600",
              },
              {
                title: "Inventory risk",
                value: inventorySummary.lowStock + inventorySummary.expiringSoon + inventorySummary.expired,
                detail: "Low stock, expiring soon, or expired batches requiring intervention",
                icon: AlertTriangle,
                tone: "text-destructive",
              },
              {
                title: "Active delivery movement",
                value: deliverySummary.active,
                detail: "Deliveries currently assigned, picked up, or in transit",
                icon: Activity,
                tone: "text-emerald-600",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                  <item.icon className={`h-5 w-5 ${item.tone}`} />
                </div>
                <p className={`mt-3 text-2xl font-bold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Team Coverage</CardTitle>
            <CardDescription>
              Operational headcount visible through the role boundaries running the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamCoverage.map((role) => (
              <div key={role.name} className="rounded-xl border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{role.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Users active in this operational role
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{role.value}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit and Accountability</CardTitle>
            <CardDescription>
              Recent recorded actions across governance, content, branch, and platform controls.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditLogs.length > 0 ? (
              auditLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="rounded-xl border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {log.entityType || "system"} {log.entityId ? `| ${log.entityId}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.userId ? <Badge variant="outline">{log.userId}</Badge> : <Badge variant="secondary">System</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-medium">Audit logs will appear here as admin actions are recorded.</p>
                <p className="text-sm text-muted-foreground">
                  The accountability surface is ready, but no recent events were returned by the backend.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
