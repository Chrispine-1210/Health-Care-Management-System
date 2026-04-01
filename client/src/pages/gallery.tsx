import { MarketingLayout } from "@/components/MarketingLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GALLERY_ITEMS } from "@/lib/marketingContent";

export default function GalleryPage() {
  return (
    <MarketingLayout>
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Gallery</Badge>
        <h1 className="mt-6 text-4xl font-bold md:text-5xl">A visual tour of Thandizo workflows</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          See how branches, drivers, and clinical teams keep orders moving with clarity and speed.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {GALLERY_ITEMS.map((item) => (
            <Card key={item.id} className="overflow-hidden border-border/70">
              <img
                src={item.image}
                alt={item.title}
                className="h-48 w-full object-cover"
                loading="lazy"
              />
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button asChild size="lg">
            <a href="/sign-up">Activate a role</a>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="/">Back to Home</a>
          </Button>
        </div>
      </section>
    </MarketingLayout>
  );
}
