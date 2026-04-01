import { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Appointment, Delivery, Order, Prescription, Product } from "@shared/schema";
import { CustomerNav } from "@/components/CustomerNav";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderTrackingProgress } from "@/components/OrderTrackingProgress";
import { RoleWorkspacePanel } from "@/components/RoleWorkspacePanel";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  CalendarDays,
  FileText,
  Package,
  Pill,
  ShoppingCart,
  Truck,
} from "lucide-react";

type ManagedOrder = Order & {
  delivery?: Delivery | null;
};

const activeDeliveryStatuses = ["confirmed", "processing", "ready", "in_transit"];

function getOrderStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge className="bg-amber-500">Pending</Badge>;
    case "confirmed":
      return <Badge className="bg-sky-600">Confirmed</Badge>;
    case "processing":
      return <Badge className="bg-blue-600">Processing</Badge>;
    case "ready":
      return <Badge className="bg-violet-600">Ready</Badge>;
    case "in_transit":
      return <Badge className="bg-emerald-600">In Transit</Badge>;
    case "delivered":
      return <Badge variant="outline">Delivered</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function CustomerHome() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to sign in.",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/login");
      }, 500);
    }
  }, [authLoading, isAuthenticated, setLocation, toast]);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<ManagedOrder[]>({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const { data: prescriptions = [], isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions/patient", user?.id],
    enabled: isAuthenticated && !authLoading && !!user?.id,
    refetchInterval: 15000,
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/patient", user?.id],
    enabled: isAuthenticated && !authLoading && !!user?.id,
    refetchInterval: 15000,
  });

  const approvedMedicines = useMemo(
    () => products.filter((product) => product.isActive),
    [products],
  );

  const activeOrders = useMemo(
    () => orders.filter((order) => activeDeliveryStatuses.includes(order.status)),
    [orders],
  );

  const recentPrescriptions = useMemo(
    () =>
      [...prescriptions]
        .sort(
          (left, right) =>
            new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime(),
        )
        .slice(0, 3),
    [prescriptions],
  );

  const upcomingConsultations = useMemo(
    () =>
      [...appointments]
        .filter((appointment) =>
          ["scheduled", "confirmed", "in_progress"].includes(appointment.status),
        )
        .sort(
          (left, right) =>
            new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime(),
        )
        .slice(0, 3),
    [appointments],
  );

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <main className="container mx-auto px-4 py-8">
        <DashboardShell
          role="Customer"
          title="Care and Delivery Dashboard"
          description="Browse approved medicines, upload prescriptions securely, track deliveries in real time, and book pharmacist consultations from one place."
          actions={(
            <>
              <Button onClick={() => setLocation("/customer/shop")}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Browse Medicines
              </Button>
              <Button variant="outline" onClick={() => setLocation("/customer/prescriptions")}>
                <FileText className="mr-2 h-4 w-4" />
                Upload Prescription
              </Button>
              <Button variant="outline" onClick={() => setLocation("/customer/consultations")}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Book Consultation
              </Button>
            </>
          )}
        >
          <RoleWorkspacePanel
            role="customer"
            title="Customer Routes"
            description="Move quickly between the dashboard, medicines, prescriptions, orders, consultations, and profile tools built for customers."
            excludeKeys={["dashboard"]}
            limit={6}
          />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Approved Medicines"
            value={approvedMedicines.length}
            description="Available catalog items ready to browse and order"
            tone="info"
          />
          <MetricCard
            title="Prescription Uploads"
            value={prescriptions.length}
            description="Secure prescription records linked to your account"
            tone="warning"
          />
          <MetricCard
            title="Active Deliveries"
            value={activeOrders.length}
            description="Orders currently moving through preparation or delivery"
            tone="success"
          />
          <MetricCard
            title="Consultations"
            value={upcomingConsultations.length}
            description="Upcoming pharmacist consultations already booked"
            tone="info"
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Delivery Tracking</CardTitle>
              <CardDescription>
                Follow active orders as they move from pharmacy review into dispatch and delivery.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordersLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 w-full" />
                ))
              ) : activeOrders.length > 0 ? (
                activeOrders.slice(0, 4).map((order) => (
                  <div key={order.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                          {getOrderStatusBadge(order.status)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Truck className="h-4 w-4" />
                            <span>{order.deliveryAddress || "Counter collection"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Package className="h-4 w-4" />
                            <span>MK {Number(order.total || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <OrderTrackingProgress
                          status={order.status}
                          deliveryDistance={order.deliveryDistance}
                          deliveryAddress={order.deliveryAddress}
                          deliveryNotes={order.delivery?.deliveryNotes}
                        />
                      </div>
                      <Button variant="outline" onClick={() => setLocation(`/customer/orders/${order.id}`)}>
                        Track Order
                        </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <Truck className="mx-auto mb-3 h-8 w-8 text-primary" />
                  <p className="font-medium">No active deliveries yet</p>
                  <p className="text-sm text-muted-foreground">
                    Once you place an order, live preparation and delivery updates will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prescription Workspace</CardTitle>
                <CardDescription>
                  Upload prescriptions securely and keep track of pharmacist review decisions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {prescriptionsLoading ? (
                  Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))
                ) : recentPrescriptions.length > 0 ? (
                  recentPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">Prescription #{prescription.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded {new Date(prescription.createdAt || Date.now()).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {prescription.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No prescriptions uploaded yet. Secure uploads will appear here after submission.
                  </p>
                )}
                <Button className="w-full" onClick={() => setLocation("/customer/prescriptions")}>
                  Open Prescriptions
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pharmacist Consultations</CardTitle>
                <CardDescription>
                  Book and manage consultations for medicine guidance and follow-up care.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {appointmentsLoading ? (
                  Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 w-full" />
                  ))
                ) : upcomingConsultations.length > 0 ? (
                  upcomingConsultations.map((appointment) => (
                    <div key={appointment.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium capitalize">{appointment.type} consultation</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {appointment.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No consultations booked yet. Schedule a session with a pharmacist when you need help.
                  </p>
                )}
                <Button className="w-full" variant="outline" onClick={() => setLocation("/customer/consultations")}>
                  Manage Consultations
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-8">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Approved Medicines</CardTitle>
              <CardDescription>
                Browse active medicines approved for listing and available in the pharmacy catalog.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setLocation("/customer/shop")}>
              View Full Catalog
            </Button>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-48 w-full" />
                ))}
              </div>
            ) : approvedMedicines.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {approvedMedicines.slice(0, 4).map((product) => (
                  <div key={product.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {product.genericName || product.category || "Approved medicine"}
                        </p>
                      </div>
                      <Pill className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        MK {Number(product.price).toLocaleString()}
                      </span>
                      {product.prescriptionRequired && <Badge variant="outline">Prescription</Badge>}
                    </div>
                    <Button className="mt-4 w-full" size="sm" onClick={() => setLocation("/customer/shop")}>
                      Browse Product
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Pill className="mx-auto mb-3 h-8 w-8 text-primary" />
                <p className="font-medium">No approved medicines are visible right now</p>
                <p className="text-sm text-muted-foreground">
                  Available medicines will appear here as soon as the catalog is ready.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        </DashboardShell>
      </main>
    </div>
  );
}
