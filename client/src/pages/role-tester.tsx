import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

type Role = 'customer' | 'pharmacist' | 'admin' | 'driver' | 'staff';

export default function RoleTesterPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<Role>('customer');

  useEffect(() => {
    if (user?.role) {
      setSelectedRole(user.role as Role);
    }
  }, [user]);

  const switchRoleMutation = useMutation({
    mutationFn: async (role: Role) => {
      return apiRequest(`/api/admin/users/${user?.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Switched to ${selectedRole} role. Refreshing...`,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to switch role",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const roles: { value: Role; label: string; description: string; color: string }[] = [
    {
      value: 'customer',
      label: 'Customer',
      description: 'Browse medications, place orders, book consultations',
      color: 'bg-blue-500',
    },
    {
      value: 'pharmacist',
      label: 'Pharmacist',
      description: 'Review prescriptions, manage clinical workflows',
      color: 'bg-green-500',
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'Manage inventory, users, branches, and system settings',
      color: 'bg-purple-500',
    },
    {
      value: 'driver',
      label: 'Driver',
      description: 'View delivery assignments and track routes',
      color: 'bg-orange-500',
    },
    {
      value: 'staff',
      label: 'Staff',
      description: 'Point of Sale terminal for in-store transactions',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2">Role Testing Dashboard</h1>
          <p className="text-muted-foreground mb-4">Switch between different roles to explore the application</p>
          <div className="inline-flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Current Role:</span>
            <Badge className="text-base px-3 py-1">{user?.role?.toUpperCase()}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {roles.map((role) => (
            <Card
              key={role.value}
              className={`cursor-pointer transition-all ${
                selectedRole === role.value ? 'ring-2 ring-primary' : ''
              }`}
              data-testid={`card-role-${role.value}`}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${role.color}`} />
                  <CardTitle className="text-lg">{role.label}</CardTitle>
                </div>
                <CardDescription>{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    setSelectedRole(role.value);
                    switchRoleMutation.mutate(role.value);
                  }}
                  disabled={switchRoleMutation.isPending || user?.role === role.value}
                  className="w-full"
                  data-testid={`button-switch-to-${role.value}`}
                >
                  {switchRoleMutation.isPending && selectedRole === role.value ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Switching...
                    </>
                  ) : user?.role === role.value ? (
                    'Current Role'
                  ) : (
                    'Switch to ' + role.label
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Role Access Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">How to Use</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Select a role above</li>
                  <li>Click "Switch to [Role]"</li>
                  <li>The app will refresh and show the interface for that role</li>
                  <li>After testing, come back here to switch to another role</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What Each Role Can Access</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-blue-600">👤 Customer</p>
                    <p className="text-muted-foreground">Shop, Cart, Checkout, Orders, Prescriptions, Consultations, Profile</p>
                  </div>
                  <div>
                    <p className="font-medium text-green-600">💊 Pharmacist</p>
                    <p className="text-muted-foreground">Dashboard, Prescription Queue, Prescription Review</p>
                  </div>
                  <div>
                    <p className="font-medium text-purple-600">⚙️ Admin</p>
                    <p className="text-muted-foreground">Dashboard, Inventory Management, User Management</p>
                  </div>
                  <div>
                    <p className="font-medium text-orange-600">🚗 Driver</p>
                    <p className="text-muted-foreground">Dashboard with delivery assignments and tracking</p>
                  </div>
                  <div>
                    <p className="font-medium text-red-600">💼 Staff</p>
                    <p className="text-muted-foreground">Point of Sale terminal for in-store transactions</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Your email is <span className="font-mono">{user?.email}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
