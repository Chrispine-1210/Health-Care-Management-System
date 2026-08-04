import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SignupNew() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "customer",
  });
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest("POST", "/api/auth/register", formData);
      
      toast({
        title: "Success",
        description: "Account created. Sign in with your credentials.",
      });
      
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Signup failed. Please try again.",
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
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
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
              data-testid="input-password"
            />
            <Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
              <SelectTrigger data-testid="select-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Patient</SelectItem>
                <SelectItem value="driver">Delivery driver</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={loading} className="w-full" data-testid="button-signup">
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
