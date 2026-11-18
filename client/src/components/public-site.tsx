import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, HeartPulse, Menu, X, ArrowUpRight } from 'lucide-react';
import '@/public-site.css';

export function PublicSite({ children, title = 'Care, closer to you.', description = 'Explore Thandizo Pharmacy: medicine requests, pharmacist review and coordinated collection or delivery in Malawi.' }: { children: ReactNode; title?: string; description?: string }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  useEffect(() => {
    document.title = `${title} | Thandizo Pharmacy`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    setOpen(false);
    if (window.location.hash) requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView());
    else window.scrollTo(0, 0);
  }, [location, title, description]);
  const nav = [['/services', 'Our services'], ['/catalogue', 'Medicines & essentials'], ['/branches', 'Find a branch'], ['/about', 'Our approach']];
  return <div className="th-public">
    <a className="th-skip" href="#main-content">Skip to content</a>
    <div className="th-preview"><span className="th-dot" /> Platform preview <span className="th-preview-detail">— explore the experience. Live service availability is awaiting confirmation.</span></div>
    <header className="th-header">
      <Link href="/welcome" className="th-brand" aria-label="Thandizo Pharmacy home"><span className="th-brand-icon"><HeartPulse aria-hidden="true" /></span><span>thandizo<span className="th-brand-small">PHARMACY & EVERYDAY CARE</span></span></Link>
      <nav aria-label="Main navigation" className="th-desktop-nav">{nav.map(([url, label]) => <Link key={url} href={url} aria-current={location === url ? 'page' : undefined}>{label}</Link>)}</nav>
      <div className="th-header-actions"><Link href="/sign-in" className="th-sign-in">Sign in <ArrowUpRight size={15} /></Link><Link href="/sign-up" className="th-button th-button-small">Get started <ArrowRight size={15} /></Link><button type="button" className="th-menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="public-mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button></div>
      {open && <nav id="public-mobile-nav" aria-label="Mobile navigation" className="th-mobile-nav">{nav.map(([url, label]) => <Link key={url} href={url}>{label}</Link>)}<Link href="/help">Help & support</Link><Link href="/sign-in">Sign in</Link></nav>}
    </header>
    <main id="main-content" tabIndex={-1}>{children}</main>
    <footer className="th-footer"><div className="th-footer-top"><div><Link href="/welcome" className="th-brand"><HeartPulse size={34} /><span>thandizo<span className="th-brand-small">PHARMACY & EVERYDAY CARE</span></span></Link><p>Thoughtful care.<br />Built around your everyday life.</p><span className="th-footer-location">Designed for Malawi.</span></div><div><h2>Explore</h2><Link href="/services">Our services</Link><Link href="/catalogue">Medicine catalogue</Link><Link href="/branches">Find a branch</Link><Link href="/about">Our approach</Link></div><div><h2>Your account</h2><Link href="/sign-up">Create an account</Link><Link href="/sign-in">Customer sign in</Link><Link href="/help">Help & support</Link><Link href="/updates">News & updates</Link></div><div><h2>A little reassurance</h2><p>Prescription medicines require a valid prescription and pharmacist approval. Availability, delivery and final charges require branch confirmation.</p><Link href="/help" className="th-footer-help">How it works <ArrowUpRight size={14} /></Link></div></div><div className="th-footer-bottom"><span>© {new Date().getFullYear()} Thandizo Pharmacy</span><div><Link href="/privacy">Privacy information</Link><Link href="/terms">Service terms</Link></div><span>Care with people at its heart.</span></div></footer>
  </div>;
}

export function PublicIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <section className="th-page-intro th-wrap"><span className="th-eyebrow">{eyebrow}</span><h1>{title}</h1>{children && <p>{children}</p>}</section>;
}

export function PublicNotice({ title, children, onRetry }: { title: string; children: ReactNode; onRetry?: () => void }) {
  return <div className="th-notice" role="status"><h3>{title}</h3><p>{children}</p>{onRetry && <button type="button" className="th-text-link" onClick={onRetry}>Try again <ArrowRight size={16} /></button>}</div>;
}
