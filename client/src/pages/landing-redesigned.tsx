import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Camera,
  Handshake,
  Heart,
  Mail,
  MapPin,
  Package,
  PhoneCall,
  Pill,
  Shield,
  Star,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import type { ContentItem, Product } from "@shared/schema";
import {
  BLOG_ARTICLES,
  PARTNERS,
  TEAM_MEMBERS,
  TESTIMONIALS,
  GALLERY_ITEMS,
  MARKETING_IMAGES,
} from "@/lib/marketingContent";

const roleHighlights = [
  {
    title: "Customers",
    icon: Users,
    color: "bg-amber-100 text-amber-700",
    items: [
      "Browse approved medicines",
      "Upload prescriptions securely",
      "Track deliveries in real time",
      "Book pharmacist consultations",
    ],
  },
  {
    title: "Drivers",
    icon: Truck,
    color: "bg-sky-100 text-sky-700",
    items: [
      "Receive assigned deliveries",
      "Confirm pickup and proof of delivery",
      "Report delivery status live",
      "Coordinate directly with staff and customers",
    ],
  },
  {
    title: "Pharmacists",
    icon: Pill,
    color: "bg-emerald-100 text-emerald-700",
    items: [
      "Review prescriptions and allergies",
      "Manage inventory and low-stock risk",
      "Approve medicine handoff to operations",
      "Support customers through chat",
    ],
  },
  {
    title: "Staff",
    icon: Package,
    color: "bg-indigo-100 text-indigo-700",
    items: [
      "Monitor chats and transactions",
      "Manage order approvals and fulfillment",
      "Use point-of-sale workflows",
      "Track performance across the platform",
    ],
  },
  {
    title: "Admin",
    icon: Shield,
    color: "bg-rose-100 text-rose-700",
    items: [
      "Oversee branches, products, and content",
      "Manage fulfillment and operations",
      "Monitor performance across roles",
      "Coordinate compliance and safety",
    ],
  },
];

const WORDS_PER_MINUTE = 200;

