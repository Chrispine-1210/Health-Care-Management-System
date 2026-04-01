import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Branch, Order, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingBag } from "lucide-react";

type ManagedOrder = Order & {
  customer: User | null;
};

export default function StaffOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery<ManagedOrder[]>({
    queryKey: ["/api/orders"],
  });
  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });
  const assignedBranch = branches.find((branch) => branch.id === user?.branchId);

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
        description: "The customer-facing order status has been updated.",
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

  if (isLoading) {
    return <div>Loading orders...</div>;
  }

  const pendingOrders = orders.filter((order) => order.status === "pending");
  const inFlightOrders = orders.filter((order) =>
    ["confirmed", "processing", "ready", "in_transit"].includes(order.status),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground">
          Review incoming demand, approve orders, and keep fulfillment moving accurately.
        </p>
        {assignedBranch ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Showing orders for {assignedBranch.name}.
          </p>
        ) : (
          <p className="mt-2 text-xs text-destructive">
            No branch assigned. Orders cannot be scoped correctly.
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Needs Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Fulfillment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-600">{inFlightOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Manage customer and POS transactions across the pharmacy.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{order.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    {order.customer
                      ? `${order.customer.firstName || ""} ${order.customer.lastName || ""}`.trim()
                      : "Guest / POS"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.paymentMethod || "POS"}</Badge>
                  </TableCell>
                  <TableCell>MK {parseFloat(order.total).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        order.status === "confirmed"
                          ? "bg-green-600"
                          : order.status === "pending"
                            ? "bg-yellow-500"
                            : order.status === "in_transit"
                              ? "bg-sky-600"
                              : "bg-gray-500"
                      }
                    >
                      {order.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(order.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => rejectMutation.mutate(order.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end text-muted-foreground">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
