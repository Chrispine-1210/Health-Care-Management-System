import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import type { Prescription } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function PharmacistPrescriptionDetailPage() {
  const { toast } = useToast();
  const { isPharmacist, isAuthenticated, isLoading: authLoading } = useAuth();
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isPharmacist)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isPharmacist, authLoading, toast]);

  const { data: prescription, isLoading } = useQuery<Prescription>({
    queryKey: ["/api/prescriptions", id],
    enabled: isAuthenticated && isPharmacist && !!id,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return apiRequest(`/api/prescriptions/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          reviewNotes: notes || undefined,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Prescription review submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions/pending"] });
      setLocation("/pharmacist/prescriptions");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to review prescription",
        variant: "destructive",
      });
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="space-y-8">
        <a href="/pharmacist/prescriptions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </a>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Prescription not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-chart-3 text-white';
      case 'under_review': return 'bg-chart-2 text-white';
      case 'approved': return 'bg-primary text-primary-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'dispensed': return 'bg-green-600 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <a href="/pharmacist/prescriptions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </a>
        </div>
        <h1 className="text-3xl font-bold">Review Prescription #{prescription.id.slice(0, 8)}</h1>
        <Badge className={getStatusColor(prescription.status)}>
          {prescription.status.replace(/_/g, ' ').toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-6">
        {/* Prescription Details */}
        <Card data-testid="card-prescription-details">
          <CardHeader>
            <CardTitle>Prescription Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Submitted Date</Label>
                <p className="font-medium">
                  {new Date(prescription.createdAt!).toLocaleString()}
                </p>
              </div>
              {prescription.reviewedAt && (
                <div>
                  <Label className="text-sm text-muted-foreground">Reviewed Date</Label>
                  <p className="font-medium">
                    {new Date(prescription.reviewedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {prescription.patientAllergies && prescription.patientAllergies.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">Patient Allergies</Label>
                <p className="font-medium">{prescription.patientAllergies.join(', ')}</p>
              </div>
            )}

            {prescription.patientConditions && prescription.patientConditions.length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">Patient Conditions</Label>
                <p className="font-medium">{prescription.patientConditions.join(', ')}</p>
              </div>
            )}

            {prescription.reviewNotes && (
              <div>
                <Label className="text-sm text-muted-foreground">Previous Notes</Label>
                <p className="font-medium p-3 bg-muted rounded-md">{prescription.reviewNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Form */}
        <Card data-testid="card-review-form">
          <CardHeader>
            <CardTitle>Review Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Pharmacist Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add your clinical review notes, drug interaction checks, or any concerns..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="textarea-review-notes"
                className="resize-none"
                rows={5}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="destructive"
                onClick={() => reviewMutation.mutate({ status: 'rejected' })}
                disabled={reviewMutation.isPending}
                data-testid="button-reject"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => reviewMutation.mutate({ status: 'approved' })}
                disabled={reviewMutation.isPending}
                data-testid="button-approve"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {reviewMutation.isPending ? "Processing..." : "Approve"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
