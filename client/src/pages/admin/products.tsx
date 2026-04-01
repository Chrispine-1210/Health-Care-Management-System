import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
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
import { Switch } from "@/components/ui/switch";
import { DollarSign, Package, Pill, Plus, Tag } from "lucide-react";

type ProductFormState = {
  sku: string;
  name: string;
  genericName: string;
  manufacturer: string;
  category: string;
  dosageForm: string;
  strength: string;
  description: string;
  price: string;
  prescriptionRequired: boolean;
  isActive: boolean;
};

const emptyForm: ProductFormState = {
  sku: "",
  name: "",
  genericName: "",
  manufacturer: "",
  category: "",
  dosageForm: "",
  strength: "",
  description: "",
  price: "",
  prescriptionRequired: false,
  isActive: true,
};

export default function AdminProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const categoryCount = useMemo(
    () => new Set(products.map((product) => product.category).filter(Boolean)).size,
    [products],
  );

  const prescriptionCount = useMemo(
    () => products.filter((product) => product.prescriptionRequired).length,
    [products],
  );

  const createMutation = useMutation({
    mutationFn: (payload: ProductFormState) =>
      apiRequest("POST", "/api/admin/products", {
        ...payload,
        genericName: payload.genericName || null,
        manufacturer: payload.manufacturer || null,
        category: payload.category || null,
        dosageForm: payload.dosageForm || null,
        strength: payload.strength || null,
        description: payload.description || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setOpen(false);
      setForm(emptyForm);
      toast({
        title: "Product added",
        description: "The new medicine is now available in the admin catalog.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Product creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Create catalog entries that flow directly into ordering, prescriptions, and inventory.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescription Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{prescriptionCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catalog Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              MK{" "}
              {products
                .reduce((sum, product) => sum + parseFloat(product.price.toString()), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medication Catalog</CardTitle>
          <CardDescription>Browse and manage all available medications.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price (MK)</TableHead>
                <TableHead>Prescription</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground">{product.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell>{product.category || "General"}</TableCell>
                  <TableCell>K{parseFloat(product.price.toString()).toLocaleString()}</TableCell>
                  <TableCell>
                    {product.prescriptionRequired ? (
                      <Badge variant="destructive">Required</Badge>
                    ) : (
                      <Badge variant="secondary">OTC</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Product</DialogTitle>
            <DialogDescription>
              Add a new medicine to the shared catalog for ordering and inventory workflows.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="product-sku">SKU</Label>
                <Input
                  id="product-sku"
                  value={form.sku}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sku: event.target.value.toUpperCase() }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="generic-name">Generic Name</Label>
                <Input
                  id="generic-name"
                  value={form.genericName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, genericName: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={form.manufacturer}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, manufacturer: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dosage-form">Dosage Form</Label>
                <Input
                  id="dosage-form"
                  value={form.dosageForm}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, dosageForm: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="strength">Strength</Label>
                <Input
                  id="strength"
                  value={form.strength}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, strength: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="price">Price (MK)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, price: event.target.value }))
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">Requires Prescription</p>
                  <p className="text-sm text-muted-foreground">
                    Enforce pharmacist review before checkout.
                  </p>
                </div>
                <Switch
                  checked={form.prescriptionRequired}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, prescriptionRequired: checked }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Active In Catalog</p>
                <p className="text-sm text-muted-foreground">
                  Make the new product visible to operational workflows immediately.
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isActive: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.sku || !form.name || !form.price}
            >
              {createMutation.isPending ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
