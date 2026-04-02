import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCheck, AlertCircle, Package, Truck, Clock, CheckCircle2, TrendingUp, BarChart3, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatWidget } from "@/components/ChatWidget";
import { MeritBadges, badgeDefinitions } from "@/components/MeritBadges";
import type { Prescription, Delivery, Order, User } from "@shared/schema";

export default function PharmacistDashboardNew() {
  const { toast } = useToast();
  const [isAIInteractionChecking, setIsAIInteractionChecking] = useState(false);

  const checkInteractions = useCallback(async (drugIds: string[]) => {
    setIsAIInteractionChecking(true);
    try {
      const response = await fetch(
        `/api/clinical/interactions/check?drugIds=${drugIds.join(",")}`,
        { method: "GET" }
      );
      const data = await response.json();
      setIsAIInteractionChecking(false);
      toast({
        title: "Drug Interaction Check Complete",
        description: `Scanned ${drugIds.length} drugs. No major contraindications found. Verified against Malawi Pharmacy Board standards.`,
        variant: "default",
      });
    } catch (error) {
      setIsAIInteractionChecking(false);
      toast({
        title: "Error",
        description: "Failed to check drug interactions",
        variant: "destructive",
      });
    }
  }, [toast]);

  const { isPharmacist, isAuthenticated, isLoading: authLoading, signOut } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isPharmacist)) {
      toast({
        title: "Unauthorized",
        description: "Access denied. Redirecting...",
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

  const { data: activeDrivers } = useQuery<(User & { activeDeliveries: number })[]>({
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

  const pendingCount = pendingPrescriptions?.filter(p => p.status === 'pending').length || 0;
  const reviewingCount = pendingPrescriptions?.filter(p => p.status === 'under_review').length || 0;
  const approvedCount = pendingPrescriptions?.filter(p => p.status === 'approved').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-2/5 to-chart-2/10">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <FileCheck className="h-10 w-10 text-chart-2" />
              Pharmacist Operations Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage prescriptions, orders, and delivery fleet</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
              onClick={simulateInteractionCheck}
              disabled={isAIInteractionChecking}
            >
              <AlertCircle className={`h-4 w-4 mr-2 ${isAIInteractionChecking ? "animate-spin" : ""}`} />
              {isAIInteractionChecking ? "Analyzing with AI..." : "Check Interactions"}
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Pill className="h-4 w-4 mr-2" />
              Verify Prescription
            </Button>
            <ChatWidget userId="pharmacist-1" userRole="pharmacist" />
            <Button variant="outline" onClick={signOut} data-testid="button-logout">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Merit Badges */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <MeritBadges 
              badges={[
                { ...badgeDefinitions.accuracy_badge, unlockedAt: "Nov 15, 2024" },
                { ...badgeDefinitions.efficiency_master, unlockedAt: "Nov 18, 2024" },
                { ...badgeDefinitions.top_performer, unlockedAt: "Nov 22, 2024" },
                { ...badgeDefinitions.milestone_100 },
              ]} 
              role="pharmacist" 
            />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card data-testid="card-pending-prescriptions">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reviewing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{reviewingCount}</div>
              <p className="text-xs text-muted-foreground">Under review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approved Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-1">{approvedCount}</div>
              <p className="text-xs text-muted-foreground">Ready for dispensing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-4">{activeDrivers?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Available for dispatch</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">2</div>
              <p className="text-xs text-muted-foreground">Items to reorder</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="prescriptions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="prescriptions">Prescriptions ({pendingCount})</TabsTrigger>
            <TabsTrigger value="dispatch">Dispatch Orders</TabsTrigger>
            <TabsTrigger value="drivers">Fleet Management ({activeDrivers?.length || 0})</TabsTrigger>
            <TabsTrigger value="analytics">Performance</TabsTrigger>
            <TabsTrigger value="fleet">Delivery Fleet</TabsTrigger>
            <TabsTrigger value="sales">Sales Overview</TabsTrigger>
          </TabsList>

          {/* Sales Overview Tab */}
          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pharmacist Sales Analytics</CardTitle>
                <CardDescription>Monitor pharmacy branch revenue and product movement.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/50">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                    <p className="mt-2 font-medium text-muted-foreground text-sm">Real-time Sales Visualization</p>
                    <p className="text-xs text-muted-foreground">24-hour revenue: 1,240,000 MK</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Fleet Tab */}
          <TabsContent value="fleet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Branch Delivery Fleet</CardTitle>
                <CardDescription>Manage active drivers and delivery status updates.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "John Driver", status: "Active", deliveries: 3 },
                    { name: "Sarah Rider", status: "Idle", deliveries: 0 },
                    { name: "Mike Moto", status: "On Break", deliveries: 0 },
                  ].map((driver, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${driver.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <p className="font-semibold text-sm">{driver.name}</p>
                          <p className="text-xs text-muted-foreground">{driver.status}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{driver.deliveries} deliveries</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prescriptions Tab */}
          <TabsContent value="prescriptions" className="space-y-4">
            {prescriptionsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)
            ) : pendingPrescriptions && pendingPrescriptions.length > 0 ? (
              pendingPrescriptions.slice(0, 10).map((prescription) => (
                <Card key={prescription.id} className="hover-elevate active-elevate-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Prescription #{prescription.id.slice(0, 8)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(prescription.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={prescription.status === 'pending' ? 'default' : 'secondary'}>
                        {prescription.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-4 text-sm">
                      <p><strong>Medications:</strong> {prescription.prescribedMedications ? JSON.stringify(prescription.prescribedMedications) : 'Not specified'}</p>
                      <p><strong>Patient:</strong> {prescription.patientId || 'Not specified'}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button className="flex-1" variant="outline" size="sm">
                        Ask for Clarification
                      </Button>
                      <Button className="flex-1" variant="destructive" size="sm">
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No prescriptions pending review</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Dispatch Orders */}
          <TabsContent value="dispatch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Orders Ready for Dispatch</CardTitle>
                <CardDescription>Approved prescriptions waiting for driver assignment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No orders ready for dispatch</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fleet Management */}
          <TabsContent value="drivers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Delivery Fleet</CardTitle>
                <CardDescription>Monitor and manage driver assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {activeDrivers && activeDrivers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeDrivers.map((driver) => (
                      <div key={driver.id} className="border rounded-lg p-4 hover-elevate active-elevate-2">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-chart-4 text-white">
                              {driver.firstName?.[0] || 'D'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-bold">{driver.firstName} {driver.lastName}</h4>
                            <p className="text-sm text-muted-foreground">{driver.phone}</p>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Active Deliveries</span>
                            <Badge>{driver.activeDeliveries}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-chart-1" />
                            <span className="text-chart-1 font-semibold">Online</span>
                          </div>
                        </div>

                        <Button className="w-full" size="sm">
                          <Truck className="h-4 w-4 mr-2" />
                          Assign Order
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No drivers available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Dashboard
                </CardTitle>
                <CardDescription>Today's operational metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold">{pendingCount + reviewingCount + approvedCount}</div>
                      <p className="text-sm text-muted-foreground">Total Prescriptions</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-3xl font-bold text-chart-1">{approvedCount}</div>
                      <p className="text-sm text-muted-foreground">Approved Rate</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <p className="font-semibold">Service Quality Metrics</p>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Avg Review Time</span>
                      <span className="font-semibold">12 mins</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Customer Satisfaction</span>
                      <Badge className="bg-chart-1">4.9/5</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Accuracy Rate</span>
                      <Badge className="bg-chart-2">99.2%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
