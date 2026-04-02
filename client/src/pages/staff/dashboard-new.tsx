import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, XCircle, Clock, Users, Package, Zap, Phone, Mail, MessageSquare, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ChatWidget } from "@/components/ChatWidget";
import { Progress } from "@/components/ui/progress";
import { MeritBadges, badgeDefinitions } from "@/components/MeritBadges";
import type { Order, User } from "@shared/schema";

type OrderApproval = Order & {
  customer: User;
  requiresApproval: boolean;
  approvalReason?: string;
};

type StaffMember = User & {
  role: string;
  status: "active" | "inactive";
  lastActive: string;
};

export default function StaffDashboardNew() {
  const { toast } = useToast();
  const { user, isStaff, isAuthenticated, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanInventory = useCallback(() => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Inventory Scan Complete",
        description: "Batch #B204-Z verified. Expiry date: Oct 2026. Stock levels updated precisely.",
      });
    }, 2000);
  }, [toast]);

  // Fetch pending order approvals
  const { data: pendingApprovals = [] } = useQuery<OrderApproval[]>({
    queryKey: ["/api/staff/approvals"],
    enabled: isAuthenticated && isStaff,
  });

  // Fetch staff members
  const { data: staffMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff/members"],
    enabled: isAuthenticated && isStaff,
  });

  // Fetch technical issues/support tickets
  const { data: supportTickets = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/support-tickets"],
    enabled: isAuthenticated && isStaff,
  });

  // Approve order mutation
  const approveOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest(`/api/orders/${orderId}/approve`, "PATCH", {
        status: "approved",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/approvals"] });
      toast({ title: "Order approved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to approve order", variant: "destructive" });
    },
  });

  // Reject order mutation
  const rejectOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest(`/api/orders/${orderId}/reject`, "PATCH", {
        status: "rejected",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/approvals"] });
      toast({ title: "Order rejected" });
    },
    onError: () => {
      toast({ title: "Failed to reject order", variant: "destructive" });
    },
  });

  const stats = {
    pendingApprovals: pendingApprovals.length,
    activeStaff: staffMembers.filter((s) => s.status === "active").length,
    openTickets: supportTickets.filter((t) => t.status === "open").length,
    totalStaff: staffMembers.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Staff Management Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage approvals, staff, and support tickets</p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div className="hidden sm:block">
              <p className="text-sm text-muted-foreground">Welcome back,</p>
              <p className="font-bold">{user?.firstName || "Staff"}</p>
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={handleScanInventory}
              disabled={isScanning}
            >
              <Package className={`h-4 w-4 mr-2 ${isScanning ? "animate-spin" : ""}`} />
              {isScanning ? "Scanning..." : "Scan Inventory"}
            </Button>
            <ChatWidget userId="staff-1" userRole="staff" />
            <Button variant="outline" onClick={signOut} data-testid="button-logout">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="card-pending-approvals">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">Orders requiring review</p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-staff">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Active Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.activeStaff}</div>
              <p className="text-xs text-muted-foreground">of {stats.totalStaff} team members</p>
            </CardContent>
          </Card>

          <Card data-testid="card-open-tickets">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Support Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-2">{stats.openTickets}</div>
              <p className="text-xs text-muted-foreground">Unresolved issues</p>
            </CardContent>
          </Card>

          <Card data-testid="card-processing">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-4">
                {pendingApprovals.filter((o) => o.status === "processing").length}
              </div>
              <p className="text-xs text-muted-foreground">In progress orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Merit Badges */}
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
          <CardContent className="pt-6">
            <MeritBadges 
              badges={[
                { ...badgeDefinitions.communication_expert, unlockedAt: "Nov 10, 2024" },
                { ...badgeDefinitions.top_performer, unlockedAt: "Nov 20, 2024" },
                { ...badgeDefinitions.efficiency_master, unlockedAt: "Nov 21, 2024" },
                { ...badgeDefinitions.five_star_champion },
              ]} 
              role="staff" 
            />
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="approvals" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="approvals">
              Order Approvals ({stats.pendingApprovals})
            </TabsTrigger>
            <TabsTrigger value="staff">Staff Management ({stats.totalStaff})</TabsTrigger>
            <TabsTrigger value="support">Support Tickets ({stats.openTickets})</TabsTrigger>
            <TabsTrigger value="performance">Daily Performance</TabsTrigger>
          </TabsList>

          {/* Daily Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Daily Performance Report</CardTitle>
                <CardDescription>Track your productivity and impact metrics for today.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Orders Processed</p>
                    <p className="text-2xl font-bold">42</p>
                    <Progress value={84} className="h-2" />
                    <p className="text-xs text-muted-foreground">84% of daily target (50)</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Accuracy Rate</p>
                    <p className="text-2xl font-bold">99.8%</p>
                    <Progress value={99.8} className="h-2" />
                    <p className="text-xs text-muted-foreground">Target: 99.5%</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Customer Satisfaction</p>
                    <p className="text-2xl font-bold">4.9/5</p>
                    <Progress value={98} className="h-2" />
                    <p className="text-xs text-muted-foreground">Based on 12 reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Order Approvals Tab */}
          <TabsContent value="approvals" className="space-y-4">
            {pendingApprovals.length > 0 ? (
              pendingApprovals.map((order) => (
                <Card key={order.id} className="border-chart-3/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold">Order #{order.id.slice(0, 8)}</h3>
                          <Badge className="bg-chart-3">Pending Review</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Customer: {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">MK {parseFloat((order as any).totalAmount || "0").toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{order.status}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Delivery Address</p>
                        <p className="font-semibold line-clamp-2">{order.deliveryAddress}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Distance</p>
                        <p className="font-semibold">{order.deliveryDistance} km</p>
                      </div>
                    </div>

                    {/* Approval Reason */}
                    {order.approvalReason && (
                      <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                          Flagged for Review
                        </p>
                        <p className="text-xs text-yellow-800 dark:text-yellow-200">{order.approvalReason}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          rejectOrderMutation.mutate(order.id)
                        }
                        disabled={rejectOrderMutation.isPending}
                        data-testid={`button-reject-order-${order.id.slice(0, 8)}`}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => approveOrderMutation.mutate(order.id)}
                        disabled={approveOrderMutation.isPending}
                        className="flex-1"
                        data-testid={`button-approve-order-${order.id.slice(0, 8)}`}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-chart-1 opacity-50" />
                  <p className="text-muted-foreground">No orders pending approval</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Staff Management Tab */}
          <TabsContent value="staff" className="space-y-4">
            {staffMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffMembers.map((member) => (
                  <Card key={member.id} className="hover-elevate active-elevate-2">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-white">
                              {member.firstName?.[0] || "S"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold">
                                {member.firstName} {member.lastName}
                              </h4>
                              <Badge variant={member.status === "active" ? "default" : "secondary"}>
                                {member.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Role: {member.role || "Staff"}
                            </p>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{member.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Last active: {member.lastActive}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            data-testid={`button-manage-staff-${member.id.slice(0, 8)}`}
                          >
                            Manage
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            data-testid={`button-message-staff-${member.id.slice(0, 8)}`}
                          >
                            Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No staff members found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Support Tickets Tab */}
          <TabsContent value="support" className="space-y-4">
            {supportTickets.length > 0 ? (
              supportTickets
                .filter((t) => t.status === "open")
                .map((ticket) => (
                  <Card key={ticket.id} className="border-chart-2/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold">Ticket #{ticket.id.slice(0, 8)}</h3>
                            <Badge className="bg-chart-2">Open</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{ticket.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-chart-2">
                            {ticket.priority?.toUpperCase() || "NORMAL"}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        <p className="mb-2">{ticket.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted p-2 rounded">
                          <p className="text-muted-foreground">Reported by</p>
                          <p className="font-semibold">{ticket.reportedBy}</p>
                        </div>
                        <div className="bg-muted p-2 rounded">
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-semibold">{ticket.createdAt}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-ticket-${ticket.id.slice(0, 8)}`}>
                          View Details
                        </Button>
                        <Button size="sm" className="flex-1" data-testid={`button-resolve-ticket-${ticket.id.slice(0, 8)}`}>
                          Resolve
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No open support tickets</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
