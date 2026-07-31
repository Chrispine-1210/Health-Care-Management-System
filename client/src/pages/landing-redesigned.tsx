import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Cloud,
  HeartPulse,
  LockKeyhole,
  MapPin,
  Package,
  Pill,
  ShieldCheck,
  Smartphone,
  Stethoscope,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

const assuranceItems = [
  "PMRA-aware pharmacy workflows",
  "Encrypted sessions and hardened headers",
  "Live readiness checks for production uptime",
  "Cloudflare + Vercel deployment checklist",
];

const capabilities = [
  {
    icon: Pill,
    title: "Clinical pharmacy operations",
    description:
      "Prescription intake, pharmacist review queues, stock batches, expiry monitoring, and medicine catalog control in one secure workspace.",
  },
  {
    icon: Truck,
    title: "Delivery command centre",
    description:
      "Route visibility, driver assignment, customer tracking, proof-of-delivery support, and distance-aware delivery pricing.",
  },
  {
    icon: ShieldCheck,
    title: "Security-first access",
    description:
      "Role-based dashboards for administrators, pharmacists, staff, drivers, and customers with audit-friendly operational separation.",
  },
  {
    icon: Activity,
    title: "Quality of service",
    description:
      "Health probes, production headers, caching safeguards, and low-bandwidth friendly PWA behavior for reliable healthcare access.",
  },
  {
    icon: Cloud,
    title: "Cloud deployment ready",
    description:
      "Vercel static delivery, external API base URL support, Cloudflare DNS guidance, HTTPS, and edge security recommendations.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first experience",
    description:
      "Responsive patient shopping, prescription upload, order updates, and branch workflows optimized for phones and tablets.",
  },
];

const roleHighlights = [
  ["Customers", "Order medicines, upload prescriptions, track delivery, and manage personal healthcare access."],
  ["Pharmacists", "Review prescriptions, validate stock, detect clinical risks, and approve fulfilment."],
  ["Staff", "Run POS, prepare orders, coordinate pickups, and keep branch operations moving."],
  ["Drivers", "Receive assignments, update delivery status, and maintain accountable last-mile service."],
  ["Admins", "Monitor branches, users, audit logs, analytics, and service quality from one cockpit."],
];

