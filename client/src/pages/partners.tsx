import { MarketingLayout } from "@/components/MarketingLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PARTNERS } from "@/lib/marketingContent";
import { Handshake, MapPin, ShieldCheck, Truck } from "lucide-react";

const partnerHighlights = [
  {
    title: "Clinical Alignment",
    description: "Shared protocols ensure prescription safety and consistent patient counseling.",
    icon: ShieldCheck,
  },
  {
    title: "Regional Coverage",
    description: "Partner branches and clinics keep coverage strong across urban and rural routes.",
    icon: MapPin,
  },
  {
    title: "Logistics Excellence",
    description: "Delivery teams sync dispatch, proof of delivery, and patient updates.",
    icon: Truck,
  },
];

export default function PartnersPage() {
  return (
    <MarketingLayout>
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Partners</Badge>
        <h1 className="mt-6 text-4xl font-bold md:text-5xl">Trusted by clinics, pharmacies, and health networks</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Thandizo partners keep prescriptions safe, orders reliable, and operations connected across Malawi.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {partnerHighlights.map((item) => (
            <Card key={item.title} className="h-full">
              <CardContent className="p-6">
                <item.icon className="h-7 w-7 text-primary" />
                <h2 className="mt-4 text-lg font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {PARTNERS.map((partner) => (
            <Card key={partner.name} className="border-border/70">
              <CardContent className="flex gap-4 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Handshake className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{partner.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{partner.focus}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button asChild size="lg">
            <a href="/sign-up">Become a partner</a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/">Back to Home</a>
          </Button>
        </div>
      </section>
    </MarketingLayout>
  );
}
