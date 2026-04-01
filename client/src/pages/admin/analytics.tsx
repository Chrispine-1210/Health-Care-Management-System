import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Appointment, Branch, ContentItem, User } from "@shared/schema";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Building2, DollarSign, Package, Stethoscope, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AdminInsightsService, type ManagedOrder, type StockBatchWithDetails } from "@/lib/adminInsights";

type AdminStats = {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalUsers: number;
  totalProducts: number;
  lowStockItems: number;
  expiringItems: number;
  pendingPrescriptions: number;
  activeDeliveries: number;
};

const roleColors = ["#2563eb", "#0f766e", "#f59e0b", "#7c3aed", "#ef4444"];

export default function AdminAnalytics() {
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

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

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const { data: contentItems = [], isLoading: contentLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content"],
  });

  const loading =
    statsLoading ||
    ordersLoading ||
    usersLoading ||
    branchesLoading ||
    stockLoading ||
    appointmentsLoading ||
    contentLoading;

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId),
    [branches, selectedBranchId],
  );

  const scopedBranches = useMemo(
    () =>
      selectedBranchId ? branches.filter((branch) => branch.id === selectedBranchId) : branches,
    [branches, selectedBranchId],
  );

  const scopedAppointments = useMemo(
    () =>
      selectedBranchId
        ? appointments.filter((appointment) => appointment.branchId === selectedBranchId)
        : appointments,
    [appointments, selectedBranchId],
  );

  const orderSummary = useMemo(() => AdminInsightsService.buildOrderSummary(orders), [orders]);
  const inventorySummary = useMemo(
    () => AdminInsightsService.buildInventorySummary(stockBatches),
    [stockBatches],
  );
  const roleDistribution = useMemo(
    () => {
      if (!selectedBranchId) {
        return AdminInsightsService.buildRoleDistribution(users);
      }

      const activeCustomerIds = new Set(orders.map((order) => order.customerId));
      const branchUsers = users.filter(
        (user) => user.branchId === selectedBranchId && user.role !== "customer",
      );

      return [
        { name: "Customers", value: activeCustomerIds.size },
        { name: "Drivers", value: branchUsers.filter((user) => user.role === "driver").length },
        { name: "Pharmacists", value: branchUsers.filter((user) => user.role === "pharmacist").length },
        { name: "Staff", value: branchUsers.filter((user) => user.role === "staff").length },
      ].filter((entry) => entry.value > 0);
    },
    [orders, selectedBranchId, users],
  );
  const dailySeries = useMemo(() => AdminInsightsService.buildDailyOrderSeries(orders), [orders]);
  const branchPerformance = useMemo(
    () => AdminInsightsService.buildBranchPerformance(scopedBranches, orders, stockBatches),
    [orders, scopedBranches, stockBatches],
  );
  const appointmentSummary = useMemo(
    () => AdminInsightsService.buildAppointmentSummary(scopedAppointments),
    [scopedAppointments],
  );
  const contentSummary = useMemo(
    () => AdminInsightsService.buildContentSummary(contentItems),
    [contentItems],
  );

  const customerCount = useMemo(() => {
    if (selectedBranchId) {
      return new Set(orders.map((order) => order.customerId)).size;
    }

    return stats?.totalCustomers ?? users.filter((user) => user.role === "customer").length;
  }, [orders, selectedBranchId, stats?.totalCustomers, users]);

  const operationalCount = useMemo(() => {
    if (selectedBranchId) {
      return users.filter(
        (user) => user.branchId === selectedBranchId && user.role !== "customer",
      ).length;
    }

    return users.filter((user) => user.role !== "customer").length;
  }, [selectedBranchId, users]);

  const totalUsers = selectedBranchId
    ? customerCount + operationalCount
    : stats?.totalUsers ?? users.length;

  const revenueTotal = selectedBranchId
    ? orderSummary.revenue
    : Number(stats?.totalRevenue ?? orderSummary.revenue);

  const activeBranchCount = scopedBranches.filter((branch) => branch.isActive).length;
  const branchLabel = selectedBranch?.name ?? "All branches";

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
        <p className="text-muted-foreground">
          Cross-role commercial, clinical, inventory, and branch intelligence for admin oversight.
        </p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="branch-analytics-filter">Branch</Label>
          <select
            id="branch-analytics-filter"
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
          Showing {branchLabel} analytics for orders and inventory.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracked Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">MK {revenueTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {orderSummary.total} transactions moving through the platform
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role Coverage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {customerCount} customers, {operationalCount} operational users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Risk</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {inventorySummary.lowStock + inventorySummary.expiringSoon + inventorySummary.expired}
            </div>
            <p className="text-xs text-muted-foreground">
              {inventorySummary.lowStock} low stock, {inventorySummary.expiringSoon} expiring,{" "}
              {inventorySummary.expired} expired
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Care Pipeline</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{appointmentSummary.upcoming}</div>
            <p className="text-xs text-muted-foreground">
              Upcoming consultations with {stats?.pendingPrescriptions ?? 0} pending prescriptions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
        <Card>
          <CardHeader>
            <CardTitle>Order and Revenue Trend</CardTitle>
            <CardDescription>
              Seven-day transaction momentum across booking, delivery, and revenue capture.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="orders" allowDecimals={false} />
                <YAxis yAxisId="revenue" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "revenue"
                      ? `MK ${Number(value).toLocaleString()}`
                      : Number(value).toLocaleString()
                  }
                />
                <Legend />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke="#2563eb"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#16a34a"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Distribution</CardTitle>
            <CardDescription>
              Live coverage across customer demand and internal operational roles.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {roleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={roleColors[index % roleColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No role distribution data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Branch Throughput</CardTitle>
            <CardDescription>
              Where order volume, revenue, and low-stock risk are concentrating.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {branchPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchPerformance.slice(0, 6)} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={130} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="orders" fill="#2563eb" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="lowStock" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No branch analytics available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations Snapshot</CardTitle>
            <CardDescription>
              Admin-facing indicators for fulfillment, publishing, and branch health.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order Completion</p>
                  <p className="text-2xl font-bold text-emerald-600">{orderSummary.completionRate}%</p>
                </div>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {orderSummary.delivered} delivered, {orderSummary.active} active, {orderSummary.pending} pending
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Branch Activation</p>
                  <p className="text-2xl font-bold text-sky-600">
                    {activeBranchCount}/{scopedBranches.length}
                  </p>
                </div>
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {branchPerformance.filter((branch) => branch.activeOrders > 0).length} branches currently handling active orders
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Content Publishing</p>
                  <p className="text-2xl font-bold text-violet-600">{contentSummary.published}</p>
                </div>
                <Badge variant="outline">{contentSummary.views.toLocaleString()} views</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {contentSummary.draft} drafts and {contentSummary.archived} archived assets remain under admin control
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Consultation Flow</p>
                  <p className="text-2xl font-bold">{appointmentSummary.total}</p>
                </div>
                <Stethoscope className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {appointmentSummary.upcoming} upcoming, {appointmentSummary.completed} completed,{" "}
                {appointmentSummary.cancelled} cancelled or missed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
