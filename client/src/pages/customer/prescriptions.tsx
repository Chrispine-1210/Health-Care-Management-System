import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CustomerNav } from "@/components/CustomerNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { FileText, Upload } from "lucide-react";
import type { Prescription } from "@shared/schema";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

export default function PrescriptionsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: prescriptions, isLoading } = useQuery<Prescription[]>({
    queryKey: ["/api/prescriptions/patient", user?.id],
    enabled: isAuthenticated && !authLoading && !!user?.id,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Please upload a file smaller than 5MB");
      }

      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const result = await apiRequest("POST", "/api/prescriptions", {
              fileUrl: typeof reader.result === "string" ? reader.result : null,
            });
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Prescription uploaded successfully!" });
      setSelectedFile(null);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions/patient", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload prescription",
        variant: "destructive",
      });
    },
  });

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
    <div className="min-h-screen bg-background">
      <CustomerNav />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Prescriptions</h1>
            <p className="text-muted-foreground">Upload and track your prescriptions</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-prescription">
                <Upload className="h-4 w-4 mr-2" />
                Upload Prescription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Prescription</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prescription-file">Select PDF or Image</Label>
                  <Input
                    id="prescription-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    data-testid="input-prescription-file"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-prescription"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </div>
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
        ) : prescriptions && prescriptions.length > 0 ? (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <Card key={prescription.id} className="hover-elevate active-elevate-2" data-testid={`prescription-card-${prescription.id}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Prescription #{prescription.id.slice(0, 8)}
                  </CardTitle>
                  <Badge className={getStatusColor(prescription.status)}>
                    {prescription.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted Date</p>
                      <p className="font-medium">
                        {format(new Date(prescription.createdAt!), 'PPp')}
                      </p>
                    </div>
                    {prescription.reviewedAt && (
                      <div>
                        <p className="text-sm text-muted-foreground">Reviewed Date</p>
                        <p className="font-medium">
                          {format(new Date(prescription.reviewedAt), 'PPp')}
                        </p>
                      </div>
                    )}
                  </div>
                  {prescription.reviewNotes && (
                    <div>
                      <p className="text-sm text-muted-foreground">Pharmacist Notes</p>
                      <p className="font-medium">{prescription.reviewNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No prescriptions uploaded</p>
              <p className="text-sm text-muted-foreground">
                Upload your prescriptions to get started
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
