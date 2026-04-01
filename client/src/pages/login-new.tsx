import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getPostLoginRoute, storeAuthenticatedSession } from "@/lib/authSession";
import { getAllRoleDefinitions, type PlatformRole } from "@shared/roleCapabilities";

export default function LoginNew() {
  const roleOptions = getAllRoleDefinitions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<PlatformRole | "">("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!role) {
        throw new Error("Select the role you want to access before signing in.");
      }

      const normalizedEmail = email.trim().toLowerCase();
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password, role }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Sign in failed");
      }

      storeAuthenticatedSession({
        token: result.data.token,
        refreshToken: result.data.refreshToken,
        user: result.data.user,
      });
      
      toast({
        title: "Success",
        description: "Signed in successfully",
      });
      
      navigate(getPostLoginRoute(result.data.user?.role));
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid email or password",
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
          <CardTitle>Sign In - Thandizo Pharmacy</CardTitle>
          <CardDescription>
            Select your role and sign in with your registered credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Choose your workspace role</p>
                {role && (
                  <Badge variant="outline">
                    {roleOptions.find((option) => option.role === role)?.label ?? "Selected"}
                  </Badge>
                )}
              </div>
              <div className="grid gap-3">
                {roleOptions.map((roleOption) => {
                  const isSelected = role === roleOption.role;
                  return (
                    <button
                      type="button"
                      key={roleOption.role}
                      onClick={() => setRole(roleOption.role)}
                      className={`rounded-lg border p-3 text-left transition ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border/70 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{roleOption.label}</p>
                          <p className="text-xs text-muted-foreground">{roleOption.headline}</p>
                        </div>
                        {isSelected && <Badge className="h-fit" variant="outline">Selected</Badge>}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{roleOption.summary}</p>
                    </button>
                  );
                })}
              </div>
            </div>
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full" data-testid="button-login">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            Sign-in attempts are rate-limited to protect accounts from repeated abuse.
          </p>

          <div className="mt-4 text-center text-sm">
            Need an account?{" "}
            <Link href="/sign-up">
              <span className="cursor-pointer text-primary hover:underline">Sign up</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
