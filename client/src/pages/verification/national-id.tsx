import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Upload, FileCheck, ArrowRight } from "lucide-react";

export default function NationalIDVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [idNumber, setIdNumber] = useState("");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        return;
      }
      if (side === "front") {
        setFrontImage(file);
      } else {
        setBackImage(file);
      }
    }
  };

  const handleVerify = async () => {
    if (!idNumber.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your National ID number",
        variant: "destructive",
      });
      return;
    }

    if (!frontImage || !backImage) {
      toast({
        title: "Missing images",
        description: "Please upload both front and back of your ID",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      // Simulate verification process
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setVerificationStep(1);
      toast({
        title: "Verification successful!",
        description: "Your National ID has been verified",
      });
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">National ID Verification</h1>
          <p className="text-muted-foreground">Verify your identity to unlock all platform features</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex gap-4">
            {[
              { step: 0, title: "ID Details", icon: FileCheck },
              { step: 1, title: "Face Scan", icon: AlertCircle },
              { step: 2, title: "Phone OTP", icon: AlertCircle },
            ].map((item, idx) => (
              <div key={idx} className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      verificationStep > item.step
                        ? "bg-chart-1 text-white"
                        : verificationStep === item.step
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {verificationStep > item.step ? <CheckCircle2 className="h-6 w-6" /> : item.step + 1}
                  </div>
                  <span className="text-sm font-semibold">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {verificationStep === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Upload Your National ID</CardTitle>
              <CardDescription>Both sides of your ID are required for verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ID Number */}
              <div>
                <Label htmlFor="id-number">National ID Number</Label>
                <Input
                  id="id-number"
                  placeholder="Enter your National ID number"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  data-testid="input-national-id"
                  className="mt-2"
                />
              </div>

              {/* Front Image Upload */}
              <div>
                <Label>Front of ID</Label>
                <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "front")}
                    className="hidden"
                    id="front-upload"
                    data-testid="input-upload-id-front"
                  />
                  <label htmlFor="front-upload" className="cursor-pointer block">
                    {frontImage ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="h-8 w-8 text-chart-1 mx-auto" />
                        <p className="font-semibold text-sm">{frontImage.name}</p>
                        <p className="text-xs text-muted-foreground">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="font-semibold text-sm">Upload front of ID</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, or PDF (Max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Back Image Upload */}
              <div>
                <Label>Back of ID</Label>
                <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "back")}
                    className="hidden"
                    id="back-upload"
                    data-testid="input-upload-id-back"
                  />
                  <label htmlFor="back-upload" className="cursor-pointer block">
                    {backImage ? (
                      <div className="space-y-2">
                        <CheckCircle2 className="h-8 w-8 text-chart-1 mx-auto" />
                        <p className="font-semibold text-sm">{backImage.name}</p>
                        <p className="text-xs text-muted-foreground">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="font-semibold text-sm">Upload back of ID</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, or PDF (Max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Terms */}
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  Your National ID information is securely stored and encrypted. We only use it for verification purposes.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setLocation("/")}>
                  Cancel
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={isVerifying || !idNumber || !frontImage || !backImage}
                  className="flex-1"
                  data-testid="button-verify-id"
                >
                  {isVerifying ? "Verifying..." : "Verify National ID"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-chart-1">
            <CardContent className="pt-6 text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-chart-1 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">National ID Verified!</h3>
              <p className="text-muted-foreground mb-6">Your identity has been successfully verified</p>
              <Button onClick={() => setLocation("/verification/face-scan")} className="w-full">
                Continue to Face Scan
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
