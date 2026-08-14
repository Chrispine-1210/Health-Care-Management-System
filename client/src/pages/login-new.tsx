import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getPostLoginRoute, storeAuthenticatedSession } from "@/lib/authSession";

export default function LoginNew() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const result = await res.json() as { data: { token: string; refreshToken: string; user: any } };
      storeAuthenticatedSession(result.data);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      window.location.assign(getPostLoginRoute(result.data.user.role));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error && error.message.includes('429') ? "Too many attempts. Try again later." : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

          <div className="mt-6 text-center text-sm">
            Need an account? <a href="/signup" className="text-primary hover:underline">Register as a patient</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
