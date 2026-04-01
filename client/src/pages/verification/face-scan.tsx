import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Camera, ArrowRight } from "lucide-react";

export default function FaceScanVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    if (cameraActive) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "user" } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((error) => {
          toast({
            title: "Camera access denied",
            description: "Please enable camera access to proceed",
            variant: "destructive",
          });
          setCameraActive(false);
        });
    }
  }, [cameraActive, toast]);

  const handleStartScan = async () => {
    setIsScanning(true);
    try {
      // Simulate face scan process
      await new Promise((resolve) => setTimeout(resolve, 4000));
      setScanComplete(true);
      toast({
        title: "Face scan successful!",
        description: "Your face has been verified",
      });
    } catch (error) {
      toast({
        title: "Scan failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="container mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Face Scan Verification</h1>
          <p className="text-muted-foreground">Complete liveness and identity verification with facial recognition</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex gap-4">
            {[
              { step: 0, title: "ID Details", icon: CheckCircle2 },
              { step: 1, title: "Face Scan", icon: Camera },
              { step: 2, title: "Phone OTP", icon: AlertCircle },
            ].map((item, idx) => (
              <div key={idx} className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      idx < 1 ? "bg-chart-1 text-white" : idx === 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx < 1 ? <CheckCircle2 className="h-6 w-6" /> : idx + 1}
                  </div>
                  <span className="text-sm font-semibold">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!scanComplete ? (
          <Card>
            <CardHeader>
              <CardTitle>Scan Your Face</CardTitle>
              <CardDescription>We'll use facial recognition to verify your identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Camera Feed or Preview */}
              <div className="bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Camera ready</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <div className="bg-chart-1/10 p-4 rounded-lg border border-chart-1/20">
                  <h4 className="font-semibold text-sm mb-2">Face Scan Instructions:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Position your face centered in the frame</li>
                    <li>✓ Ensure good lighting on your face</li>
                    <li>✓ Remove glasses if possible</li>
                    <li>✓ Keep a neutral expression</li>
                  </ul>
                </div>

                {isScanning && (
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <p className="text-sm text-primary flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      Scanning your face...
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!cameraActive ? (
                  <>
                    <Button variant="outline" className="flex-1" onClick={() => setLocation("/verification/national-id")}>
                      Back
                    </Button>
                    <Button onClick={() => setCameraActive(true)} className="flex-1" data-testid="button-start-camera">
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setCameraActive(false)}
                      disabled={isScanning}
                    >
                      Stop Camera
                    </Button>
                    <Button
                      onClick={handleStartScan}
                      disabled={isScanning}
                      className="flex-1"
                      data-testid="button-start-scan"
                    >
                      {isScanning ? "Scanning..." : "Start Scan"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-chart-1">
            <CardContent className="pt-6 text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-chart-1 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Face Verified!</h3>
              <p className="text-muted-foreground mb-6">Your face scan has been successfully verified</p>
              <Button onClick={() => setLocation("/verification/phone-otp")} className="w-full">
                Continue to Phone Verification
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
