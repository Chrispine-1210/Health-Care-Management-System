import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Branch } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken, getPostLoginRoute } from "@/lib/authSession";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClipboardCheck, IdCard, ScanFace, PhoneCall, ShieldCheck, Stethoscope } from "lucide-react";

export default function PharmacistOnboarding() {
  const { user, isPharmacist, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    licenseNumber: user?.licenseNumber || "",
    branchId: user?.branchId || "",
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }

    if (!isPharmacist) {
      setLocation(getPostLoginRoute(user?.role));
      return;
    }

    setForm({
      licenseNumber: user?.licenseNumber || "",
      branchId: user?.branchId || "",
    });
  }, [isAuthenticated, isPharmacist, setLocation, user?.branchId, user?.licenseNumber, user?.role]);

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
          branchId: form.branchId || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save pharmacist details");
      }

      toast({
        title: "Credentials saved",
        description: "Your license and branch preferences are on file.",
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
          <Badge className="w-fit bg-primary/10 text-primary">Pharmacist Onboarding</Badge>
          <h1 className="text-4xl font-bold">Confirm your clinical credentials</h1>
          <p className="text-muted-foreground">
            Finish verification to unlock prescription review and inventory workflows.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: "National ID",
              description: "Verify identity for clinical access.",
              icon: IdCard,
              href: "/verification/national-id",
            },
            {
              title: "Face Scan",
              description: "Add biometric verification for secure reviews.",
              icon: ScanFace,
              href: "/verification/face-scan",
            },
            {
              title: "Phone OTP",
              description: "Confirm the phone used for patient follow-ups.",
              icon: PhoneCall,
              href: "/verification/phone-otp",
            },
            {
              title: "License Review",
              description: "Provide a valid pharmacist license for approval.",
              icon: ShieldCheck,
              href: "/settings/account",
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
              <Stethoscope className="h-5 w-5" /> Pharmacist credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Professional license number</Label>
              <Input
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                placeholder="Enter license number"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Primary branch</Label>
              <Select
                value={form.branchId || undefined}
                onValueChange={(value) => setForm({ ...form, branchId: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} - {branch.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Credentials"}
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
