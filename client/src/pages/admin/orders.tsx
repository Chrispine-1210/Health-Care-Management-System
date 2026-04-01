import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Branch, Delivery, Order, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, Clock, Search, ShoppingCart, Truck, XCircle } from "lucide-react";
import { format } from "date-fns";

type ManagedOrder = Order & {
  customer?: User | null;
  delivery?: Delivery | null;
};

const statusFilters = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "delivered", label: "Delivered" },
] as const;

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge className="bg-amber-500">Pending</Badge>;
    case "confirmed":
      return <Badge variant="outline">Confirmed</Badge>;
    case "processing":
      return <Badge className="bg-blue-600">Processing</Badge>;
    case "ready":
      return <Badge className="bg-sky-600">Ready</Badge>;
    case "in_transit":
      return <Badge className="bg-orange-600">In Transit</Badge>;
    case "delivered":
      return <Badge className="bg-emerald-600">Delivered</Badge>;
    case "cancelled":
      return <Badge variant="secondary">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]["value"]>("all");
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const { data: orders = [], isLoading } = useQuery<ManagedOrder[]>({
    queryKey: ["/api/orders", selectedBranchId],
    queryFn: async () => {
      const params = selectedBranchId ? `?branchId=${encodeURIComponent(selectedBranchId)}` : "";
      const res = await apiRequest("GET", `/api/orders${params}`);
      return res.json();
    },
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/admin/branches"],
  });

  const branchesById = useMemo(
    () => new Map(branches.map((branch) => [branch.id, branch])),
    [branches],
  );

  const approveMutation = useMutation({
    mutationFn: (orderId: string) => apiRequest("PATCH", `/api/orders/${orderId}/approve`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order approved",
        description: "The order has moved into the confirmed workflow.",
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

  const rejectMutation = useMutation({
    mutationFn: (orderId: string) => apiRequest("PATCH", `/api/orders/${orderId}/reject`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order rejected",
        description: "The order has been removed from active fulfillment.",
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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customerName = [order.customer?.firstName, order.customer?.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const branchName = branchesById.get(order.branchId)?.name?.toLowerCase() ?? "";
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerName.includes(searchQuery.toLowerCase()) ||
        branchName.includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? ["confirmed", "processing", "ready", "in_transit"].includes(order.status)
            : order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [branchesById, orders, searchQuery, statusFilter]);

  const orderSummary = useMemo(() => {
    const pending = orders.filter((order) => order.status === "pending").length;
    const active = orders.filter((order) =>
      ["confirmed", "processing", "ready", "in_transit"].includes(order.status),
    ).length;
    const delivered = orders.filter((order) => order.status === "delivered").length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    return { pending, active, delivered, revenue };
  }, [orders]);

  if (isLoading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Control</h1>
          <p className="text-muted-foreground">
            Monitor transactions, approve fulfillment movement, and keep the platform-wide order
            pipeline under admin control.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{orderSummary.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Fulfillment</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-600">{orderSummary.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{orderSummary.delivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracked Revenue</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">MK {orderSummary.revenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Order Oversight</CardTitle>
              <CardDescription>
                Search and control customer, branch, and fulfillment activity from one queue.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Branch</label>
                <select
                  className="h-9 rounded-md border bg-background px-3 text-sm"
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
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                  placeholder="Search by order, customer, or branch"
                />
              </div>
              <div className="flex gap-2">
                {statusFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={statusFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">#{order.id.slice(0, 8)}</span>
                        <span className="text-xs text-muted-foreground">
                          {order.createdAt ? format(new Date(order.createdAt), "MMM d, HH:mm") : "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {[order.customer?.firstName, order.customer?.lastName]
                        .filter(Boolean)
                        .join(" ") || order.customer?.email || "Unknown"}
                    </TableCell>
                    <TableCell>{branchesById.get(order.branchId)?.name || order.branchId}</TableCell>
                    <TableCell>MK {Number(order.total || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={order.paymentStatus === "completed" ? "default" : "outline"}>
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.delivery ? (
                        <Badge variant="outline">{order.delivery.status}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      {order.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectMutation.mutate(order.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(order.id)}
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Managed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                    No orders match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