function estimateReadTime(content?: string | null) {
  if (!content) {
    return "4 min read";
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(3, Math.ceil(wordCount / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

const FALLBACK_BLOG_IMAGES = [
  MARKETING_IMAGES.brandWave,
  MARKETING_IMAGES.brandGrid,
  MARKETING_IMAGES.brandRibbon,
  MARKETING_IMAGES.brandPulse,
  MARKETING_IMAGES.consultationScene,
];

export default function Landing() {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 5 * 60 * 1000,
  });
  const { data: apiArticles = [] } = useQuery<ContentItem[]>({
    queryKey: ["/api/content/public"],
    staleTime: 5 * 60 * 1000,
  });

  const blogArticles = useMemo(() => {
    if (apiArticles.length > 0) {
      return apiArticles.slice(0, 3).map((article, index) => ({
        id: article.id,
        title: article.title,
        category: article.category || "Insights",
        readTime: estimateReadTime(article.content),
        excerpt:
          article.excerpt ||
          `${article.content.replace(/\s+/g, " ").slice(0, 140).trim()}...`,
        image: article.featuredImageUrl || FALLBACK_BLOG_IMAGES[index % FALLBACK_BLOG_IMAGES.length],
      }));
    }

    return BLOG_ARTICLES;
  }, [apiArticles]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_45%),linear-gradient(180deg,_rgba(15,23,42,0.02),_rgba(255,255,255,0.92))]">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <nav className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold">Thandizo Pharmacy</p>
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Malawi Health Platform
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition hover:text-foreground">
              Features
            </a>
            <a href="#roles" className="text-sm text-muted-foreground transition hover:text-foreground">
              Roles
            </a>
            <a href="#blog" className="text-sm text-muted-foreground transition hover:text-foreground">
              Blog
            </a>
            <a href="#partners" className="text-sm text-muted-foreground transition hover:text-foreground">
              Partners
            </a>
            <a href="#team" className="text-sm text-muted-foreground transition hover:text-foreground">
              Team
            </a>
            <a href="#testimonials" className="text-sm text-muted-foreground transition hover:text-foreground">
              Testimonials
            </a>
            <a href="#gallery" className="text-sm text-muted-foreground transition hover:text-foreground">
              Gallery
            </a>
            <a href="#contact" className="text-sm text-muted-foreground transition hover:text-foreground">
              Contact
            </a>
            <Link href="/login">
              <Button variant="outline" data-testid="button-signin-nav">
                Sign In
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[1.15fr,0.85fr] lg:items-center">
            <div>
              <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/15">
                Trusted pharmacy operations, delivery, and patient support
              </Badge>
              <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-6xl">
                From prescription approval to doorstep delivery, every role now has a dedicated workflow.
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
                Thandizo brings customers, pharmacists, drivers, staff, and administrators into one
                secure platform with order tracking, inventory control, and role-based visibility.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/login">
                  <Button size="lg" data-testid="button-get-started">
                    Access Platform
                  </Button>
                </Link>
                <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                  <a href="#features">Learn More</a>
                </Button>
                <Button size="lg" variant="secondary" asChild data-testid="button-contact-sales">
                  <a href="#contact">Contact Sales</a>
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden border-primary/20 bg-white/85 shadow-xl">
              <CardContent className="grid gap-5 p-6">
                <div className="overflow-hidden rounded-2xl border">
                  <img
                    src={MARKETING_IMAGES.consultationScene}
                    alt="Pharmacy consultation"
                    className="h-48 w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="rounded-2xl border bg-muted/30 p-5">
                  <p className="text-sm font-medium text-muted-foreground">Operational Snapshot</p>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-3xl font-bold text-primary">5 Roles</p>
                      <p className="text-sm text-muted-foreground">Strict role-specific dashboards</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-emerald-600">Live</p>
                      <p className="text-sm text-muted-foreground">Order and chat coordination</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-sky-600">Tracked</p>
                      <p className="text-sm text-muted-foreground">Driver movement and proof of delivery</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-amber-600">Monitored</p>
                      <p className="text-sm text-muted-foreground">Inventory, content, and approvals</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border bg-primary/5 p-5">
                  <p className="text-sm font-medium text-muted-foreground">What's improved</p>
                  <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <li>Role-isolated screens so customers no longer inherit internal tools.</li>
                    <li>Working CTAs for browsing, contact, education, and onboarding.</li>
                    <li>Real chat flow between roles with admin oversight support.</li>
                    <li>Faster admin creation flows for branches, products, and articles.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="catalog" className="container mx-auto px-4 py-20">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Catalog Preview</p>
              <h2 className="mt-2 text-4xl font-bold">Popular Medicines</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Customers can browse, pharmacists can validate, and staff can fulfill from one catalog.
              </p>
            </div>
            <Link href="/login">
              <Button variant="outline" data-testid="button-browse-all">
                Browse Full Catalog
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {products.slice(0, 6).map((product) => (
              <Card key={product.id} className="overflow-hidden border-border/70 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    {product.prescriptionRequired && <Badge variant="outline">Prescription</Badge>}
                  </div>
                  <p className="mt-5 text-2xl font-bold text-primary">MK {product.price}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.description || "Available through the Thandizo ordering workflow."}
                  </p>
                  <Link href="/login">
                    <Button className="mt-6 w-full" size="sm" data-testid={`button-add-cart-${product.id}`}>
                      Continue To Ordering
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}

            {products.length === 0 && (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                  <Pill className="h-8 w-8 text-muted-foreground" />
                  <p className="font-medium">Catalog preview is loading</p>
                  <p className="text-sm text-muted-foreground">
                    The full medicine list will appear here once the platform finishes loading.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <section id="features" className="bg-muted/40 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Core Platform</p>
              <h2 className="mt-2 text-4xl font-bold">Built for real pharmacy operations</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                These are the workflows that keep patients informed and teams aligned.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  icon: Truck,
                  title: "Delivery Tracking",
                  description:
                    "Assigned drivers, live status updates, ETA visibility, and proof-of-delivery support.",
                },
                {
                  icon: Package,
                  title: "Inventory Control",
                  description:
                    "Batch tracking, low-stock alerts, expiry visibility, and branch-level stock intake.",
                },
                {
                  icon: Users,
                  title: "Role Isolation",
                  description:
                    "Customers, drivers, pharmacists, staff, and admins now follow purpose-built interfaces.",
                },
                {
                  icon: TrendingUp,
                  title: "Operational Oversight",
                  description:
                    "Admins can monitor conversations, transaction flow, and fulfillment movement in one place.",
                },
              ].map((feature) => (
                <Card key={feature.title} className="h-full">
                  <CardContent className="p-6">
                    <feature.icon className="h-8 w-8 text-primary" />
                    <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
                    <p className="mt-3 text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="container mx-auto px-4 py-20">
          <div className="mb-12 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Role Design</p>
            <h2 className="mt-2 text-4xl font-bold">Every role has a clear lane</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No more mixed controls. Each team now sees the tools they actually need.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {roleHighlights.map((role) => (
              <Card key={role.title} className="h-full">
                <CardContent className="p-6">
                  <div className={`inline-flex rounded-2xl p-3 ${role.color}`}>
                    <role.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold">{role.title}</h3>
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {role.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="blog" className="bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Blog and Articles</p>
                <h2 className="mt-2 text-4xl font-bold">Actionable guidance for every role</h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  Playbooks, case notes, and operational tips from the Thandizo team.
                </p>
              </div>
              <Link href="/blog">
                <Button variant="outline" data-testid="button-view-blog">
                  View All Articles
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {blogArticles.map((article) => (
                <Card key={article.id} className="overflow-hidden border-border/70 shadow-sm">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="h-44 w-full object-cover"
                    loading="lazy"
                  />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2 font-medium uppercase tracking-[0.2em] text-primary">
                        <BookOpen className="h-4 w-4" />
                        {article.category}
                      </span>
                      <span>{article.readTime}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{article.title}</h3>
                    <p className="mt-3 text-sm text-muted-foreground">{article.excerpt}</p>
                    <Link href="/blog">
                      <Button variant="outline" className="mt-5" size="sm">
                        Read More
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="partners" className="container mx-auto px-4 py-20">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Partners</p>
              <h2 className="mt-2 text-4xl font-bold">Trusted networks strengthening every delivery</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                From clinics to logistics, Thandizo partners keep patient care consistent across Malawi.
              </p>
            </div>
            <Link href="/partners">
              <Button variant="outline" data-testid="button-view-partners">
                View Partners
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
        </section>

        <section id="team" className="bg-muted/40 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Team</p>
                <h2 className="mt-2 text-4xl font-bold">Clinical, operations, and delivery leaders</h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  The team guiding our branches, patient support, and delivery readiness.
                </p>
              </div>
              <Link href="/team">
                <Button variant="outline" data-testid="button-view-team">
                  Meet the Team
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {TEAM_MEMBERS.map((member) => (
                <Card key={member.name} className="overflow-hidden border-border/70 shadow-sm">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-48 w-full object-cover"
                    loading="lazy"
                  />
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold">{member.name}</h3>
                    <p className="text-sm font-medium text-primary">{member.role}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="container mx-auto px-4 py-20">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Testimonials</p>
              <h2 className="mt-2 text-4xl font-bold">Stories from the people doing the work</h2>
              <p className="mt-3 text-lg text-muted-foreground">
                Feedback from branch managers, pharmacists, and patients using Thandizo every day.
              </p>
            </div>
            <Link href="/testimonials">
              <Button variant="outline" data-testid="button-view-testimonials">
                View Stories
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {TESTIMONIALS.map((testimonial) => (
              <Card key={testimonial.name} className="border-border/70">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-primary">
                    <Star className="h-5 w-5" />
                    <p className="text-sm font-medium">Verified feedback</p>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">"{testimonial.quote}"</p>
                  <div className="mt-4">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="gallery" className="bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Gallery</p>
                <h2 className="mt-2 text-4xl font-bold">A visual tour of the platform</h2>
                <p className="mt-3 text-lg text-muted-foreground">
                  Photos and moments from branch operations, deliveries, and patient support.
                </p>
              </div>
              <Link href="/gallery">
                <Button variant="outline" data-testid="button-view-gallery">
                  View Full Gallery
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {GALLERY_ITEMS.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/70">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-48 w-full object-cover"
                    loading="lazy"
                  />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-primary">
                      <Camera className="h-4 w-4" />
                      <p className="text-xs font-medium uppercase tracking-[0.2em]">{item.title}</p>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="bg-primary/5 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">Contact</p>
              <h2 className="mt-2 text-4xl font-bold">Need help rolling this out?</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Reach out for onboarding, branch setup, or a guided walkthrough of the platform.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <Mail className="h-7 w-7 text-primary" />
                  <p className="mt-4 font-semibold">Sales and Onboarding</p>
                  <p className="mt-2 text-sm text-muted-foreground">sales@thandizo.com</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <PhoneCall className="h-7 w-7 text-primary" />
                  <p className="mt-4 font-semibold">Platform Support</p>
                  <p className="mt-2 text-sm text-muted-foreground">+265 888 10 10 10</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <MapPin className="h-7 w-7 text-primary" />
                  <p className="mt-4 font-semibold">Main Operations Hub</p>
                  <p className="mt-2 text-sm text-muted-foreground">Area 10, Lilongwe</p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/login">
                <Button size="lg" data-testid="button-signin-cta">
                  Sign In
                </Button>
              </Link>
              <Button size="lg" variant="outline" asChild>
                <a href="mailto:sales@thandizo.com">Email Sales</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>(c) 2026 Thandizo Pharmacy. Purpose-built for Malawi pharmacy operations.</p>
          <div className="flex flex-wrap gap-4">
            <a href="#features" className="transition hover:text-foreground">
              Features
            </a>
            <a href="#roles" className="transition hover:text-foreground">
              Roles
            </a>
            <a href="#blog" className="transition hover:text-foreground">
              Blog
            </a>
            <a href="#partners" className="transition hover:text-foreground">
              Partners
            </a>
            <a href="#team" className="transition hover:text-foreground">
              Team
            </a>
            <a href="#testimonials" className="transition hover:text-foreground">
              Testimonials
            </a>
            <a href="#gallery" className="transition hover:text-foreground">
              Gallery
            </a>
            <a href="#contact" className="transition hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}


