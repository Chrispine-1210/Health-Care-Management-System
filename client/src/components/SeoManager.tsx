import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

type SeoConfig = {
  title: string;
  description: string;
  robots?: string;
};

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }

  element.href = href;
}

function resolveSeo(path: string, isAuthenticated: boolean): SeoConfig {
  if (!isAuthenticated && path === "/") {
    return {
      title: "Online Pharmacy and Delivery in Malawi | Thandizo Pharmacy",
      description:
        "Order medications, manage prescriptions, and coordinate pharmacy operations with Thandizo Pharmacy's modern healthcare platform in Malawi.",
      robots: "index, follow",
    };
  }

  if (path === "/login" || path === "/sign-in") {
    return {
      title: "Sign In | Thandizo Pharmacy",
      description: "Securely sign in to access your pharmacy dashboard, prescriptions, deliveries, and orders.",
      robots: "noindex, nofollow",
    };
  }

  if (path === "/blog") {
    return {
      title: "Blog and Articles | Thandizo Pharmacy",
      description: "Operational insights, delivery updates, and clinical workflow playbooks from Thandizo.",
      robots: "index, follow",
    };
  }

  if (path === "/partners") {
    return {
      title: "Partners | Thandizo Pharmacy",
      description: "Meet the clinics, pharmacies, and health networks partnered with Thandizo Pharmacy.",
      robots: "index, follow",
    };
  }

  if (path === "/team") {
    return {
      title: "Team | Thandizo Pharmacy",
      description: "Get to know the pharmacy, delivery, and operations experts behind Thandizo.",
      robots: "index, follow",
    };
  }

  if (path === "/testimonials") {
    return {
      title: "Testimonials | Thandizo Pharmacy",
      description: "Stories from branch managers, pharmacists, and patients using the Thandizo platform.",
      robots: "index, follow",
    };
  }

  if (path === "/gallery") {
    return {
      title: "Gallery | Thandizo Pharmacy",
      description: "A visual tour of Thandizo pharmacy operations, delivery, and clinical workflows.",
      robots: "index, follow",
    };
  }

  if (path === "/signup" || path === "/sign-up") {
    return {
      title: "Create Account | Thandizo Pharmacy",
      description: "Create a Thandizo Pharmacy account to place orders, manage prescriptions, and track deliveries.",
      robots: "noindex, nofollow",
    };
  }

  if (path.startsWith("/shop")) {
    return {
      title: "Browse Medications | Thandizo Pharmacy",
      description: "Explore available medications, health products, and prescription services in one place.",
      robots: "noindex, nofollow",
    };
  }

  if (path.startsWith("/notifications")) {
    return {
      title: "Notifications | Thandizo Pharmacy",
      description: "Review order, delivery, and prescription updates from your Thandizo Pharmacy account.",
      robots: "noindex, nofollow",
    };
  }

  if (path.startsWith("/orders")) {
    return {
      title: "Orders | Thandizo Pharmacy",
      description: "Track orders, delivery progress, and payment status.",
      robots: "noindex, nofollow",
    };
  }

  if (path.startsWith("/prescriptions")) {
    return {
      title: "Prescriptions | Thandizo Pharmacy",
      description: "Manage prescription uploads, reviews, approvals, and pharmacy follow-up.",
      robots: "noindex, nofollow",
    };
  }

  if (path.startsWith("/admin")) {
    return {
      title: "Admin Operations | Thandizo Pharmacy",
      description: "Monitor branches, customers, products, and pharmacy analytics from the admin console.",
      robots: "noindex, nofollow",
    };
  }

  if (path.startsWith("/pharmacist")) {
    return {
      title: "Pharmacist Workspace | Thandizo Pharmacy",
      description: "Review prescriptions, manage stock, and coordinate patient fulfillment tasks.",
      robots: "noindex, nofollow",
    };
  }

  if (path.startsWith("/staff")) {
    return {
      title: "Staff Workspace | Thandizo Pharmacy",
      description: "Process orders, manage support tasks, and keep branch operations moving.",
      robots: "noindex, nofollow",
    };
  }

  if (path.startsWith("/driver")) {
    return {
      title: "Driver Workspace | Thandizo Pharmacy",
      description: "Manage assigned deliveries, update status, and coordinate last-mile fulfillment.",
      robots: "noindex, nofollow",
    };
  }

  return {
    title: "Thandizo Pharmacy Platform",
    description: "Pharmacy operations, medication ordering, delivery coordination, and prescription management.",
    robots: isAuthenticated ? "noindex, nofollow" : "index, follow",
  };
}

export function SeoManager() {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const seo = resolveSeo(location, isAuthenticated);
    const url = new URL(location, window.location.origin);

    document.title = seo.title;
    upsertMeta("name", "description", seo.description);
    upsertMeta("name", "robots", seo.robots || "index, follow");
    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:description", seo.description);
    upsertMeta("property", "og:url", url.toString());
    upsertMeta("name", "twitter:title", seo.title);
    upsertMeta("name", "twitter:description", seo.description);
    upsertCanonical(url.toString());
  }, [location, isAuthenticated]);

  return null;
}