export default function Landing() {
  const { data: products, isLoading, isError } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 5 * 60 * 1000,
    throwOnError: false,
  });

  const featuredProducts = products?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.20),transparent_32rem),linear-gradient(135deg,hsl(var(--background)),hsl(var(--accent)/0.55))]">
      <header className="sticky top-0 z-50 border-b bg-background/85 shadow-sm backdrop-blur-xl">
        <nav className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand-home">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <div className="text-lg font-black leading-none tracking-tight text-primary sm:text-2xl">
                Thandizo Healthcare
              </div>
              <p className="hidden text-xs font-medium text-muted-foreground sm:block">
                Secure pharmacy cloud platform
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#platform" className="transition hover:text-primary">Platform</a>
            <a href="#quality" className="transition hover:text-primary">Security</a>
            <a href="#cloud" className="transition hover:text-primary">Cloud</a>
          </div>

          <Link href="/sign-in">
            <Button className="gap-2" data-testid="button-signin-nav">
              Sign In <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="container mx-auto grid items-center gap-12 px-4 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <Badge className="mb-6 border-primary/20 bg-primary/10 px-4 py-2 text-primary hover:bg-primary/15">
              Production-ready healthcare operations for Malawi
            </Badge>
            <h1 className="max-w-4xl text-5xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Secure pharmacy care, delivery, and operations for Malawi.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Thandizo Healthcare unifies prescription review, medicine ordering, branch inventory,
              driver tracking, and executive oversight with the security and deployment discipline needed
              for a serious production rollout.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-in">
                <Button size="lg" className="gap-2 px-8" data-testid="button-get-started">
                  Launch secure demo <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#cloud">
                <Button size="lg" variant="outline" className="w-full gap-2 px-8 sm:w-auto">
                  View production plan <Cloud className="h-5 w-5" />
                </Button>
              </a>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {assuranceItems.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <Card className="relative border-primary/10 bg-background/90 shadow-2xl shadow-primary/10 backdrop-blur">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Executive cockpit</p>
                  <h2 className="mt-2 text-2xl font-black">Live service posture</h2>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300">
                  Online
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border bg-card p-4">
                  <Clock3 className="mb-3 h-6 w-6 text-primary" />
                  <p className="text-3xl font-black">99.9%</p>
                  <p className="text-sm text-muted-foreground">Target uptime posture</p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <LockKeyhole className="mb-3 h-6 w-6 text-primary" />
                  <p className="text-3xl font-black">TLS</p>
                  <p className="text-sm text-muted-foreground">Cloudflare protected domain</p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <Users className="mb-3 h-6 w-6 text-primary" />
                  <p className="text-3xl font-black">5</p>
                  <p className="text-sm text-muted-foreground">Role-based workspaces</p>
                </div>
                <div className="rounded-2xl border bg-card p-4">
                  <MapPin className="mb-3 h-6 w-6 text-primary" />
                  <p className="text-3xl font-black">MW</p>
                  <p className="text-sm text-muted-foreground">Built for Malawi operations</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-primary p-5 text-primary-foreground">
                <div className="flex items-center gap-3">
                  <Zap className="h-6 w-6" />
                  <div>
                    <p className="font-bold">Production fixes included</p>
                    <p className="text-sm opacity-90">API base URL support, health probes, secure headers, and Vercel edge routing.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="platform" className="container mx-auto px-4 py-16">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <Badge variant="outline" className="mb-4">Platform</Badge>
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">A healthcare system that looks premium and works hard.</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Every screen supports a real operational journey: patient access, pharmacist safety, stock control, fulfilment, delivery, and management oversight.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="group border-primary/10 bg-background/80 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10" data-testid={`card-capability-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <CardContent className="p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black">{title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-background/70 py-16" id="quality">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <Badge variant="outline" className="mb-4">Security & QoS</Badge>
              <h2 className="text-4xl font-black tracking-tight">Built for safe healthcare delivery, not just a demo.</h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">
                The production posture now prioritizes browser security, predictable caching, custom-domain HTTPS, API separation, and operational probes.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Strict transport security and hardened content policies",
                "No accidental server bundle exposure through SPA fallbacks",
                "Network-first API behavior for live healthcare data",
                "Cloudflare DNS, SSL, firewall, and cache recommendations documented",
              ].map((item) => (
                <div key={item} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <CheckCircle2 className="mb-4 h-6 w-6 text-primary" />
                  <p className="font-semibold leading-7">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <Card className="border-primary/10 bg-primary text-primary-foreground shadow-2xl shadow-primary/20" id="cloud">
              <CardContent className="p-8 sm:p-10">
                <Badge className="mb-5 bg-white/15 text-white hover:bg-white/20">Vercel + Cloudflare</Badge>
                <h2 className="text-4xl font-black tracking-tight">Production-ready custom-domain deployment.</h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 opacity-90">
                  Deploy the static web app on Vercel, point Cloudflare DNS to Vercel, set
                  <code className="mx-1 rounded bg-white/15 px-1.5 py-0.5">VITE_API_BASE_URL</code>
                  to the secure API host, and use Cloudflare for TLS, WAF rules, and uptime controls.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/sign-in">
                    <Button size="lg" variant="secondary" className="gap-2" data-testid="button-signin-cloud">
                      Enter system <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <a href="/manifest.json">
                    <Button size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
                      PWA manifest
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/90">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-2xl font-black">Role coverage</h3>
                <div className="mt-6 space-y-4">
                  {roleHighlights.map(([role, description]) => (
                    <div key={role} className="rounded-2xl border bg-card p-4">
                      <p className="font-black text-primary">{role}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <Badge variant="outline" className="mb-3">Medicine access</Badge>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Featured medicine catalog</h2>
              <p className="mt-2 text-muted-foreground">Live sample products load from the production API when available.</p>
            </div>
            <Link href="/sign-in">
              <Button variant="outline" data-testid="button-browse-all">Browse full catalog</Button>
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Card key={product.id} className="bg-background/90" data-testid={`card-product-${product.id}`}>
                  <CardContent className="p-6">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                      {product.prescriptionRequired && <Badge variant="outline">Rx</Badge>}
                    </div>
                    <p className="mt-5 text-2xl font-black text-primary">MK {product.price}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="md:col-span-3">
                <CardContent className="p-8 text-center">
                  <Stethoscope className="mx-auto mb-3 h-10 w-10 text-primary" />
                  <p className="font-semibold">{isLoading ? "Loading live medicines..." : isError ? "Showing sample catalog while the production API connects." : "Medicine catalog is ready once the API is connected."}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Set VITE_API_BASE_URL in Vercel for the deployed frontend to reach the backend API.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t bg-background/90">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Thandizo Healthcare. All rights reserved.</p>
          <p>HTTPS • PWA • Role-based healthcare workflows • Cloudflare-ready</p>
        </div>
      </footer>
    </div>
  );
}
