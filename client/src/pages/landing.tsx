import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  ShoppingCart, 
  Truck, 
  FileText, 
  Clock, 
  Shield,
  Phone,
  MapPin
} from "lucide-react";
import { CustomerNav } from "@/components/CustomerNav";

export default function Landing() {
  const features = [
    {
      icon: Pill,
      title: "Wide Range of Medications",
      description: "Access to prescription and over-the-counter medications from trusted manufacturers"
    },
    {
      icon: ShoppingCart,
      title: "Easy Online Ordering",
      description: "Browse and order medications from the comfort of your home"
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Distance-based pricing with quick delivery across Lilongwe and beyond"
    },
    {
      icon: FileText,
      title: "Prescription Management",
      description: "Upload and manage your prescriptions with pharmacist review"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Order anytime, anywhere with our always-available online platform"
    },
    {
      icon: Shield,
      title: "Licensed & Regulated",
      description: "Fully licensed by PMRA with certified pharmacists"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />
      
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge className="bg-primary/10 text-primary border-primary/20" data-testid="badge-hero">
              Trusted Healthcare in Malawi
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Your Health, <span className="text-primary">Our Priority</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Thandizo Pharmacy provides quality medications and healthcare services across Lilongwe. 
              Order online, consult with pharmacists, and get medications delivered to your doorstep.
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Button size="lg" className="text-lg px-8" asChild data-testid="button-shop-now">
                <a href="/api/login">Shop Medications</a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild data-testid="button-learn-more">
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Thandizo Pharmacy</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We combine traditional pharmacy services with modern technology to serve you better
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate active-elevate-2 cursor-pointer transition-all" data-testid={`card-feature-${index}`}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl md:text-3xl">Visit Our Branches</CardTitle>
                <CardDescription className="text-base">
                  Multiple locations across Lilongwe to serve you better
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Lilongwe Central Branch
                    </h3>
                    <p className="text-sm text-muted-foreground">City Centre, Area 3</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      +265 1 234 567
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Area 25 Branch
                    </h3>
                    <p className="text-sm text-muted-foreground">Near Crossroads Hotel</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      +265 1 234 568
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <Button className="w-full" size="lg" asChild data-testid="button-get-started">
                    <a href="/api/login">Get Started Today</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">© 2025 Thandizo Pharmacy. Licensed by PMRA. All rights reserved.</p>
            <p className="text-xs">Serving healthcare needs across Malawi with trust and professionalism.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
