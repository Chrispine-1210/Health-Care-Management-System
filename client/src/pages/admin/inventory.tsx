import { useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Package, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import type { StockBatch, Product, Branch } from "@shared/schema";

type StockBatchWithDetails = StockBatch & {
  product: Product;
  branch: Branch;
};

export default function AdminInventory() {
  const { toast } = useToast();
  const { isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: stockBatches, isLoading: batchesLoading } = useQuery<StockBatchWithDetails[]>({
    queryKey: ["/api/admin/inventory"],
    enabled: isAuthenticated && isAdmin,
  });

  const getExpiryStatus = useCallback((expiryDate: Date) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { label: "Expired", className: "bg-destructive text-destructive-foreground" };
    } else if (daysUntilExpiry <= 7) {
      return { label: "Critical", className: "bg-destructive text-destructive-foreground" };
    } else if (daysUntilExpiry <= 30) {
      return { label: "Warning", className: "bg-chart-3 text-white" };
    } else if (daysUntilExpiry <= 90) {
      return { label: "Caution", className: "bg-chart-4 text-white" };
    }
    return null;
  }, []);

  const getStockStatus = useCallback((quantity: number) => {
    if (quantity === 0) {
      return { label: "Out of Stock", className: "bg-destructive text-destructive-foreground" };
    } else if (quantity <= 10) {
      return { label: "Low Stock", className: "bg-chart-3 text-white" };
    }
    return null;
  }, []);

  const filteredBatches = useMemo(
    () => stockBatches?.filter(batch =>
      batch.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [],
    [stockBatches, searchQuery]
  );

  const criticalItems = useMemo(
    () => stockBatches?.filter(b => {
      const status = getExpiryStatus(b.expiryDate);
      return status?.label === "Expired" || status?.label === "Critical";
    }) || [],
    [stockBatches, getExpiryStatus]
  );

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Inventory Management</h1>
          <p className="text-muted-foreground">Monitor stock levels, batches, and expiry dates across all branches</p>
        </div>
        <Button data-testid="button-receive-stock">
          <Plus className="h-4 w-4 mr-2" />
          Receive Stock
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockBatches?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              {stockBatches?.filter(b => b.quantity <= 10).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              {stockBatches?.filter(b => {
                const daysUntilExpiry = Math.ceil((new Date(b.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
              }).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Batches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stockBatches?.filter(b => new Date(b.expiryDate) < new Date()).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Stock Batches</CardTitle>
              <CardDescription>All inventory batches across branches</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                className="pl-10"
                data-testid="input-search-batches"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : stockBatches && stockBatches.length > 0 ? (
                  stockBatches.slice(0, 20).map((batch) => {
                    const expiryStatus = getExpiryStatus(batch.expiryDate);
                    const stockStatus = getStockStatus(batch.quantity);

                    return (
                      <TableRow key={batch.id} data-testid={`batch-row-${batch.id}`}>
                        <TableCell className="font-mono text-sm">{batch.batchNumber}</TableCell>
                        <TableCell className="font-medium">{batch.product.name}</TableCell>
                        <TableCell>{batch.branch.name}</TableCell>
                        <TableCell className="text-right font-medium">
                          {batch.quantity}
                        </TableCell>
                        <TableCell>{format(new Date(batch.expiryDate), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {expiryStatus && (
                              <Badge className={expiryStatus.className}>{expiryStatus.label}</Badge>
                            )}
                            {stockStatus && (
                              <Badge className={stockStatus.className}>{stockStatus.label}</Badge>
                            )}
                            {!expiryStatus && !stockStatus && (
                              <Badge variant="outline">Good</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" data-testid={`button-view-${batch.id}`}>View</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No stock batches found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
