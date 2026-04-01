import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Phone, ArrowRight } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function PhoneOTPVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Missing phone number",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulate sending OTP
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setOtpSent(true);
      toast({
        title: "OTP sent!",
        description: `A 6-digit code has been sent to ${phoneNumber}`,
      });
    } catch (error) {
      toast({
        title: "Failed to send OTP",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      // Simulate OTP verification
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setVerificationComplete(true);
      toast({
        title: "Phone verified!",
        description: "Your phone number has been verified",
      });
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Invalid OTP, please try again",
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
          <h1 className="text-4xl font-bold mb-2">Phone Verification</h1>
          <p className="text-muted-foreground">Complete the final step to verify your account</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex gap-4">
            {[
              { step: 0, title: "ID Details", icon: CheckCircle2 },
              { step: 1, title: "Face Scan", icon: CheckCircle2 },
              { step: 2, title: "Phone OTP", icon: Phone },
            ].map((item, idx) => (
              <div key={idx} className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      idx < 2 ? "bg-chart-1 text-white" : idx === 2 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {idx < 2 ? <CheckCircle2 className="h-6 w-6" /> : idx + 1}
                  </div>
                  <span className="text-sm font-semibold">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!verificationComplete ? (
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Phone Number</CardTitle>
              <CardDescription>We'll send you a one-time code via SMS</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!otpSent ? (
                <>
                  {/* Phone Number Input */}
                  <div>
                    <Label htmlFor="phone-number">Phone Number</Label>
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="+265 123 456 7890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      data-testid="input-phone-number"
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Include country code for Malawi: +265</p>
                  </div>

                  {/* Info Box */}
                  <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      We'll send you a 6-digit verification code to this phone number. Standard SMS rates may apply.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setLocation("/verification/face-scan")}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSendOTP}
                      disabled={!phoneNumber.trim()}
                      className="flex-1"
                      data-testid="button-send-otp"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Send OTP
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* OTP Input */}
                  <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code sent to {phoneNumber}
                    </p>

                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        data-testid="input-otp"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} data-testid="input-otp-slot-0" />
                          <InputOTPSlot index={1} data-testid="input-otp-slot-1" />
                          <InputOTPSlot index={2} data-testid="input-otp-slot-2" />
                          <InputOTPSlot index={3} data-testid="input-otp-slot-3" />
                          <InputOTPSlot index={4} data-testid="input-otp-slot-4" />
                          <InputOTPSlot index={5} data-testid="input-otp-slot-5" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {isVerifying && (
                      <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                        <p className="text-sm text-primary flex items-center justify-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          Verifying...
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setOtpSent(false)}
                      disabled={isVerifying}
                    >
                      Change Number
                    </Button>
                    <Button
                      onClick={handleVerifyOTP}
                      disabled={isVerifying || otp.length !== 6}
                      className="flex-1"
                      data-testid="button-verify-otp"
                    >
                      {isVerifying ? "Verifying..." : "Verify"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-chart-1">
            <CardContent className="pt-6 text-center py-12 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-chart-1 mx-auto" />
              <h3 className="text-2xl font-bold">Account Fully Verified!</h3>
              <p className="text-muted-foreground">All verification steps completed successfully</p>
              <div className="bg-chart-1/10 p-4 rounded-lg border border-chart-1/20 text-left text-sm">
                <p className="font-semibold text-chart-1 mb-2">✓ National ID Verified</p>
                <p className="font-semibold text-chart-1 mb-2">✓ Face Scan Completed</p>
                <p className="font-semibold text-chart-1">✓ Phone Number Verified</p>
              </div>
              <Button onClick={() => setLocation("/")} className="w-full" size="lg">
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
