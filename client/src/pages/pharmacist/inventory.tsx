import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, ArrowRightLeft } from "lucide-react";
import type { StockBatch, Product } from "@shared/schema";

export default function PharmacistInventory() {
  const { data: batches, isLoading } = useQuery<(StockBatch & { product: Product })[]>({
    queryKey: ["/api/admin/inventory"],
  });

  if (isLoading) return <div>Loading inventory...</div>;

  const lowStock = batches?.filter(b => b.quantity < 50) || [];
  const expiringSoon = batches?.filter(b => {
    const expiry = new Date(b.expiryDate);
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return expiry < threeMonths;
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pharmacy Inventory</h1>
        <p className="text-muted-foreground">Monitor stock levels, expiry dates, and batch information.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Low Stock Alerts</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStock.length}</div>
            <p className="text-xs text-muted-foreground">Items requiring immediate reorder</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoon.length}</div>
            <p className="text-xs text-muted-foreground">Batches expiring within 90 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
          <CardDescription>Detailed view of all medication batches in this branch.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Batch #</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches?.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.product?.name}</TableCell>
                  <TableCell className="font-mono text-xs">{batch.batchNumber}</TableCell>
                  <TableCell>{batch.quantity} units</TableCell>
                  <TableCell>{new Date(batch.expiryDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {batch.quantity < 50 ? (
                      <Badge variant="destructive">Low Stock</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600">Optimal</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
