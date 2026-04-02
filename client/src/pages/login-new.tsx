import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function LoginNew() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const { token } = await res.json();
      localStorage.setItem("auth_token", token);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      navigate("/");
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: "admin@thandizo.com", role: "Admin" },
    { email: "pharmacist@thandizo.com", role: "Pharmacist" },
    { email: "staff@thandizo.com", role: "Staff" },
    { email: "customer@thandizo.com", role: "Customer" },
    { email: "driver@thandizo.com", role: "Driver" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login - Thandizo Pharmacy</CardTitle>
          <CardDescription>JWT Authentication (Replit-Free)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password (any value works for demo)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full" data-testid="button-login">
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-semibold mb-3">Demo Accounts (Any Password):</p>
            <div className="space-y-2">
              {demoAccounts.map(({ email, role }) => (
                <button
                  key={email}
                  onClick={() => setEmail(email)}
                  className="w-full text-left p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-sm"
                  data-testid={`button-demo-${role.toLowerCase()}`}
                >
                  <div className="font-medium">{role}</div>
                  <div className="text-xs text-slate-500">{email}</div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
