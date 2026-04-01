import { MarketingLayout } from "@/components/MarketingLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TEAM_MEMBERS } from "@/lib/marketingContent";

export default function TeamPage() {
  return (
    <MarketingLayout>
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Our Team</Badge>
        <h1 className="mt-6 text-4xl font-bold md:text-5xl">Built by pharmacy and delivery experts</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Meet the people shaping clinical safety, customer support, and operational excellence at Thandizo.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {TEAM_MEMBERS.map((member) => (
            <Card key={member.name} className="overflow-hidden border-border/70 shadow-sm">
              <img
                src={member.image}
                alt={member.name}
                className="h-48 w-full object-cover"
                loading="lazy"
              />
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">{member.name}</h2>
                <p className="text-sm font-medium text-primary">{member.role}</p>
                <p className="mt-3 text-sm text-muted-foreground">{member.bio}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button asChild size="lg">
            <a href="/sign-up">Join the platform</a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/">Back to Home</a>
          </Button>
        </div>
      </section>
    </MarketingLayout>
  );
}
