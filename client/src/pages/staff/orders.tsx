import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag } from "lucide-react";
import type { Order, User } from "@shared/schema";

export default function StaffOrders() {
  const { data: orders, isLoading } = useQuery<(Order & { customer: User | null })[]>({
    queryKey: ["/api/orders"] as const,
  });

  if (isLoading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground">Monitor and process all customer and POS orders.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>View and manage all transactions across the pharmacy.</CardDescription>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest/POS'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.paymentMethod || 'POS'}</Badge>
                  </TableCell>
                  <TableCell>MK {parseFloat(order.total).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={
                      order.status === 'confirmed' ? 'bg-green-600' :
                      order.status === 'pending' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }>
                      {order.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
