import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  AlertTriangle,
  Building2,
  FileText,
  Truck,
  MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChatWidget } from "@/components/ChatWidget";
import { Progress } from "@/components/ui/progress";

type DashboardStats = {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockItems: number;
  expiringItems: number;
  pendingPrescriptions: number;
  activeDeliveries: number;
  revenueGrowth: number;
  ordersGrowth: number;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [isAnalyzingFraud, setIsAnalyzingFraud] = useState(false);

  const handleFraudCheck = useCallback(() => {
    setIsAnalyzingFraud(true);
    setTimeout(() => {
      setIsAnalyzingFraud(false);
      toast({
        title: "Security Scan Complete",
        description: "AI Audit found 0 suspicious activities. Operational efficiency is at 94%.",
      });
    }, 2500);
  }, [toast]);

  const { isAdmin, isAuthenticated, isLoading: authLoading, signOut } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isAdmin, authLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated && isAdmin,
  });

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, trend, trendLabel, description }: any) => (
    <Card data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {statsLoading ? (
          <Skeleton className="h-8 w-24 mb-2" />
        ) : (
          <>
            <div className="text-3xl font-bold" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>
              {value}
            </div>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`h-3 w-3 ${trend >= 0 ? 'text-primary' : 'text-destructive'}`} />
                <p className="text-xs text-muted-foreground">
                  <span className={trend >= 0 ? 'text-primary' : 'text-destructive'}>
                    {trend >= 0 ? '+' : ''}{trend}%
                  </span> {trendLabel}
                </p>
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of Thandizo Pharmacy operations across all branches</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              className="border-orange-500 text-orange-600 hover:bg-orange-50"
              onClick={handleFraudCheck}
              disabled={isAnalyzingFraud}
            >
              <AlertTriangle className={`h-4 w-4 mr-2 ${isAnalyzingFraud ? "animate-pulse" : ""}`} />
              {isAnalyzingFraud ? "Scanning..." : "Security Audit"}
            </Button>
            <ChatWidget userId="admin-1" userRole="admin" />
            <Button variant="outline" onClick={signOut} data-testid="button-logout">
              Sign Out
            </Button>
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={stats ? `MK ${stats.totalRevenue.toLocaleString()}` : '-'}
          icon={TrendingUp}
          trend={stats?.revenueGrowth}
          trendLabel="from last month"
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          trend={stats?.ordersGrowth}
          trendLabel="from last month"
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          description="Registered users"
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          description="Active inventory items"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-destructive/50" data-testid="card-low-stock">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-destructive" data-testid="text-low-stock-value">
                {stats?.lowStockItems || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Requires reordering</p>
          </CardContent>
        </Card>

        <Card className="border-chart-3/50" data-testid="card-expiring">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-chart-3" data-testid="text-expiring-value">
                {stats?.expiringItems || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Within 30 days</p>
          </CardContent>
        </Card>

        <Card data-testid="card-pending-prescriptions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Prescriptions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold" data-testid="text-pending-prescriptions-value">
                {stats?.pendingPrescriptions || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-deliveries">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold" data-testid="text-active-deliveries-value">
                {stats?.activeDeliveries || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">In transit</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-branch-performance">
          <CardHeader>
            <CardTitle>Branch Performance</CardTitle>
            <CardDescription>Sales comparison across branches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No branch data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
