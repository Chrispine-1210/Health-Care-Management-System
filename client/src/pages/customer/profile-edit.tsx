import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CustomerNav } from "@/components/CustomerNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useState, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function ProfileEditPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
    allergies: user?.allergies?.join(", ") || "",
    chronicConditions: user?.chronicConditions?.join(", ") || "",
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest(`/api/users/${user?.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          allergies: formData.allergies.split(",").map((a) => a.trim()).filter(Boolean),
          chronicConditions: formData.chronicConditions
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, formData, toast]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 flex items-center gap-2">
          <a href="/profile">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </a>
        </div>

        <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies (comma separated)</Label>
                <Textarea
                  id="allergies"
                  placeholder="e.g., Penicillin, Pollen, Shellfish"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  data-testid="input-allergies"
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chronicConditions">Chronic Conditions (comma separated)</Label>
                <Textarea
                  id="chronicConditions"
                  placeholder="e.g., Diabetes, Hypertension, Asthma"
                  value={formData.chronicConditions}
                  onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
                  data-testid="input-conditions"
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <a href="/profile" className="flex-1">
                  <Button variant="outline" className="w-full" type="button">
                    Cancel
                  </Button>
                </a>
                <Button className="flex-1" type="submit" disabled={isSubmitting} data-testid="button-save">
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
