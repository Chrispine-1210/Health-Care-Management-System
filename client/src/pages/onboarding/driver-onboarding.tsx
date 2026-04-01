import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken, getPostLoginRoute } from "@/lib/authSession";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IdCard, ScanFace, PhoneCall, Truck, ClipboardCheck } from "lucide-react";

export default function DriverOnboarding() {
  const { user, isDriver, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    licenseNumber: user?.licenseNumber || "",
    vehicleInfo: user?.vehicleInfo || "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (!isDriver) {
      setLocation(getPostLoginRoute(user?.role));
      return;
    }

    setForm({
      licenseNumber: user?.licenseNumber || "",
      vehicleInfo: user?.vehicleInfo || "",
    });
  }, [isAuthenticated, isDriver, setLocation, user?.licenseNumber, user?.role, user?.vehicleInfo]);

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      const token = getAuthToken();
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          licenseNumber: form.licenseNumber.trim(),
          vehicleInfo: form.vehicleInfo.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save driver details");
      }

      toast({
        title: "Driver details saved",
        description: "Your license and vehicle details are on file.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unable to save details",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3">
          <Badge className="w-fit bg-primary/10 text-primary">Driver Onboarding</Badge>
          <h1 className="text-4xl font-bold">Verify your driver profile</h1>
          <p className="text-muted-foreground">
            Complete the verification steps below to activate delivery assignments and dashboard access.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "National ID",
              description: "Confirm identity before receiving delivery tasks.",
              icon: IdCard,
              href: "/verification/national-id",
            },
            {
              title: "Face Scan",
              description: "Secure driver verification with quick facial capture.",
              icon: ScanFace,
              href: "/verification/face-scan",
            },
            {
              title: "Phone OTP",
              description: "Verify the phone used for delivery coordination.",
              icon: PhoneCall,
              href: "/verification/phone-otp",
            },
          ].map((step) => (
            <Card key={step.title} className="h-full">
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <step.icon className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <p className="text-lg font-semibold">{step.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a href={step.href}>Start Verification</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Driver details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Driver license number</Label>
              <Input
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                placeholder="Enter license number"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Vehicle information</Label>
              <Input
                value={form.vehicleInfo}
                onChange={(e) => setForm({ ...form, vehicleInfo: e.target.value })}
                placeholder="Vehicle make, plate number"
                className="mt-2"
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Driver Details"}
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <a href={getPostLoginRoute(user?.role)}>
              <ClipboardCheck className="mr-2 h-4 w-4" /> Go to Dashboard
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="/">Back to Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
