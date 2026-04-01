import { MarketingLayout } from "@/components/MarketingLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TESTIMONIALS } from "@/lib/marketingContent";
import { Quote } from "lucide-react";

export default function TestimonialsPage() {
  return (
    <MarketingLayout>
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Testimonials</Badge>
        <h1 className="mt-6 text-4xl font-bold md:text-5xl">Real stories from real pharmacy teams</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Hear from branch managers, pharmacists, patients, and partners who use Thandizo every day.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {TESTIMONIALS.map((testimonial) => (
            <Card key={testimonial.name} className="border-border/70">
              <CardContent className="p-6">
                <Quote className="h-6 w-6 text-primary" />
                <p className="mt-4 text-base text-muted-foreground">"{testimonial.quote}"</p>
                <div className="mt-4">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button asChild size="lg">
            <a href="/sign-up">See the platform</a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/">Back to Home</a>
          </Button>
        </div>
      </section>
    </MarketingLayout>
  );
}
