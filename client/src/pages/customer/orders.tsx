import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { CustomerNav } from "@/components/CustomerNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Package, ChevronRight } from "lucide-react";
import { useCallback, useMemo } from "react";
import type { Order } from "@shared/schema";

export default function OrdersPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && !authLoading,
  });

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pending': return 'bg-chart-3 text-white';
      case 'confirmed': return 'bg-chart-2 text-white';
      case 'processing': return 'bg-primary text-primary-foreground';
      case 'ready': return 'bg-chart-1 text-white';
      case 'in_transit': return 'bg-primary text-primary-foreground';
      case 'delivered': return 'bg-green-600 text-white';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-64" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <a key={order.id} href={`/orders/${order.id}`}>
                <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`order-card-${order.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        Order #{order.id.slice(0, 8)}
                      </CardTitle>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-4" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Order Date</p>
                        <p className="font-medium">
                          {format(new Date(order.createdAt!), 'PP')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-bold text-primary text-lg">
                          MK {parseFloat(order.total).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Status</p>
                        <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                          {order.paymentStatus?.replace(/_/g, ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    {order.deliveryAddress && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Delivery to: <span className="font-medium text-foreground">{order.deliveryCity}</span></p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No orders yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start shopping to place your first order
              </p>
              <a href="/shop">
                <Button>Start Shopping</Button>
              </a>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
