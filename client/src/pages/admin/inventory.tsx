import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Branch, Product, StockBatch } from "@shared/schema";
import { format } from "date-fns";
import { Package, Plus, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StockBatchWithDetails = StockBatch & {
  product: Product;
  branch: Branch;
};

type BatchFormState = {
  productId: string;
  branchId: string;
  batchNumber: string;
  quantity: string;
  expiryDate: string;
  costPrice: string;
  supplierName: string;
};

const emptyForm: BatchFormState = {
  productId: "",
  branchId: "",
  batchNumber: "",
  quantity: "",
  expiryDate: "",
  costPrice: "",
  supplierName: "",
};

export default function AdminInventory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [form, setForm] = useState<BatchFormState>(emptyForm);

  const { data: stockBatches = [], isLoading } = useQuery<StockBatchWithDetails[]>({
    queryKey: ["/api/admin/inventory", selectedBranchId],
    queryFn: async () => {
      const params = selectedBranchId ? `?branchId=${encodeURIComponent(selectedBranchId)}` : "";
      const res = await apiRequest("GET", `/api/admin/inventory${params}`);
      return res.json();
    },
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/admin/branches"],
  });

  const createBatchMutation = useMutation({
    mutationFn: (payload: BatchFormState) =>
      apiRequest("POST", "/api/admin/inventory/batch", {
        productId: payload.productId,
        branchId: payload.branchId,
        batchNumber: payload.batchNumber,
        quantity: Number(payload.quantity),
        expiryDate: new Date(payload.expiryDate).toISOString(),
        costPrice: payload.costPrice,
        supplierName: payload.supplierName || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      setOpen(false);
      setForm((current) => ({
        ...emptyForm,
        branchId: current.branchId || selectedBranchId,
      }));
      toast({
        title: "Stock batch received",
        description: "Inventory oversight has been updated with the new batch.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Receive stock failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredBatches = useMemo(
    () =>
      stockBatches.filter((batch) => {
        const query = searchQuery.toLowerCase();
        return (
          batch.product?.name?.toLowerCase().includes(query) ||
          batch.branch?.name?.toLowerCase().includes(query) ||
          batch.batchNumber?.toLowerCase().includes(query)
        );
      }),
    [searchQuery, stockBatches],
  );

  const now = new Date();

  const expiringSoon = useMemo(() => {
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() + 3);
    return stockBatches.filter((batch) => {
      const expiryDate = new Date(batch.expiryDate);
      return expiryDate >= now && expiryDate <= threshold;
    });
  }, [stockBatches]);

  const expired = useMemo(
    () => stockBatches.filter((batch) => new Date(batch.expiryDate) < now),
    [now, stockBatches],
  );

  const lowStock = useMemo(
    () => stockBatches.filter((batch) => batch.quantity <= 10),
    [stockBatches],
  );

  const criticalAttention = useMemo(
    () =>
      stockBatches.filter((batch) => {
        const expiryDate = new Date(batch.expiryDate);
        const threshold = new Date();
        threshold.setMonth(threshold.getMonth() + 3);
        return batch.quantity <= 10 || expiryDate < now || (expiryDate >= now && expiryDate <= threshold);
      }),
    [now, stockBatches],
  );

  const isFormValid =
    Boolean(form.productId) &&
    Boolean(form.branchId) &&
    Boolean(form.batchNumber.trim()) &&
    Boolean(form.quantity) &&
    Boolean(form.expiryDate) &&
    Boolean(form.costPrice.trim());

  if (isLoading) {
    return <div>Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Control</h1>
          <p className="text-muted-foreground">
            Monitor stock levels, receive new batches, and protect branch inventory quality across
            the full platform.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Receive Stock
        </Button>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="branch-filter">Branch</Label>
          <select
            id="branch-filter"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={selectedBranchId}
            onChange={(event) => setSelectedBranchId(event.target.value)}
          >
            <option value="">All branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing {selectedBranchId ? "selected branch" : "all branches"} inventory.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tracked Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stockBatches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{lowStock.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-sky-600">{expiringSoon.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{expired.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-500/40">
        <CardHeader>
          <CardTitle>Critical Attention Queue</CardTitle>
          <CardDescription>
            Low-stock, expiring, or expired batches that need immediate admin follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {criticalAttention.length > 0 ? (
            criticalAttention.slice(0, 6).map((batch) => {
              const isExpiringSoon = expiringSoon.some((item) => item.id === batch.id);

              return (
                <div key={batch.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium">{batch.product?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {batch.branch?.name} | Batch {batch.batchNumber}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {batch.quantity <= 10 && <Badge className="bg-amber-500">Low stock</Badge>}
                    {isExpiringSoon && <Badge className="bg-sky-600">Expiring soon</Badge>}
                    {new Date(batch.expiryDate) < now && <Badge variant="destructive">Expired</Badge>}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              No low-stock or expiring batches currently need escalation.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Inventory Register</CardTitle>
              <CardDescription>
                Batch-level visibility across branches, suppliers, and expiry dates.
              </CardDescription>
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
                placeholder="Search product, branch, or batch"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => {
                  const isExpired = new Date(batch.expiryDate) < now;
                  const isExpiringSoon = !isExpired && expiringSoon.some((item) => item.id === batch.id);
                  const isLowStock = batch.quantity <= 10;

                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono text-xs">{batch.batchNumber}</TableCell>
                      <TableCell className="font-medium">{batch.product?.name}</TableCell>
                      <TableCell>{batch.branch?.name}</TableCell>
                      <TableCell>{batch.supplierName || "Warehouse"}</TableCell>
                      <TableCell>{batch.quantity}</TableCell>
                      <TableCell>{format(new Date(batch.expiryDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {isExpired && <Badge variant="destructive">Expired</Badge>}
                          {isExpiringSoon && <Badge className="bg-sky-600">Expiring soon</Badge>}
                          {isLowStock && <Badge className="bg-amber-500">Low stock</Badge>}
                          {!isExpired && !isExpiringSoon && !isLowStock && (
                            <Badge variant="outline">Healthy</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Package className="mx-auto mb-3 h-10 w-10 opacity-50" />
                    No inventory batches match the current search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Receive Stock</DialogTitle>
            <DialogDescription>
              Register a new batch so stock, expiry, and branch visibility stay accurate.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="stock-product">Product</Label>
              <select
                id="stock-product"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={form.productId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, productId: event.target.value }))
                }
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stock-branch">Branch</Label>
              <select
                id="stock-branch"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={form.branchId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, branchId: event.target.value }))
                }
              >
                <option value="">Select branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="stock-batch-number">Batch Number</Label>
                <Input
                  id="stock-batch-number"
                  value={form.batchNumber}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, batchNumber: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock-quantity">Quantity</Label>
                <Input
                  id="stock-quantity"
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, quantity: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="stock-expiry">Expiry Date</Label>
                <Input
                  id="stock-expiry"
                  type="date"
                  value={form.expiryDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, expiryDate: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock-cost">Cost Price</Label>
                <Input
                  id="stock-cost"
                  value={form.costPrice}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, costPrice: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stock-supplier">Supplier</Label>
              <Input
                id="stock-supplier"
                value={form.supplierName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, supplierName: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createBatchMutation.mutate(form)}
              disabled={!isFormValid || createBatchMutation.isPending}
            >
              {createBatchMutation.isPending ? "Receiving..." : "Receive Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
