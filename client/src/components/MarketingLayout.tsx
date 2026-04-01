import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Blog", href: "/blog" },
  { label: "Partners", href: "/partners" },
  { label: "Team", href: "/team" },
  { label: "Testimonials", href: "/testimonials" },
  { label: "Gallery", href: "/gallery" },
];

export function MarketingLayout({ children }: { children: React.ReactNode }) {
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

          <div className="hidden items-center gap-4 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span className="text-sm text-muted-foreground transition hover:text-foreground">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm" data-testid="button-signin-nav">
                Sign In
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>{children}</main>

      <footer className="border-t bg-background">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>(c) 2026 Thandizo Pharmacy. Purpose-built for Malawi pharmacy operations.</p>
          <div className="flex flex-wrap gap-4">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span className="transition hover:text-foreground">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
