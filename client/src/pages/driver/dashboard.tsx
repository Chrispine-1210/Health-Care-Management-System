import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Truck, MapPin, Clock, CheckCircle2, Package, Phone, MessageSquare, User, AlertCircle } from "lucide-react";
import type { Delivery, Order, User as UserType } from "@shared/schema";

type DeliveryWithDetails = Delivery & {
  order: Order;
  customer: UserType;
};

export default function DriverDashboard() {
  const { toast } = useToast();
  const { user, isDriver, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isDriver)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isDriver, authLoading, toast]);

  const { data: activeDeliveries, isLoading: deliveriesLoading } = useQuery<DeliveryWithDetails[]>({
    queryKey: ["/api/driver/deliveries/active"],
    enabled: isAuthenticated && isDriver,
  });

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { className: "bg-chart-3 text-white", label: "Pending" },
      assigned: { className: "bg-chart-2 text-white", label: "Assigned" },
      picked_up: { className: "bg-primary text-primary-foreground", label: "Picked Up" },
      in_transit: { className: "bg-primary text-primary-foreground", label: "In Transit" },
      delivered: { className: "bg-chart-1 text-white", label: "Delivered" },
      failed: { className: "bg-destructive text-destructive-foreground", label: "Failed" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const deliveriesByStatus = {
    pending: activeDeliveries?.filter(d => d.status === 'pending' || d.status === 'assigned') || [],
    inTransit: activeDeliveries?.filter(d => d.status === 'picked_up' || d.status === 'in_transit') || [],
    completed: activeDeliveries?.filter(d => d.status === 'delivered') || [],
    failed: activeDeliveries?.filter(d => d.status === 'failed') || [],
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Deliveries</h1>
        <p className="text-muted-foreground">Manage your assigned deliveries and customer details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="card-pending">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Pickup</CardTitle>
            <Clock className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-3">{deliveriesByStatus.pending.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to collect</p>
          </CardContent>
        </Card>

        <Card data-testid="card-in-transit">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{deliveriesByStatus.inTransit.length}</div>
            <p className="text-xs text-muted-foreground mt-1">On the way to customers</p>
          </CardContent>
        </Card>

        <Card data-testid="card-completed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-1">{deliveriesByStatus.completed.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully completed</p>
          </CardContent>
        </Card>

        <Card data-testid="card-failed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{deliveriesByStatus.failed.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Failed deliveries</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-delivery-queue">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Assigned Orders</CardTitle>
              <CardDescription>Customers waiting for their deliveries</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {deliveriesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4 border border-border rounded-md">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              ))}
            </div>
          ) : activeDeliveries && activeDeliveries.length > 0 ? (
            <div className="space-y-4">
              {activeDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-md hover-elevate active-elevate-2"
                  data-testid={`delivery-item-${delivery.id}`}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={delivery.customer?.profileImageUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {delivery.customer?.firstName?.[0] || 'C'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {delivery.customer?.firstName} {delivery.customer?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Order #{delivery.orderId.slice(0, 8)} • MK {parseFloat(delivery.order.total).toFixed(2)}
                        </p>
                      </div>
                      {getStatusBadge(delivery.status)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{delivery.order.deliveryAddress || 'Address TBD'}</span>
                      </div>

                      {delivery.customer?.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{delivery.customer.phone}</span>
                        </div>
                      )}

                      {delivery.order.deliveryDistance && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Truck className="w-4 h-4" />
                          <span>{parseFloat(delivery.order.deliveryDistance).toFixed(1)} km away</span>
                        </div>
                      )}

                      {delivery.deliveryNotes && (
                        <div className="flex items-start gap-2 text-muted-foreground mt-2 p-2 bg-muted rounded">
                          <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{delivery.deliveryNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <a href={`/driver/deliveries/${delivery.id}`}>
                      <Button size="sm" data-testid={`button-update-${delivery.id}`}>
                        Update Status
                      </Button>
                    </a>
                    {delivery.customer?.phone && (
                      <a href={`tel:${delivery.customer.phone}`}>
                        <Button size="sm" variant="outline">
                          Call
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No deliveries assigned yet</p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
