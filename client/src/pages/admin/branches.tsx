import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Branch } from "@shared/schema";
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
import { Building2, Mail, MapPin, Phone, Plus, User } from "lucide-react";

type BranchFormState = {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  managerId: string;
  licenseNumber: string;
  isActive: boolean;
};

const emptyForm: BranchFormState = {
  name: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  managerId: "",
  licenseNumber: "",
  isActive: true,
};

export default function AdminBranches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BranchFormState>(emptyForm);

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ["/api/admin/branches"],
  });

  const createMutation = useMutation({
    mutationFn: (payload: BranchFormState) =>
      apiRequest("POST", "/api/admin/branches", {
        ...payload,
        phone: payload.phone || null,
        email: payload.email || null,
        managerId: payload.managerId || null,
        licenseNumber: payload.licenseNumber || null,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/branches"] });
      setOpen(false);
      setForm(emptyForm);
      toast({
        title: "Branch created",
        description: "The new branch is now available for routing and inventory assignment.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Branch creation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading branches...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground">
            Manage branch availability, routing, and operational ownership across Malawi.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Branch
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => (
          <Card key={branch.id} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{branch.name}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  {branch.address}, {branch.city}
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  {branch.phone || "No phone"}
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  {branch.email || "No email"}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Badge variant={branch.isActive ? "default" : "secondary"}>
                    {branch.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    License: {branch.licenseNumber || "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Branch Directory</CardTitle>
          <CardDescription>Detailed view of all registered branches.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>{branch.city}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      {branch.managerId || "Unassigned"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={branch.isActive ? "default" : "destructive"}>
                      {branch.isActive ? "Online" : "Offline"}
                    </Badge>
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
            <DialogTitle>Create Branch</DialogTitle>
            <DialogDescription>
              Add a new location for orders, inventory, and team assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="branch-name">Branch Name</Label>
              <Input
                id="branch-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="branch-address">Address</Label>
              <Input
                id="branch-address"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="branch-city">City</Label>
                <Input
                  id="branch-city"
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branch-license">License Number</Label>
                <Input
                  id="branch-license"
                  value={form.licenseNumber}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      licenseNumber: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="branch-phone">Phone</Label>
                <Input
                  id="branch-phone"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branch-email">Email</Label>
                <Input
                  id="branch-email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="branch-manager">Manager Identifier</Label>
              <Input
                id="branch-manager"
                value={form.managerId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, managerId: event.target.value }))
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Branch Active</p>
                <p className="text-sm text-muted-foreground">
                  Enable order routing and operational visibility immediately.
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
              disabled={createMutation.isPending || !form.name || !form.address || !form.city}
            >
              {createMutation.isPending ? "Creating..." : "Create Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
