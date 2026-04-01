import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { CustomerNav } from "@/components/CustomerNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Calendar, Plus, Video, Phone, MapPin } from "lucide-react";
import type { Appointment } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function ConsultationsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "video",
    scheduledAt: "",
    chiefComplaint: "",
  });

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/patient", user?.id],
    enabled: isAuthenticated && !authLoading && !!user?.id,
  });

  type CreateAppointmentPayload = {
    type: string;
    scheduledAt: string;
    chiefComplaint: string;
    status: string;
    duration: number;
  };

  const createAppointmentMutation = useMutation<Response, Error, CreateAppointmentPayload>({
    mutationFn: async (data: CreateAppointmentPayload) => {
      return apiRequest("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          patientId: user?.id,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Appointment booked successfully!",
      });
      setFormData({ type: "video", scheduledAt: "", chiefComplaint: "" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/patient", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.scheduledAt || !formData.chiefComplaint) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createAppointmentMutation.mutate({
      type: formData.type,
      scheduledAt: new Date(formData.scheduledAt).toISOString(),
      chiefComplaint: formData.chiefComplaint,
      status: "scheduled",
      duration: 30,
    });
  }, [formData, toast, createAppointmentMutation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-chart-3 text-white';
      case 'confirmed': return 'bg-primary text-primary-foreground';
      case 'in_progress': return 'bg-chart-2 text-white';
      case 'completed': return 'bg-green-600 text-white';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      case 'no_show': return 'bg-chart-1 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in-person': return <MapPin className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Consultations</h1>
            <p className="text-muted-foreground">Book a consultation with our pharmacists</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-book-consultation">
                <Plus className="h-4 w-4 mr-2" />
                Book Consultation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book a Consultation</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Consultation Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type" data-testid="select-consultation-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="in-person">In-Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Date & Time</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    data-testid="input-scheduled-at"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="complaint">Chief Complaint</Label>
                  <Textarea
                    id="complaint"
                    placeholder="Describe what you'd like to consult about..."
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                    data-testid="input-chief-complaint"
                    className="resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createAppointmentMutation.isPending}
                  data-testid="button-submit-consultation"
                >
                  {createAppointmentMutation.isPending ? "Booking..." : "Book Consultation"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-64" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : appointments && appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="hover-elevate active-elevate-2" data-testid={`appointment-card-${appointment.id}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Consultation #{appointment.id.slice(0, 8)}
                  </CardTitle>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Scheduled Date & Time</p>
                      <p className="font-medium">
                        {format(new Date(appointment.scheduledAt), 'PPp')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getTypeIcon(appointment.type)}
                        <span className="font-medium capitalize">{appointment.type}</span>
                      </div>
                    </div>
                  </div>
                  {appointment.chiefComplaint && (
                    <div>
                      <p className="text-sm text-muted-foreground">Chief Complaint</p>
                      <p className="font-medium">{appointment.chiefComplaint}</p>
                    </div>
                  )}
                  {appointment.consultationNotes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Pharmacist Notes</p>
                      <p className="font-medium">{appointment.consultationNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No consultations booked</p>
              <p className="text-sm text-muted-foreground">
                Book a consultation with our pharmacists today
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
