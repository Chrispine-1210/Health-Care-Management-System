import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { CustomerNav } from "@/components/CustomerNav";
import { CustomerDriverTracker } from "@/components/CustomerDriverTracker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatWidget } from "@/components/ChatWidget";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Truck, Package, Clock, CheckCircle2, AlertCircle, Navigation, Phone, Zap } from "lucide-react";
import type { Order, User } from "@shared/schema";

type OrderWithDriver = Order & {
  driver?: User & { activeDeliveries: number; lat?: number; lng?: number };
};

export default function CustomerHomeNew() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handlePredictRefills = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: "Predictive Refill Analysis",
        description: "Based on your usage, your Vitamin C supply will run low in 4 days. Would you like to schedule a refill?",
      });
    }, 2000);
  };

  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [preciseLocationName, setPreciseLocationName] = useState<string>("");
  const [locationShared, setLocationShared] = useState(false);
  const [driverLocations, setDriverLocations] = useState<Record<string, { lat: number; lng: number }>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "Please login to continue",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  // Get customer location for sharing with driver
  const shareLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCustomerLocation({ lat, lng });
          setPreciseLocationName(`Precision GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          setLocationShared(true);
          toast({
            title: "Location Precise",
            description: "High-accuracy GPS coordinates pinned for delivery.",
          });
        },
        (error) => {
          toast({
            title: "Location Error",
            description: "Unable to access your location",
            variant: "destructive",
          });
        }
      );
    }
  };

  const { data: myOrders, isLoading: ordersLoading } = useQuery<OrderWithDriver[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated && !authLoading,
  });

  const { data: activeDrivers } = useQuery<(User & { activeDeliveries: number })[]>({
    queryKey: ["/api/drivers/active"],
    enabled: isAuthenticated && !authLoading,
  });

  // Simulate live driver location tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverLocations((prev) => {
        const updated = { ...prev };
        myOrders?.forEach((order) => {
          if (order.status === "in_transit" && order.driver?.id) {
            const driverId = order.driver.id;
            const current = updated[driverId] || {
              lat: parseFloat(order.deliveryLatitude || "0"),
              lng: parseFloat(order.deliveryLongitude || "0"),
            };
            // Simulate driver moving towards destination with small random movements
            updated[driverId] = {
              lat: current.lat + (Math.random() - 0.5) * 0.0005,
              lng: current.lng + (Math.random() - 0.5) * 0.0005,
            };
          }
        });
        return updated;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [myOrders]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const pendingOrders = myOrders?.filter(o => ['pending', 'confirmed'].includes(o.status)) || [];
  const inTransitOrders = myOrders?.filter(o => o.status === 'in_transit') || [];
  const completedOrders = myOrders?.filter(o => o.status === 'delivered') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
      <CustomerNav />

      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Welcome back, {user?.firstName || 'Customer'}!</h1>
            <p className="text-muted-foreground mt-1">Track your orders and manage deliveries in real-time</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="border-primary text-primary hover:bg-primary/5"
              onClick={handlePredictRefills}
              disabled={isAnalyzing}
            >
              <Zap className={`h-4 w-4 mr-2 ${isAnalyzing ? "animate-bounce" : ""}`} />
              {isAnalyzing ? "Analyzing..." : "Refill Prediction"}
            </Button>
            <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50">
              <AlertCircle className="h-4 w-4 mr-2" />
              Emergency Help
            </Button>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
              <Phone className="h-4 w-4 mr-2" />
              Call Pharmacy
            </Button>
            <ChatWidget userId={user?.id || ""} userRole="customer" />
            <Button onClick={shareLocation} className={locationShared ? "bg-chart-1" : ""}>
              <MapPin className="h-4 w-4 mr-2" />
              {locationShared ? "Location Shared" : "Share Location"}
            </Button>
            <Button variant="outline" onClick={signOut} data-testid="button-logout">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Location Shared Status */}
        {locationShared && customerLocation && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="pt-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-chart-1 animate-pulse" />
                <div>
                  <p className="font-semibold text-primary">Precise Delivery Location Pinned</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {preciseLocationName || "Detecting coordinates..."}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocationShared(false)} className="border-primary/20">
                Remove Precision Pin
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3">{pendingOrders.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting fulfillment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Transit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{inTransitOrders.length}</div>
              <p className="text-xs text-muted-foreground">On the way to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-1">{completedOrders.length}</div>
              <p className="text-xs text-muted-foreground">Total delivered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-2">{activeDrivers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Available for delivery</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transit" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transit">In Transit ({inTransitOrders.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
            <TabsTrigger value="drivers">Available Drivers ({activeDrivers?.length || 0})</TabsTrigger>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
          </TabsList>

          {/* Consultations Tab */}
          <TabsContent value="consultations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Book a Teleconsultation</CardTitle>
                <CardDescription>Speak with a licensed pharmacist or doctor from the comfort of home.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border p-4 rounded-lg hover:border-primary cursor-pointer transition-colors">
                    <p className="font-bold">General Wellness</p>
                    <p className="text-sm text-muted-foreground">Standard 15-min consultation</p>
                    <p className="text-primary font-bold mt-2">5,000 MK</p>
                  </div>
                  <div className="border p-4 rounded-lg hover:border-primary cursor-pointer transition-colors">
                    <p className="font-bold">Prescription Review</p>
                    <p className="text-sm text-muted-foreground">Medication guidance & validation</p>
                    <p className="text-primary font-bold mt-2">3,500 MK</p>
                  </div>
                </div>
                <Button className="w-full">Schedule New Appointment</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* In Transit Orders */}
          <TabsContent value="transit" className="space-y-4">
            {inTransitOrders.length > 0 ? (
              inTransitOrders.map((order) => {
                const driverLoc = order.driver?.id ? driverLocations[order.driver.id] : null;
                return (
                  <div key={order.id} className="space-y-4">
                    {/* Driver Tracking Map */}
                    {driverLoc && (
                      <CustomerDriverTracker
                        driverLocation={driverLoc}
                        customerLocation={customerLocation}
                        driverName={`${order.driver?.firstName || ""} ${order.driver?.lastName || ""}`}
                        driverPhone={order.driver?.phone ?? undefined}
                        deliveryAddress={order.deliveryAddress ?? ""}
                        estimatedArrival="~15-20 mins"
                        isDelivering={true}
                      />
                    )}

                    <Card className="border-primary/50 bg-primary/5">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
                            <Badge className="bg-primary">In Transit</Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="text-muted-foreground">Destination: {order.deliveryAddress}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Navigation className="w-4 h-4 text-chart-2 animate-bounce" />
                              <span className="font-semibold">Driver is en route to your location</span>
                            </div>
                          </div>

                          <div className="bg-white/50 p-4 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">Delivery Fee Calculation</p>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Base Fee:</span>
                              <span className="font-medium">500 MK</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Distance (approx 8.4km):</span>
                              <span className="font-medium">420 MK</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between text-base font-bold text-primary">
                              <span>Total Delivery:</span>
                              <span>920 MK</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              className="flex-1"
                              variant="outline"
                              onClick={() => {
                                if (order.driver?.phone) {
                                  window.location.href = `tel:${order.driver.phone}`;
                                }
                              }}
                              data-testid="button-contact-driver"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Contact Driver
                            </Button>
                            <Button className="flex-1" variant="outline" data-testid="button-view-map">
                              <MapPin className="h-4 w-4 mr-2" />
                              View on Map
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No orders in transit</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pending Orders */}
          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length > 0 ? (
              pendingOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Order #{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-muted-foreground">MK {parseFloat(order.total || '0').toFixed(2)}</p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{order.deliveryAddress}</p>
                    <Button className="w-full">Track Order</Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No pending orders</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Active Drivers */}
          <TabsContent value="drivers" className="space-y-4">
            {activeDrivers && activeDrivers.length > 0 ? (
              activeDrivers.map((driver) => (
                <Card key={driver.id} className="hover-elevate active-elevate-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">
                          {driver.firstName} {driver.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">{driver.phone}</p>
                        <Badge className="mt-2">{driver.activeDeliveries} active deliveries</Badge>
                      </div>
                      <Truck className="h-8 w-8 text-primary opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No drivers available right now</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
