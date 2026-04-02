import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Apple } from "lucide-react";
import { SiGoogle, SiGithub } from "react-icons/si";
import bgImage from "@assets/generated_images/healthcare_abstract_pattern_background.png";

export default function SignUp() {
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95 dark:from-background/98 dark:via-background/95 dark:to-background/98"></div>
      <div className="w-full max-w-md relative z-10">
        <Card className="border-0 shadow-2xl bg-background/98 backdrop-blur-sm">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">T</span>
              </div>
            </div>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>Join Thandizo Pharmacy and access quality healthcare</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info Cards - Show role options */}
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3 cursor-pointer hover-elevate bg-muted/50 border-dashed">
                <p className="text-xs font-semibold text-center">👤 Customer</p>
                <p className="text-xs text-center text-muted-foreground mt-1">Order & shop</p>
              </Card>
              <Card className="p-3 cursor-pointer hover-elevate bg-muted/50 border-dashed">
                <p className="text-xs font-semibold text-center">🚗 Driver</p>
                <p className="text-xs text-center text-muted-foreground mt-1">Delivery services</p>
              </Card>
              <Card className="p-3 cursor-pointer hover-elevate bg-muted/50 border-dashed">
                <p className="text-xs font-semibold text-center">💊 Pharmacist</p>
                <p className="text-xs text-center text-muted-foreground mt-1">Prescription review</p>
              </Card>
              <Card className="p-3 cursor-pointer hover-elevate bg-muted/50 border-dashed">
                <p className="text-xs font-semibold text-center">👔 Staff</p>
                <p className="text-xs text-center text-muted-foreground mt-1">Point of sale</p>
              </Card>
            </div>

            <Separator className="my-4" />

            {/* OAuth Options */}
            <div className="space-y-3">
              <Button
                variant="outline"
                size="lg"
                className="w-full font-medium"
                asChild
                data-testid="button-signup-google"
              >
                <a href="/api/login?provider=google">
                  <SiGoogle className="w-5 h-5 mr-3" />
                  Sign up with Google
                </a>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="w-full font-medium"
                asChild
                data-testid="button-signup-github"
              >
                <a href="/api/login?provider=github">
                  <SiGithub className="w-5 h-5 mr-3" />
                  Sign up with GitHub
                </a>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full font-medium"
                asChild
                data-testid="button-signup-apple"
              >
                <a href="/api/login?provider=apple">
                  <Apple className="w-5 h-5 mr-3" />
                  Sign up with Apple
                </a>
              </Button>
            </div>

            <Separator className="my-4" />

            {/* Email Option */}
            <Button
              size="lg"
              className="w-full font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              asChild
              data-testid="button-signup-email"
            >
              <a href="/api/login">
                <Mail className="w-5 h-5 mr-3" />
                Sign up with Email
              </a>
            </Button>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href="/sign-in" className="text-primary font-semibold hover:underline">Sign in here</a>
              </p>
            </div>

            {/* Terms */}
            <div className="pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                By creating an account, you agree to our Terms of Service and Privacy Policy. Your health information is encrypted and protected.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
