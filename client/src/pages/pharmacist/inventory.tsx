import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Branch, Product, StockBatch } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
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
import { AlertTriangle, Package, Plus } from "lucide-react";

type InventoryBatch = StockBatch & {
  product: Product;
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

export default function PharmacistInventory() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BatchFormState>(emptyForm);

  const { data: batches = [], isLoading } = useQuery<InventoryBatch[]>({
    queryKey: ["/api/admin/inventory"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  const assignedBranch = branches.find((branch) => branch.id === user?.branchId);
  const canCreateBatch = isAdmin || !!user?.branchId;

  useEffect(() => {
    if (!form.branchId) {
      const nextBranchId = isAdmin ? branches[0]?.id : user?.branchId;
      if (nextBranchId) {
        setForm((current) => ({
          ...current,
          branchId: nextBranchId,
        }));
      }
    }
  }, [branches, form.branchId, isAdmin, user?.branchId]);

  const lowStock = batches.filter((batch) => batch.quantity < 50);
  const expiringSoon = batches.filter((batch) => {
    const expiry = new Date(batch.expiryDate);
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() + 3);
    return expiry < threshold;
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
        branchId: current.branchId || (isAdmin ? branches[0]?.id : user?.branchId) || "",
      }));
      toast({
        title: "Stock batch created",
        description: "Inventory tracking has been updated with the new batch.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Batch creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Inventory</h1>
          <p className="text-muted-foreground">
            Monitor stock levels, expiry dates, and batch information with pharmacist-level intake control.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!canCreateBatch}>
          <Plus className="mr-2 h-4 w-4" />
          Add Stock Batch
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-destructive/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Low Stock Alerts</CardTitle>
            <Package className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStock.length}</div>
            <p className="text-xs text-muted-foreground">Batches below the reorder threshold</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringSoon.length}</div>
            <p className="text-xs text-muted-foreground">Expiry inside the next 90 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tracked Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Active inventory records across branches" : "Active inventory records for your branch"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
          <CardDescription>Detailed view of medication batches and replenishment risk.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Batch #</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.product?.name}</TableCell>
                  <TableCell className="font-mono text-xs">{batch.batchNumber}</TableCell>
                  <TableCell>{batch.quantity} units</TableCell>
                  <TableCell>{new Date(batch.expiryDate).toLocaleDateString()}</TableCell>
                  <TableCell>{batch.supplierName || "Warehouse"}</TableCell>
                  <TableCell>
                    {batch.quantity < 50 ? (
                      <Badge variant="destructive">Low Stock</Badge>
                    ) : expiringSoon.some((item) => item.id === batch.id) ? (
                      <Badge variant="secondary">Expiring Soon</Badge>
                    ) : (
                      <Badge className="bg-emerald-600">Healthy</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Stock Batch</DialogTitle>
            <DialogDescription>
              Register newly received stock so low-stock, expiry, and branch availability stay accurate.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="inventory-product">Product</Label>
              <select
                id="inventory-product"
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
              <Label htmlFor="inventory-branch">Branch</Label>
              {isAdmin ? (
                <select
                  id="inventory-branch"
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
              ) : (
                <Input
                  id="inventory-branch"
                  value={assignedBranch?.name || "No branch assigned"}
                  readOnly
                />
              )}
              {!isAdmin && !user?.branchId && (
                <p className="text-xs text-destructive">
                  Assign a branch to this pharmacist before creating inventory.
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="batch-number">Batch Number</Label>
                <Input
                  id="batch-number"
                  value={form.batchNumber}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, batchNumber: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="batch-quantity">Quantity</Label>
                <Input
                  id="batch-quantity"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, quantity: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="batch-expiry">Expiry Date</Label>
                <Input
                  id="batch-expiry"
                  type="date"
                  value={form.expiryDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, expiryDate: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="batch-cost">Cost Price</Label>
                <Input
                  id="batch-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, costPrice: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="batch-supplier">Supplier</Label>
              <Input
                id="batch-supplier"
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
              disabled={
                createBatchMutation.isPending ||
                !form.productId ||
                !form.branchId ||
                !form.batchNumber ||
                !form.quantity ||
                !form.expiryDate ||
                !form.costPrice
              }
            >
              {createBatchMutation.isPending ? "Saving..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
