import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User, Branch } from "@shared/schema";
import {
  getAllRoleDefinitions,
  getRoleDefinition,
  type PlatformRole,
} from "@shared/roleCapabilities";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ role: "customer", branchId: "" });
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "customer",
    password: "",
    branchId: "",
  });
  const roleOptions = getAllRoleDefinitions();
  const selectedRoleDefinition = getRoleDefinition(formData.role as PlatformRole);
  const createRoleDefinition = getRoleDefinition(createForm.role as PlatformRole);
  const roleNeedsBranch = ["staff", "pharmacist", "driver"].includes(createForm.role);
  const editRoleNeedsBranch = ["staff", "pharmacist", "driver"].includes(formData.role);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [isAuthenticated, isAdmin, authLoading, toast]);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && isAdmin,
  });
  const { data: branches } = useQuery<Branch[]>({
    queryKey: ["/api/admin/branches"],
    enabled: isAuthenticated && isAdmin,
  });

  const filteredUsers = useMemo(() => users?.filter(
    (u) =>
      (u.email ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [], [users, searchQuery]);

  const handleEditRole = useCallback(async () => {
    if (!editingUser) return;

    try {
      if (editRoleNeedsBranch && !formData.branchId) {
        throw new Error("Branch assignment is required for this role");
      }
      await apiRequest(`/api/admin/users/${editingUser.id}/role`, {
        method: "PATCH",
        body: JSON.stringify(formData),
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      setOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
    }
  }, [editingUser, editRoleNeedsBranch, formData, queryClient, toast]);

  const handleCreateUser = useCallback(async () => {
    try {
      if (!createForm.email || !createForm.firstName || !createForm.lastName || !createForm.password) {
        throw new Error("All fields are required");
      }
      if (roleNeedsBranch && !createForm.branchId) {
        throw new Error("Branch assignment is required for this role");
      }

      await apiRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: createForm.email.trim(),
          firstName: createForm.firstName.trim(),
          lastName: createForm.lastName.trim(),
          role: createForm.role,
          password: createForm.password,
          branchId: createForm.branchId || undefined,
        }),
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setCreateOpen(false);
      setCreateForm({
        email: "",
        firstName: "",
        lastName: "",
        role: "customer",
        password: "",
        branchId: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  }, [createForm, queryClient, roleNeedsBranch, toast]);

  const handleStatusUpdate = useCallback(async (user: User, updates: { accountStatus?: "active" | "suspended"; isVerified?: boolean }) => {
    try {
      setStatusUpdatingId(user.id);
      await apiRequest(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setStatusUpdatingId(null);
    }
  }, [queryClient, toast]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-destructive text-destructive-foreground";
      case "pharmacist":
        return "bg-primary text-primary-foreground";
      case "staff":
        return "bg-chart-3 text-white";
      case "driver":
        return "bg-chart-2 text-white";
      case "customer":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "suspended"
      ? "bg-destructive/15 text-destructive"
      : "bg-emerald-500/15 text-emerald-700";
  };

  const getVerificationColor = (verified: boolean) => {
    return verified
      ? "bg-emerald-500/15 text-emerald-700"
      : "bg-amber-500/15 text-amber-700";
  };

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
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage user roles with clear capability boundaries across the platform.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  data-testid="input-create-email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-firstName">First Name</Label>
                <Input
                  id="create-firstName"
                  value={createForm.firstName}
                  onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                  data-testid="input-create-firstName"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-lastName">Last Name</Label>
                <Input
                  id="create-lastName"
                  value={createForm.lastName}
                  onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                  data-testid="input-create-lastName"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-role">Role</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) => setCreateForm({ ...createForm, role: value })}
                >
                  <SelectTrigger id="create-role" data-testid="select-create-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((roleOption) => (
                      <SelectItem key={roleOption.role} value={roleOption.role}>
                        {roleOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {roleNeedsBranch && (
                <div className="grid gap-2">
                  <Label htmlFor="create-branch">Branch</Label>
                  <Select
                    value={createForm.branchId}
                    onValueChange={(value) => setCreateForm({ ...createForm, branchId: value })}
                  >
                    <SelectTrigger id="create-branch" data-testid="select-create-branch">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {(branches ?? []).map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Required for staff, pharmacist, and driver accounts.
                  </p>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="create-password">Temporary Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  data-testid="input-create-password"
                />
              </div>
              {createRoleDefinition && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="font-medium">{createRoleDefinition.headline}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {createRoleDefinition.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {createRoleDefinition.responsibilities.map((responsibility) => (
                      <Badge key={responsibility} variant="outline">
                        {responsibility}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleCreateUser} data-testid="button-save-user">
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-users"
            />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Role Focus</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const roleDefinition = getRoleDefinition(user.role);
                      const accountStatus = user.accountStatus ?? "active";
                      const isVerified = user.isVerified ?? false;
                      const isStatusUpdating = statusUpdatingId === user.id;

                      return (
                      <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                        <TableCell>
                          <p className="font-medium">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : "N/A"}
                          </p>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(user.role)}>
                            {roleDefinition?.label || (user.role.charAt(0).toUpperCase() + user.role.slice(1))}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <p className="text-sm text-muted-foreground">
                            {roleDefinition?.summary || "No role summary available"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(accountStatus)}>
                            {accountStatus === "suspended" ? "Suspended" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getVerificationColor(isVerified)}>
                            {isVerified ? "Verified" : "Unverified"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <Dialog open={open && editingUser?.id === user.id} onOpenChange={setOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingUser(user);
                                    setFormData({ role: user.role, branchId: user.branchId || "" });
                                  }}
                                  data-testid={`button-edit-${user.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Update User Role</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                      <SelectTrigger id="role" data-testid="select-role">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {roleOptions.map((roleOption) => (
                                          <SelectItem key={roleOption.role} value={roleOption.role}>
                                            {roleOption.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  {selectedRoleDefinition && (
                                    <div className="rounded-lg border bg-muted/30 p-4">
                                      <p className="font-medium">{selectedRoleDefinition.headline}</p>
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        {selectedRoleDefinition.summary}
                                      </p>
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {selectedRoleDefinition.responsibilities.map((responsibility) => (
                                          <Badge key={responsibility} variant="outline">
                                            {responsibility}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    <Label htmlFor="branch">
                                      Branch {editRoleNeedsBranch ? "(required)" : "(optional)"}
                                    </Label>
                                    <Select
                                      value={formData.branchId}
                                      onValueChange={(value) =>
                                        setFormData({ ...formData, branchId: value })
                                      }
                                    >
                                      <SelectTrigger id="branch" data-testid="select-branch">
                                        <SelectValue placeholder="Select branch" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="">No branch</SelectItem>
                                        {(branches ?? []).map((branch) => (
                                          <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {editRoleNeedsBranch && (
                                      <p className="text-xs text-muted-foreground">
                                        Assign a branch for operational roles.
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                                      Cancel
                                    </Button>
                                    <Button className="flex-1" onClick={handleEditRole} data-testid="button-save-role">
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant={accountStatus === "suspended" ? "secondary" : "destructive"}
                              onClick={() =>
                                handleStatusUpdate(user, {
                                  accountStatus: accountStatus === "suspended" ? "active" : "suspended",
                                })
                              }
                              disabled={isStatusUpdating}
                              data-testid={`button-status-${user.id}`}
                            >
                              {accountStatus === "suspended" ? "Activate User" : "Suspend User"}
                            </Button>
                            <Button
                              size="sm"
                              variant={isVerified ? "outline" : "secondary"}
                              onClick={() => handleStatusUpdate(user, { isVerified: !isVerified })}
                              disabled={isStatusUpdating}
                              data-testid={`button-verify-${user.id}`}
                            >
                              {isVerified ? "Mark Unverified" : "Mark Verified"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
