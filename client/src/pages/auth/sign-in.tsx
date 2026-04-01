import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Apple } from "lucide-react";
import { SiGoogle, SiGithub } from "react-icons/si";
import bgImage from "@assets/generated_images/healthcare_abstract_pattern_background.png";

export default function SignIn() {
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
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your Thandizo Pharmacy account</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Button variant="outline" size="lg" className="w-full font-medium" asChild data-testid="button-signin-google">
                <a href="/login">
                  <SiGoogle className="mr-3 h-5 w-5" />
                  Continue with Google
                </a>
              </Button>

              <Button variant="outline" size="lg" className="w-full font-medium" asChild data-testid="button-signin-github">
                <a href="/login">
                  <SiGithub className="mr-3 h-5 w-5" />
                  Continue with GitHub
                </a>
              </Button>

              <Button variant="outline" size="lg" className="w-full font-medium" asChild data-testid="button-signin-apple">
                <a href="/login">
                  <Apple className="mr-3 h-5 w-5" />
                  Continue with Apple
                </a>
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Social sign-in buttons currently route to the secure email login flow.
            </p>

            <Separator className="my-4" />

            <Button
              size="lg"
              className="w-full bg-primary font-medium text-primary-foreground hover:bg-primary/90"
              asChild
              data-testid="button-signin-email"
            >
              <a href="/login">
                <Mail className="mr-3 h-5 w-5" />
                Continue with Email
              </a>
            </Button>

            <Separator className="my-4" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <a href="/signup" className="font-semibold text-primary hover:underline">
                  Sign up here
                </a>
              </p>
            </div>

            <div className="border-t border-border pt-4 text-center">
              <p className="text-xs leading-relaxed text-muted-foreground">
                By signing in, you agree to our Terms of Service and Privacy Policy. We&apos;re committed to protecting your healthcare information.
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
