import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import type { Delivery } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function DeliveryUpdatePage() {
  const { isDriver, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  const { data: delivery, isLoading } = useQuery<Delivery>({
    queryKey: ["/api/deliveries", id],
    enabled: isAuthenticated && isDriver && !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/deliveries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          deliveryNotes: notes || undefined,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Delivery status updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/driver/deliveries/active"] });
      window.history.back();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update delivery",
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
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="space-y-8">
        <a href="/driver">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </a>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Delivery not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <a href="/driver">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deliveries
          </Button>
        </a>
        <h1 className="text-3xl font-bold">Update Delivery Status</h1>
        <Badge>Order #{delivery.orderId.slice(0, 8)}</Badge>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Delivery Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Delivery Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this delivery (e.g., customer feedback, issues encountered)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="textarea-notes"
                className="resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <a href="/driver" className="flex-1">
                <Button variant="outline" className="w-full" type="button">
                  Cancel
                </Button>
              </a>
              <Button
                className="flex-1"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                data-testid="button-update"
              >
                {updateMutation.isPending ? "Updating..." : "Update Status"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
