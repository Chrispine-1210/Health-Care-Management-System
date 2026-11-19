import { useState } from "react";
import { Link, useLocation } from "wouter";
import { PublicSite } from "@/components/public-site";
import { Label } from "@/components/ui/label";
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
    <PublicSite title="Create your account"><div className="th-auth">
      <Card className="w-full max-w-md bg-white text-slate-900">
        <CardHeader>
          <CardTitle>A little support starts here.</CardTitle>
          <CardDescription>Create a preview account using synthetic information. Do not submit real prescriptions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div><Label htmlFor="signup-first">First name</Label><Input
                id="signup-first" autoComplete="given-name" maxLength={100}
                type="text"
                placeholder="First name"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                data-testid="input-firstName"
              /></div>
              <div><Label htmlFor="signup-last">Last name</Label><Input
                id="signup-last" autoComplete="family-name" maxLength={100}
                type="text"
                placeholder="Last name"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                data-testid="input-lastName"
              /></div>
            </div>
            <div><Label htmlFor="signup-email">Email address</Label><Input
              id="signup-email" autoComplete="email" maxLength={254}
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              data-testid="input-email"
            /></div>
            <div><Label htmlFor="signup-password">Password (at least 12 characters)</Label><Input
              id="signup-password" autoComplete="new-password" minLength={12} maxLength={256}
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              data-testid="input-password"
            /></div>
            <Label>Account type</Label><Select value={formData.role} onValueChange={(role) => setFormData({ ...formData, role })}>
              <SelectTrigger data-testid="select-role" aria-label="Account type">
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
              <Link href="/sign-in" className="text-green-800 underline">Sign in</Link>
            </div>
          <p className="text-xs text-slate-600">Read the <Link href="/privacy" className="underline">privacy information</Link> and <Link href="/terms" className="underline">service terms</Link>. Live service activation is awaiting operator acceptance.</p></form>
        </CardContent>
      </Card>
    </div></PublicSite>
  );
}
