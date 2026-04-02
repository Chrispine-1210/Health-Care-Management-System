import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { CustomerNav } from "@/components/CustomerNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, Package, Truck, MapPin, Clock } from "lucide-react";
import { useParams } from "wouter";
import type { Order } from "@shared/schema";

export default function OrderDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { id } = useParams();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["/api/orders", id],
    enabled: isAuthenticated && !authLoading && !!id,
  });

  const getStatusColor = (status: string) => {
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
  };

  const getStatusStep = (status: string) => {
    const steps = ['pending', 'confirmed', 'processing', 'ready', 'in_transit', 'delivered'];
    return steps.indexOf(status) + 1;
  };

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 flex items-center gap-2">
          <a href="/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </a>
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Header */}
            <Card data-testid={`order-detail-${order.id}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-2xl">
                  Order #{order.id.slice(0, 8)}
                </CardTitle>
                <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.status}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace(/_/g, ' ')}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-medium">
                      {format(new Date(order.createdAt!), 'PPp')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Total</p>
                    <p className="font-bold text-primary text-lg">
                      MK {parseFloat(order.total).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Order Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['pending', 'confirmed', 'processing', 'ready', 'in_transit', 'delivered'].map((step, index) => (
                    <div key={step} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold ${
                          getStatusStep(order.status) > index
                            ? 'bg-primary text-primary-foreground'
                            : getStatusStep(order.status) === index + 1
                            ? 'bg-chart-2 text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {getStatusStep(order.status) > index ? '✓' : index + 1}
                        </div>
                        {index < 5 && (
                          <div className={`h-12 w-1 my-1 ${
                            getStatusStep(order.status) > index + 1 ? 'bg-primary' : 'bg-muted'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold capitalize">{step.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {step === 'pending' && 'Order received'}
                          {step === 'confirmed' && 'Order confirmed by pharmacy'}
                          {step === 'processing' && 'Preparing your order'}
                          {step === 'ready' && 'Ready for pickup or delivery'}
                          {step === 'in_transit' && 'On the way to you'}
                          {step === 'delivered' && 'Successfully delivered'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            {order.deliveryAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Address</p>
                    <p className="font-medium">{order.deliveryAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-medium">{order.deliveryCity}</p>
                  </div>
                  {order.deliveryDistance && (
                    <div>
                      <p className="text-sm text-muted-foreground">Distance</p>
                      <p className="font-medium">{parseFloat(order.deliveryDistance).toFixed(2)} km</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Subtotal</span>
                    <span className="font-medium">MK {parseFloat(order.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Delivery Charge</span>
                    <span className="font-medium">MK {parseFloat(order.deliveryCharge || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">MK {parseFloat(order.total).toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Method</p>
                    <p className="font-medium capitalize">{order.paymentMethod?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                      {order.paymentStatus?.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Order not found</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
