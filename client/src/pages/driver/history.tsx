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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Delivery History</h1>
        <p className="text-muted-foreground">Review your completed deliveries and earnings.</p>
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
              {history?.map((delivery) => (
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
              {(!history || history.length === 0) && (
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
