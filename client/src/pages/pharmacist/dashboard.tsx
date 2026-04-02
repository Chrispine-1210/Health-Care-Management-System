import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileCheck, AlertCircle, Clock, CheckCircle2, Package, Calendar, Truck } from "lucide-react";
import type { Prescription, User } from "@shared/schema";

export default function PharmacistDashboard() {
  const { toast } = useToast();
  const { isPharmacist, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isPharmacist)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isPharmacist, authLoading, toast]);

  const { data: pendingPrescriptions, isLoading: prescriptionsLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions/pending"],
    enabled: isAuthenticated && isPharmacist,
  });

  const { data: activeDrivers, isLoading: driversLoading } = useQuery<(User & { activeDeliveries: number })[]>({
    queryKey: ["/api/drivers/active"],
    enabled: isAuthenticated && isPharmacist,
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
      under_review: { className: "bg-chart-2 text-white", label: "Under Review" },
      approved: { className: "bg-primary text-primary-foreground", label: "Approved" },
      rejected: { className: "bg-destructive text-destructive-foreground", label: "Rejected" },
      dispensed: { className: "bg-muted text-muted-foreground", label: "Dispensed" },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Pharmacist Dashboard</h1>
        <p className="text-muted-foreground">Review prescriptions and manage clinical workflows</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-pending">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-chart-3" data-testid="text-pending-count">
              {pendingPrescriptions?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>

        <Card data-testid="card-reviewed-today">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Prescriptions processed</p>
          </CardContent>
        </Card>

        <Card data-testid="card-low-stock-alerts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Low stock items</p>
          </CardContent>
        </Card>

        <Card data-testid="card-consultations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">Scheduled today</p>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-prescription-queue">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prescription Queue</CardTitle>
              <CardDescription>Prescriptions awaiting your review</CardDescription>
            </div>
            <a href="/pharmacist/prescriptions">
              <Button data-testid="button-view-all-prescriptions">View All</Button>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          {prescriptionsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-md">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : pendingPrescriptions && pendingPrescriptions.length > 0 ? (
            <div className="space-y-3">
              {pendingPrescriptions.slice(0, 5).map((prescription) => (
                <div 
                  key={prescription.id} 
                  className="flex items-center gap-4 p-4 border border-border rounded-md hover-elevate active-elevate-2"
                  data-testid={`prescription-item-${prescription.id}`}
                >
                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">Prescription #{prescription.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(prescription.createdAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(prescription.status)}
                    <a href={`/pharmacist/prescriptions/${prescription.id}`}>
                      <Button size="sm" data-testid={`button-review-${prescription.id}`}>Review</Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No prescriptions pending review</p>
              <p className="text-sm text-muted-foreground mt-1">New prescriptions will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-drug-interactions">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-chart-3" />
              Drug Interaction Alerts
            </CardTitle>
            <CardDescription>Recent interaction warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent interaction alerts</p>
              <p className="text-sm mt-1">System will flag potential interactions during review</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-approvals">
          <CardHeader>
            <CardTitle>Recent Approvals</CardTitle>
            <CardDescription>Your latest prescription reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent approvals</p>
              <p className="text-sm mt-1">Approved prescriptions will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
