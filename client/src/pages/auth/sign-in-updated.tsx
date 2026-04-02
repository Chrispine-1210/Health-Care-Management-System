import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const DEMO_USERS = [
  { id: "customer-1", name: "John Doe", role: "customer", email: "customer@test.com" },
  { id: "driver-1", name: "Mthunzi Banda", role: "driver", email: "driver@test.com" },
  { id: "pharmacist-1", name: "Dr. Banda", role: "pharmacist", email: "pharmacist@test.com" },
  { id: "staff-1", name: "Gift Phiri", role: "staff", email: "staff@test.com" },
  { id: "admin-1", name: "Admin User", role: "admin", email: "admin@test.com" },
];

export default function SignInDemo() {
  const [selectedUser, setSelectedUser] = useState("customer-1");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (userId: string) => {
    setIsLoading(true);
    const user = DEMO_USERS.find(u => u.id === userId);
    if (user) {
      // Store the demo user
      sessionStorage.setItem("demoUser", JSON.stringify(user));
      sessionStorage.setItem("demoUserId", userId);
      
      // Brief delay to ensure storage is committed
      setTimeout(() => {
        window.location.href = "/";
      }, 50);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      customer: "bg-purple-100 text-purple-900 dark:bg-purple-900 dark:text-purple-100",
      driver: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
      pharmacist: "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100",
      staff: "bg-orange-100 text-orange-900 dark:bg-orange-900 dark:text-orange-100",
      admin: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
    };
    return colors[role] || "bg-gray-100 text-gray-900";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl">Thandizo Pharmacy</CardTitle>
          <CardDescription>Demo Sign In - Select a role to test</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={selectedUser} onValueChange={setSelectedUser} disabled={isLoading}>
            <div className="space-y-3">
              {DEMO_USERS.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => !isLoading && setSelectedUser(user.id)}
                  data-testid={`option-signin-${user.role}`}
                >
                  <RadioGroupItem value={user.id} id={user.id} />
                  <Label htmlFor={user.id} className="flex-1 cursor-pointer">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </Label>
                  <Badge className={getRoleColor(user.role)}>
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </RadioGroup>

          <Button 
            onClick={() => handleLogin(selectedUser)}
            size="lg"
            className="w-full"
            disabled={isLoading}
            data-testid="button-demo-login"
          >
            {isLoading ? "Signing In..." : `Sign In as ${DEMO_USERS.find(u => u.id === selectedUser)?.name}`}
          </Button>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Demo Mode:</strong> Select any role above to test the Thandizo Pharmacy system. Each role has different features and dashboards.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
