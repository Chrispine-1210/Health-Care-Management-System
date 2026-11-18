import { useState } from "react";
import { Link } from "wouter";
import { PublicSite } from "@/components/public-site";
import { Label } from "@/components/ui/label";
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
    <PublicSite title="Sign in"><div className="th-auth">
      <Card className="w-full max-w-md bg-white text-slate-900">
        <CardHeader>
          <CardTitle>Welcome back.</CardTitle>
          <CardDescription>Sign in to your Thandizo account. Use synthetic information in this preview.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email address</Label>
              <Input
                id="login-email" autoComplete="username" maxLength={254}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password" autoComplete="current-password" maxLength={256}
                type="password"
                placeholder="Your password"
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
            Need an account? <Link href="/sign-up" className="text-green-800 underline">Create your account</Link>
          </div>
        </CardContent>
      </Card>
    </div></PublicSite>
  );
}
