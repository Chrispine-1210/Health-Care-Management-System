import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCheck, Search, CheckCircle2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useCallback } from "react";
import type { Prescription } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function PharmacistPrescriptionsPage() {
  const { toast } = useToast();
  const { isPharmacist, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions/pending"],
    enabled: isAuthenticated && isPharmacist,
  });

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
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

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await apiRequest("PATCH", `/api/prescriptions/${id}/review`, { 
        status,
        reviewNotes: "Reviewed and processed by pharmacist." 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions/pending"] });
      toast({ title: "Prescription Updated", description: "The prescription status has been updated successfully." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Update Failed", 
        description: error.message || "Failed to update prescription status", 
        variant: "destructive" 
      });
    }
  });

  const filteredPrescriptions = useMemo(
    () => prescriptions?.filter(p =>
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientId?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [],
    [prescriptions, searchQuery]
  );

  const approvePrescription = useCallback(
    (id: string) => {
      reviewMutation.mutate({ id, status: "approved" });
    },
    [reviewMutation]
  );

  const rejectPrescription = useCallback(
    (id: string) => {
      reviewMutation.mutate({ id, status: "rejected" });
    },
    [reviewMutation]
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Prescription Review Queue</h1>
        <p className="text-muted-foreground">Manage and review all pending prescriptions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by prescription ID..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-prescriptions"
            />
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-prescriptions-list">
        <CardHeader>
          <CardTitle>Pending Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-md">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredPrescriptions.length > 0 ? (
            <div className="space-y-3">
              {filteredPrescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-md hover-elevate active-elevate-2"
                  data-testid={`prescription-row-${prescription.id}`}
                >
                  <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">Prescription #{prescription.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(prescription.createdAt!).toLocaleDateString()} at {new Date(prescription.createdAt!).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(prescription.status)}>
                      {prescription.status.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => reviewMutation.mutate({ id: prescription.id, status: 'approved' })}
                        disabled={reviewMutation.isPending}
                        data-testid={`button-approve-${prescription.id}`}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => reviewMutation.mutate({ id: prescription.id, status: 'rejected' })}
                        disabled={reviewMutation.isPending}
                        data-testid={`button-reject-${prescription.id}`}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No prescriptions found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try a different search" : "All prescriptions are reviewed"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
