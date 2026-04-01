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
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, CheckCircle2 } from "lucide-react";
import type { Delivery, Order, User } from "@shared/schema";

type DeliveryWithDetails = Delivery & {
  order: Order;
  customer: User;
};

export default function DriverHistory() {
  const { data: history, isLoading } = useQuery<DeliveryWithDetails[]>({
    queryKey: ["/api/driver/deliveries/history"],
  });

  if (isLoading) return <div>Loading history...</div>;

  const deliveries = history || [];
  const totalEarnings = deliveries.reduce(
    (sum, delivery) => sum + parseFloat(delivery.order.deliveryCharge || "0"),
    0,
  );
  const todayCount = deliveries.filter((delivery) => {
    if (!delivery.deliveredAt) return false;
    const deliveredDate = new Date(delivery.deliveredAt).toDateString();
    return deliveredDate === new Date().toDateString();
  }).length;
  const averageEarnings = deliveries.length > 0 ? totalEarnings / deliveries.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Delivery History</h1>
        <p className="text-muted-foreground">Review your completed deliveries and earnings.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{deliveries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">MK {totalEarnings.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today / Avg Per Trip</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{todayCount} today</div>
            <p className="text-sm text-muted-foreground">
              MK {averageEarnings.toFixed(0).toLocaleString()} average per delivery
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed Deliveries</CardTitle>
          <CardDescription>A complete log of all successful drop-offs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id}>
                  <TableCell className="font-mono text-xs">#{delivery.orderId.slice(0, 8)}</TableCell>
                  <TableCell>{delivery.customer?.firstName} {delivery.customer?.lastName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{delivery.order.deliveryAddress}</TableCell>
                  <TableCell>MK {parseFloat(delivery.order.deliveryCharge || '0').toLocaleString()}</TableCell>
                  <TableCell>{delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleTimeString() : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> DELIVERED
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {deliveries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No completed deliveries in your history yet.
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
