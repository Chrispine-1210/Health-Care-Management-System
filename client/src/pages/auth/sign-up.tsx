import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Apple } from "lucide-react";
import { SiGoogle, SiGithub } from "react-icons/si";
import bgImage from "@assets/generated_images/healthcare_abstract_pattern_background.png";

export default function SignUp() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95 dark:from-background/98 dark:via-background/95 dark:to-background/98" />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border-0 bg-background/98 shadow-2xl backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <span className="text-xl font-bold text-primary-foreground">T</span>
              </div>
            </div>
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>Join Thandizo Pharmacy and access quality healthcare</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-2">
              <Card className="cursor-pointer border-dashed bg-muted/50 p-3 hover-elevate">
                <p className="text-center text-xs font-semibold">Customer</p>
                <p className="mt-1 text-center text-xs text-muted-foreground">Order and shop</p>
              </Card>
              <Card className="cursor-pointer border-dashed bg-muted/50 p-3 hover-elevate">
                <p className="text-center text-xs font-semibold">Driver</p>
                <p className="mt-1 text-center text-xs text-muted-foreground">Delivery services</p>
              </Card>
              <Card className="cursor-pointer border-dashed bg-muted/50 p-3 hover-elevate">
                <p className="text-center text-xs font-semibold">Pharmacist</p>
                <p className="mt-1 text-center text-xs text-muted-foreground">Prescription review</p>
              </Card>
              <Card className="cursor-pointer border-dashed bg-muted/50 p-3 hover-elevate">
                <p className="text-center text-xs font-semibold">Staff</p>
                <p className="mt-1 text-center text-xs text-muted-foreground">Point of sale</p>
              </Card>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <Button variant="outline" size="lg" className="w-full font-medium" asChild data-testid="button-signup-google">
                <a href="/signup">
                  <SiGoogle className="mr-3 h-5 w-5" />
                  Sign up with Google
                </a>
              </Button>

              <Button variant="outline" size="lg" className="w-full font-medium" asChild data-testid="button-signup-github">
                <a href="/signup">
                  <SiGithub className="mr-3 h-5 w-5" />
                  Sign up with GitHub
                </a>
              </Button>

              <Button variant="outline" size="lg" className="w-full font-medium" asChild data-testid="button-signup-apple">
                <a href="/signup">
                  <Apple className="mr-3 h-5 w-5" />
                  Sign up with Apple
                </a>
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Social sign-up buttons currently route to the secure account creation flow.
            </p>

            <Separator className="my-4" />

            <Button
              size="lg"
              className="w-full bg-primary font-medium text-primary-foreground hover:bg-primary/90"
              asChild
              data-testid="button-signup-email"
            >
              <a href="/signup">
                <Mail className="mr-3 h-5 w-5" />
                Sign up with Email
              </a>
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href="/login" className="font-semibold text-primary hover:underline">
                  Sign in here
                </a>
              </p>
            </div>

            <div className="border-t border-border pt-4 text-center">
              <p className="text-xs leading-relaxed text-muted-foreground">
                By creating an account, you agree to our Terms of Service and Privacy Policy. Your health information is encrypted and protected.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {"<- Back to Home"}
          </a>
        </div>
      </div>
    </div>
  );
}
