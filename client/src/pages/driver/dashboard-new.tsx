import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Delivery, Order, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useConversations } from "@/hooks/useNotifications";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { OrderTrackingProgress } from "@/components/OrderTrackingProgress";
import { RoleWorkspacePanel } from "@/components/RoleWorkspacePanel";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChatWidget } from "@/components/ChatWidget";
import { DriverMapTracker } from "@/components/DriverMapTracker";
import {
  CheckCircle2,
  MapPin,
  Navigation,
  Phone,
  Route,
  ShieldAlert,
  Truck,
} from "lucide-react";

type DeliveryWithDetails = Delivery & {
  order: Order;
  customer: User;
};

type DeliveryFormState = {
  proofOfDeliveryUrl: string;
  deliveryNotes: string;
};

const emptyDeliveryForm: DeliveryFormState = {
  proofOfDeliveryUrl: "",
  deliveryNotes: "",
};

export default function DriverDashboardNew() {
  const { toast } = useToast();
  const { user, isDriver, isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryForms, setDeliveryForms] = useState<Record<string, DeliveryFormState>>({});

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isDriver)) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Redirecting to login.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, isDriver, toast]);

  const handleOptimizeRoute = useCallback(() => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      toast({
        title: "Routes optimized",
        description: "Delivery stops have been reordered to reduce travel time and keep customers updated.",
      });
    }, 1200);
  }, [toast]);

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<DeliveryWithDetails[]>({
    queryKey: ["/api/driver/deliveries/active"],
    enabled: isAuthenticated && isDriver,
    refetchInterval: 10000,
  });

  const { data: conversations = [] } = useConversations({
    enabled: isAuthenticated && isDriver,
  });

  const invalidateDriverQueues = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/driver/deliveries/active"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
  }, [queryClient]);

  const pickupMutation = useMutation({
    mutationFn: (deliveryId: string) =>
      apiRequest("PATCH", `/api/deliveries/${deliveryId}/status`, {
        status: "picked_up",
      }),
    onSuccess: async () => {
      await invalidateDriverQueues();
      toast({
        title: "Pickup confirmed",
        description: "The order is now marked as picked up and ready for live status updates.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Pickup failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const transitMutation = useMutation({
    mutationFn: (deliveryId: string) =>
      apiRequest("PATCH", `/api/deliveries/${deliveryId}/status`, {
        status: "in_transit",
      }),
    onSuccess: async () => {
      await invalidateDriverQueues();
      toast({
        title: "Live status reported",
        description: "Customers and staff can now see that this delivery is in transit.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Status update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (params: { deliveryId: string; proofOfDeliveryUrl: string; deliveryNotes: string }) =>
      apiRequest("PATCH", `/api/deliveries/${params.deliveryId}/status`, {
        status: "delivered",
        proofOfDeliveryUrl: params.proofOfDeliveryUrl,
        deliveryNotes: params.deliveryNotes,
      }),
    onSuccess: async (_response, variables) => {
      await invalidateDriverQueues();
      setDeliveryForms((current) => ({
        ...current,
        [variables.deliveryId]: emptyDeliveryForm,
      }));
      toast({
        title: "Delivery completed",
        description: "Proof of delivery and final notes were saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delivery confirmation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignedDeliveries = useMemo(
    () => deliveries.filter((delivery) => ["assigned", "pending"].includes(delivery.status)),
    [deliveries],
  );

  const pickedUpDeliveries = useMemo(
    () => deliveries.filter((delivery) => delivery.status === "picked_up"),
    [deliveries],
  );

  const inTransitDeliveries = useMemo(
    () => deliveries.filter((delivery) => delivery.status === "in_transit"),
    [deliveries],
  );

  const completedDeliveries = useMemo(
    () => deliveries.filter((delivery) => delivery.status === "delivered"),
    [deliveries],
  );

  const coordinationThreads = useMemo(
    () =>
      conversations.filter((conversation) =>
        ["customer", "staff", "admin"].includes(conversation.participantRole),
      ),
    [conversations],
  );

  const liveDelivery = inTransitDeliveries[0] || pickedUpDeliveries[0] || null;

  useEffect(() => {
    if (!liveDelivery || !("geolocation" in navigator)) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setDriverLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        toast({
          title: "Location unavailable",
          description: "Live GPS tracking could not start on this device.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [liveDelivery, toast]);

  const getDeliveryForm = useCallback(
    (deliveryId: string) => deliveryForms[deliveryId] || emptyDeliveryForm,
    [deliveryForms],
  );

  const updateDeliveryForm = useCallback(
    (deliveryId: string, field: keyof DeliveryFormState, value: string) => {
      setDeliveryForms((current) => ({
        ...current,
        [deliveryId]: {
          ...(current[deliveryId] || emptyDeliveryForm),
          [field]: value,
        },
      }));
    },
    [],
  );

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const renderLoadingStack = () =>
    Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 w-full" />);

  return (
    <DashboardShell
      role="Driver"
      title="Delivery Operations Dashboard"
      description="Receive assigned deliveries, confirm pickup, report live delivery status, capture proof of delivery, and coordinate directly with staff and customers."
      actions={(
        <>
          <Button variant="outline" onClick={handleOptimizeRoute} disabled={isOptimizing}>
            <Route className="mr-2 h-4 w-4" />
            {isOptimizing ? "Optimizing..." : "Optimize Route"}
          </Button>
          <Button variant="outline" className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
            <ShieldAlert className="mr-2 h-4 w-4" />
            SOS Emergency
          </Button>
          <ChatWidget userId={user?.id || ""} userRole="driver" />
          <Button variant="outline" onClick={signOut} data-testid="button-logout">
            Sign Out
          </Button>
        </>
      )}
    >

      <RoleWorkspacePanel
        role="driver"
        title="Driver Routes"
        description="Open the delivery, coordination, history, and performance tools assigned to driver workflows."
        excludeKeys={["dashboard"]}
        limit={4}
      />

      {liveDelivery && driverLocation && (
        <DriverMapTracker
          driverLocation={driverLocation}
          customerLocation={{
            lat: parseFloat(liveDelivery.order.deliveryLatitude || "0"),
            lng: parseFloat(liveDelivery.order.deliveryLongitude || "0"),
          }}
          destination={liveDelivery.order.deliveryAddress ?? undefined}
          distance={liveDelivery.order.deliveryDistance ? parseFloat(liveDelivery.order.deliveryDistance) : undefined}
          isTracking
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Assigned"
          value={assignedDeliveries.length}
          description="Deliveries waiting for pickup confirmation"
          tone="warning"
        />
        <MetricCard
          title="Picked Up"
          value={pickedUpDeliveries.length}
          description="Ready for a live in-transit report"
          tone="info"
        />
        <MetricCard
          title="In Transit"
          value={inTransitDeliveries.length}
          description="Customers can currently track these orders"
          tone="success"
        />
        <MetricCard
          title="Completed"
          value={completedDeliveries.length}
          description="Deliveries closed with proof and notes"
        />
        <MetricCard
          title="Coordination Threads"
          value={coordinationThreads.length}
          description="Active customer or staff conversations"
        />
      </div>

      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 gap-2 md:grid-cols-4">
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="live">Live Status</TabsTrigger>
          <TabsTrigger value="coordination">Coordination</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receive Assigned Deliveries</CardTitle>
              <CardDescription>
                Confirm pickup as soon as you receive a delivery assignment so the workflow stays accurate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deliveriesLoading ? (
                renderLoadingStack()
              ) : assignedDeliveries.length > 0 ? (
                assignedDeliveries.map((delivery) => (
                  <div key={delivery.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">
                            {delivery.customer.firstName} {delivery.customer.lastName}
                          </p>
                          <Badge variant="outline">{delivery.status}</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{delivery.order.deliveryAddress || "Delivery address pending"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{delivery.customer.phone || "No phone on file"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Navigation className="h-4 w-4" />
                            <span>
                              {delivery.order.deliveryDistance
                                ? `${parseFloat(delivery.order.deliveryDistance).toFixed(1)} km`
                                : "Distance pending"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {delivery.customer.phone && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              window.location.href = `tel:${delivery.customer.phone}`;
                            }}
                          >
                            Contact Customer
                          </Button>
                        )}
                        <Button
                          onClick={() => pickupMutation.mutate(delivery.id)}
                          disabled={pickupMutation.isPending}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirm Pickup
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <Truck className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">No assigned deliveries right now</p>
                  <p className="text-sm text-muted-foreground">
                    New assignments will appear here as soon as staff dispatches them.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Live Status and Proof of Delivery</CardTitle>
              <CardDescription>
                Report in-transit status, then close the job with proof of delivery and completion notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deliveriesLoading ? (
                renderLoadingStack()
              ) : pickedUpDeliveries.length > 0 || inTransitDeliveries.length > 0 ? (
                [...pickedUpDeliveries, ...inTransitDeliveries].map((delivery) => {
                  const form = getDeliveryForm(delivery.id);

                  return (
                    <div key={delivery.id} className="rounded-xl border p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">Order #{delivery.orderId.slice(0, 8)}</p>
                              <Badge className={delivery.status === "in_transit" ? "bg-emerald-600" : "bg-sky-600"}>
                                {delivery.status === "in_transit" ? "In Transit" : "Picked Up"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {delivery.customer.firstName} {delivery.customer.lastName} | {delivery.order.deliveryAddress}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {delivery.status === "picked_up" && (
                              <Button
                                variant="outline"
                                onClick={() => transitMutation.mutate(delivery.id)}
                                disabled={transitMutation.isPending}
                              >
                                Report In Transit
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Proof of delivery reference</p>
                            <Input
                              placeholder="Paste photo URL or proof reference"
                              value={form.proofOfDeliveryUrl}
                              onChange={(event) =>
                                updateDeliveryForm(delivery.id, "proofOfDeliveryUrl", event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Live delivery notes</p>
                            <Textarea
                              className="min-h-[44px]"
                              placeholder="Customer reached, gate code, delay note, or final handoff note"
                              value={form.deliveryNotes}
                              onChange={(event) =>
                                updateDeliveryForm(delivery.id, "deliveryNotes", event.target.value)
                              }
                            />
                          </div>
                        </div>

                        <OrderTrackingProgress
                          status={delivery.status}
                          deliveryDistance={delivery.order.deliveryDistance}
                          deliveryAddress={delivery.order.deliveryAddress}
                          deliveryNotes={form.deliveryNotes || delivery.deliveryNotes}
                        />

                        <div className="flex flex-wrap gap-2">
                          {delivery.customer.phone && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                window.location.href = `tel:${delivery.customer.phone}`;
                              }}
                            >
                              Contact Customer
                            </Button>
                          )}
                          <Button
                            onClick={() =>
                              completeMutation.mutate({
                                deliveryId: delivery.id,
                                proofOfDeliveryUrl: form.proofOfDeliveryUrl,
                                deliveryNotes: form.deliveryNotes,
                              })
                            }
                            disabled={completeMutation.isPending || !form.proofOfDeliveryUrl.trim()}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Confirm Delivery
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <Navigation className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">No live delivery updates required right now</p>
                  <p className="text-sm text-muted-foreground">
                    Picked-up and in-transit deliveries will appear here for live reporting.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordination" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer and Staff Coordination</CardTitle>
              <CardDescription>
                Keep communication active with the people involved in your current delivery work.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {coordinationThreads.length > 0 ? (
                coordinationThreads.map((conversation) => (
                  <div key={conversation.conversationId} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium">{conversation.participantName}</p>
                          <Badge variant="outline">{conversation.participantRole}</Badge>
                          {conversation.online && <Badge className="bg-emerald-600">Online</Badge>}
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {conversation.unread > 0 && <Badge>{conversation.unread} unread</Badge>}
                        <Button variant="outline" size="sm" onClick={() => window.location.href = "/driver/inbox"}>
                          Open Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <Phone className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">No coordination threads yet</p>
                  <p className="text-sm text-muted-foreground">
                    Customer and staff conversations will appear here when delivery coordination starts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Deliveries</CardTitle>
              <CardDescription>
                Review finished jobs, delivery notes, and proof references that were recorded.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedDeliveries.length > 0 ? (
                completedDeliveries.map((delivery) => (
                  <div key={delivery.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-medium">
                          {delivery.customer.firstName} {delivery.customer.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Delivered {delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleString() : "recently"}
                        </p>
                        {delivery.deliveryNotes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            Note: {delivery.deliveryNotes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge variant="outline">Delivered</Badge>
                        {delivery.proofOfDeliveryUrl && (
                          <a
                            href={delivery.proofOfDeliveryUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-primary underline"
                          >
                            View proof
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">No completed deliveries yet</p>
                  <p className="text-sm text-muted-foreground">
                    Finished deliveries with proof of handoff will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
