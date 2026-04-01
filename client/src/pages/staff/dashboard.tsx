import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Package, AlertTriangle, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type StaffStats = {
  todaysSales: number;
  transactionsCount: number;
  lowStockCount: number;
  pendingOrders: number;
};

export default function StaffDashboard() {
  const { toast } = useToast();
  const { isStaff, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isStaff)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, isStaff, authLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<StaffStats>({
    queryKey: ["/api/staff/stats"],
    enabled: isAuthenticated && isStaff,
  });

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Staff Dashboard</h1>
          <p className="text-muted-foreground">Manage point-of-sale and inventory</p>
        </div>
        <a href="/staff/pos">
          <Button size="lg" data-testid="button-open-pos">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Open POS Terminal
          </Button>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="card-todays-sales">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-3xl font-bold text-primary">
                  MK {(stats?.todaysSales || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.transactionsCount || 0} transactions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-pending-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-3xl font-bold text-chart-3">
                  {stats?.pendingOrders || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting fulfillment</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-low-stock" className="border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-3xl font-bold text-destructive">
                  {stats?.lowStockCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Items to reorder</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-operations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operations</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/staff/pos">
                <Button variant="outline" size="sm" className="w-full">
                  POS Terminal
                </Button>
              </a>
              <a href="/admin/inventory">
                <Button variant="outline" size="sm" className="w-full">
                  Inventory
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/staff/pos">
              <Button className="w-full" size="lg">
                <ShoppingCart className="h-4 w-4 mr-2" />
                New Sale
              </Button>
            </a>
            <a href="/admin/inventory">
              <Button variant="outline" className="w-full" size="lg">
                <Package className="h-4 w-4 mr-2" />
                Check Inventory
              </Button>
            </a>
            <Button variant="outline" className="w-full" size="lg" disabled>
              <Package className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-shift-summary">
        <CardHeader>
          <CardTitle>Daily Performance</CardTitle>
          <CardDescription>Today's metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sales Target Achievement</span>
              <span className="text-sm text-muted-foreground">75%</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Order Fulfillment Rate</span>
              <span className="text-sm text-muted-foreground">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Inventory Accuracy</span>
              <span className="text-sm text-muted-foreground">88%</span>
            </div>
            <Progress value={88} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

