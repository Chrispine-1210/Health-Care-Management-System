import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getPostLoginRoute, storeAuthenticatedSession } from "@/lib/authSession";
import { getAllRoleDefinitions, type PlatformRole } from "@shared/roleCapabilities";

export default function SignupNew() {
  const roleOptions = getAllRoleDefinitions();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "" as PlatformRole | "",
  });
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
        throw new Error("Password must include both letters and numbers");
      }

      if (!formData.role) {
        throw new Error("Select the account role you want to create.");
      }

      const normalizedEmail = formData.email.trim().toLowerCase();
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();

      const registerRes = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password: formData.password,
          firstName,
          lastName,
          role: formData.role,
        }),
      });

      const result = await registerRes.json();
      if (!registerRes.ok) {
        throw new Error(result.message || "Sign up failed");
      }
      storeAuthenticatedSession({
        token: result.data.token,
        refreshToken: result.data.refreshToken,
        user: result.data.user,
      });
      
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      
      const selectedRole = result.data.user?.role;
      if (selectedRole === "driver") {
        navigate("/onboarding/driver");
      } else if (selectedRole === "pharmacist") {
        navigate("/onboarding/pharmacist");
      } else {
        navigate(getPostLoginRoute(selectedRole));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Sign up failed. Please try again.",
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
          <CardTitle>Sign Up - Thandizo Pharmacy</CardTitle>
          <CardDescription>Create your account and select the role that matches your work.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Choose your account role</p>
                {formData.role && (
                  <Badge variant="outline">
                    {roleOptions.find((role) => role.role === formData.role)?.label ?? "Selected"}
                  </Badge>
                )}
              </div>
              <div className="grid gap-3">
                {roleOptions.map((roleOption) => {
                  const isSelected = formData.role === roleOption.role;
                  return (
                    <button
                      type="button"
                      key={roleOption.role}
                      onClick={() => setFormData({ ...formData, role: roleOption.role })}
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
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                data-testid="input-firstName"
              />
              <Input
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                data-testid="input-lastName"
              />
            </div>
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              data-testid="input-email"
            />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              data-testid="input-password"
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={8}
              data-testid="input-confirm-password"
            />
            <Button type="submit" disabled={loading} className="w-full" data-testid="button-signup">
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/sign-in">
                <span className="cursor-pointer text-primary hover:underline">Sign in</span>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
