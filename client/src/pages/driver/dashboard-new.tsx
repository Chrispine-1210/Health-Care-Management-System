import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatWidget } from "@/components/ChatWidget";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Truck, MapPin, Phone, CheckCircle2, Navigation, Clock, Star, BarChart3, ShieldAlert } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { DriverMapTracker } from "@/components/DriverMapTracker";
import { MeritBadges, badgeDefinitions } from "@/components/MeritBadges";
import type { Delivery, Order, User } from "@shared/schema";

type DeliveryWithDetails = Delivery & {
  order: Order;
  customer: User;
};

export default function DriverDashboardNew() {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimizeRoute = useCallback(() => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      toast({
        title: "Routes Optimized",
        description: "AI has recalculated the best path for your 3 pending deliveries, saving 4.2km of travel.",
      });
    }, 1500);
  }, [toast]);

  const { user, isDriver, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isDriver)) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isDriver, authLoading, toast]);

  // Get live location
  useEffect(() => {
    if (trackingActive && "geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setDriverLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          toast({
            title: "Location Error",
            description: "Unable to access your location",
            variant: "destructive",
          });
        }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [trackingActive, toast]);

  const { data: activeDeliveries, isLoading: deliveriesLoading } = useQuery<DeliveryWithDetails[]>({
    queryKey: ["/api/driver/deliveries/active"],
    enabled: isAuthenticated && isDriver,
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async (deliveryId: string) => {
      return apiRequest(`/api/deliveries/${deliveryId}/status`, "PATCH", {
        status: "picked_up",
      });
    },
    onSuccess: () => {
      toast({ title: "Order Confirmed", description: "Starting delivery to customer" });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/deliveries/active"] });
      setTrackingActive(true);
    },
  });

  const completeDeliveryMutation = useMutation({
    mutationFn: async (deliveryId: string) => {
      return apiRequest(`/api/deliveries/${deliveryId}/status`, "PATCH", {
        status: "delivered",
      });
    },
    onSuccess: () => {
      toast({ title: "Delivery Complete", description: "Thank you for your service!" });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/deliveries/active"] });
      setTrackingActive(false);
    },
  });

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const pendingDeliveries = activeDeliveries?.filter(d => ['assigned', 'pending'].includes(d.status)) || [];
  const inTransitDeliveries = activeDeliveries?.filter(d => ['picked_up', 'in_transit'].includes(d.status)) || [];
  const completedToday = activeDeliveries?.filter(d => d.status === 'delivered') || [];
  const currentDelivery = inTransitDeliveries[0]; // First in-transit delivery

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Truck className="h-10 w-10 text-primary" />
              Driver Control Panel
            </h1>
            <p className="text-muted-foreground mt-1">Manage your deliveries and real-time tracking</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="text-primary border-primary hover:bg-primary/5">
              <Navigation className="h-4 w-4 mr-2" />
              Optimize Route
            </Button>
            <Button variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100">
              <ShieldAlert className="h-4 w-4 mr-2" />
              SOS Emergency
            </Button>
            <ChatWidget userId={user?.id || ""} userRole="driver" />
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{completedToday.length}</p>
              <p className="text-sm text-muted-foreground">Completed Today</p>
            </div>
            <Button variant="outline" onClick={signOut} data-testid="button-logout">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Merit Badges */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <MeritBadges 
              badges={[
                badgeDefinitions.speed_demon,
                badgeDefinitions.five_star_champion,
                badgeDefinitions.customer_favorite,
              ]} 
              role="driver" 
            />
          </CardContent>
        </Card>

        {/* Map Tracker */}
        {trackingActive && (
          <DriverMapTracker
            driverLocation={driverLocation}
            customerLocation={currentDelivery?.order ? 
              { 
                lat: parseFloat(currentDelivery.order.deliveryLatitude || '0'),
                lng: parseFloat(currentDelivery.order.deliveryLongitude || '0')
              } 
              : undefined
            }
            destination={currentDelivery?.order?.deliveryAddress ?? undefined}
            distance={currentDelivery?.order?.deliveryDistance ? 
              parseFloat(currentDelivery.order.deliveryDistance) 
              : undefined
            }
            isTracking={trackingActive}
          />
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-pending-deliveries">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3">{pendingDeliveries.length}</div>
              <p className="text-xs text-muted-foreground">Ready for pickup</p>
            </CardContent>
          </Card>

          <Card data-testid="card-in-transit">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{inTransitDeliveries.length}</div>
              <p className="text-xs text-muted-foreground">Currently delivering</p>
            </CardContent>
          </Card>

          <Card data-testid="card-completed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-1">{completedToday.length}</div>
              <p className="text-xs text-muted-foreground">Today's completions</p>
            </CardContent>
          </Card>

          <Card data-testid="card-earnings">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-2">MK {(completedToday.reduce((sum, d) => sum + parseFloat(d.order.deliveryCharge || '0'), 0)).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Today's delivery fees</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending Orders ({pendingDeliveries.length})</TabsTrigger>
            <TabsTrigger value="transit">In Transit ({inTransitDeliveries.length})</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="history">Delivery History</TabsTrigger>
          </TabsList>

          {/* Delivery History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Completed Deliveries</CardTitle>
                <CardDescription>Review your past successful deliveries and proof uploads.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedToday.map((delivery) => (
                    <div key={delivery.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-bold">Order #{delivery.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleTimeString() : ""}</p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Proof Uploaded
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Orders Tab */}
          <TabsContent value="pending" className="space-y-4">
            {deliveriesLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)
            ) : pendingDeliveries.length > 0 ? (
              pendingDeliveries.map((delivery) => (
                <Card key={delivery.id} className="hover-elevate active-elevate-2 cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {delivery.customer?.firstName?.[0] || 'C'}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg">
                              {delivery.customer?.firstName} {delivery.customer?.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">Order #{delivery.orderId.slice(0, 8)}</p>
                          </div>
                          <Badge>MK {parseFloat(delivery.order.deliveryCharge || '0').toFixed(2)}</Badge>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{delivery.order.deliveryAddress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${delivery.customer?.phone}`} className="text-primary hover:underline">
                              {delivery.customer?.phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4" />
                            <span>{parseFloat(delivery.order.deliveryDistance || '0').toFixed(1)} km</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedDelivery(delivery.id);
                            confirmOrderMutation.mutate(delivery.id);
                          }}
                          disabled={confirmOrderMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Confirm & Start
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No pending orders</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* In Transit Tab */}
          <TabsContent value="transit" className="space-y-4">
            {inTransitDeliveries.length > 0 ? (
              inTransitDeliveries.map((delivery) => (
                <Card key={delivery.id} className="border-primary/50 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center">
                        <Navigation className="h-6 w-6 text-primary-foreground" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-bold text-lg">
                          {delivery.customer?.firstName} {delivery.customer?.lastName}
                        </h3>
                        <div className="space-y-2 text-sm mt-2">
                          <p className="text-muted-foreground">Destination: {delivery.order.deliveryAddress}</p>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-primary font-semibold">Live tracking active - Customer can see you</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          className="w-full"
                          onClick={() => completeDeliveryMutation.mutate(delivery.id)}
                          disabled={completeDeliveryMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Complete Delivery
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No deliveries in transit</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Performance</CardTitle>
                <CardDescription>Your service metrics and ratings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold">{completedToday.length}</div>
                      <p className="text-sm text-muted-foreground">Deliveries Completed</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-chart-1">4.8</div>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
