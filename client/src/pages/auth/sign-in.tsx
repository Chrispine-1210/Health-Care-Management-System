import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Apple } from "lucide-react";
import { SiGoogle, SiGithub } from "react-icons/si";
import bgImage from "@assets/generated_images/healthcare_abstract_pattern_background.png";

export default function SignIn() {
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
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your Thandizo Pharmacy account</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OAuth Options */}
            <div className="space-y-3">
              <Button
                variant="outline"
                size="lg"
                className="w-full font-medium"
                asChild
                data-testid="button-signin-google"
              >
                <a href="/api/login?provider=google">
                  <SiGoogle className="w-5 h-5 mr-3" />
                  Continue with Google
                </a>
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="w-full font-medium"
                asChild
                data-testid="button-signin-github"
              >
                <a href="/api/login?provider=github">
                  <SiGithub className="w-5 h-5 mr-3" />
                  Continue with GitHub
                </a>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full font-medium"
                asChild
                data-testid="button-signin-apple"
              >
                <a href="/api/login?provider=apple">
                  <Apple className="w-5 h-5 mr-3" />
                  Continue with Apple
                </a>
              </Button>
            </div>

            <Separator className="my-4" />

            {/* Email Option */}
            <Button
              size="lg"
              className="w-full font-medium bg-primary text-primary-foreground hover:bg-primary/90"
              asChild
              data-testid="button-signin-email"
            >
              <a href="/api/login">
                <Mail className="w-5 h-5 mr-3" />
                Continue with Email
              </a>
            </Button>

            {/* Divider */}
            <Separator className="my-4" />

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <a href="/sign-up" className="text-primary font-semibold hover:underline">Sign up here</a>
              </p>
            </div>

            {/* Help Text */}
            <div className="pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                By signing in, you agree to our Terms of Service and Privacy Policy. We're committed to protecting your healthcare information.
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
