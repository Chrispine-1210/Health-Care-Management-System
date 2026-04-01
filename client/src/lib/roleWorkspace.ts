import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileCheck,
  FileText,
  LayoutDashboard,
  Package,
  Pill,
  Settings,
  ShoppingCart,
  Truck,
  UserCircle2,
  Users,
} from "lucide-react";
import type { PlatformRole } from "@shared/roleCapabilities";

export type RoleWorkspaceRoute = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  matchPrefixes?: string[];
};

export const ROLE_WORKSPACE_ROUTES: Record<PlatformRole, RoleWorkspaceRoute[]> = {
  customer: [
    {
      key: "dashboard",
      title: "Dashboard",
      description: "Your care, medicine, and delivery overview.",
      href: "/customer",
      icon: LayoutDashboard,
      badge: "Primary",
      matchPrefixes: ["/", "/customer/dashboard"],
    },
    {
      key: "shop",
      title: "Browse Medicines",
      description: "Explore approved medicines and availability.",
      href: "/customer/shop",
      icon: Pill,
      matchPrefixes: ["/shop"],
    },
    {
      key: "orders",
      title: "My Orders",
      description: "Track live order progress and delivery movement.",
      href: "/customer/orders",
      icon: ShoppingCart,
      matchPrefixes: ["/orders"],
    },
    {
      key: "prescriptions",
      title: "Prescriptions",
      description: "Upload and monitor secure prescription reviews.",
      href: "/customer/prescriptions",
      icon: FileText,
      matchPrefixes: ["/prescriptions"],
    },
    {
      key: "consultations",
      title: "Consultations",
      description: "Book pharmacist sessions and follow-up care.",
      href: "/customer/consultations",
      icon: ClipboardList,
      matchPrefixes: ["/consultations"],
    },
    {
      key: "profile",
      title: "Profile",
      description: "Manage your account, history, and portfolio details.",
      href: "/customer/profile",
      icon: UserCircle2,
      matchPrefixes: ["/profile"],
    },
    {
      key: "notifications",
      title: "Updates",
      description: "Stay on top of order, prescription, and support messages.",
      href: "/customer/notifications",
      icon: Bell,
      matchPrefixes: ["/notifications"],
    },
  ],
  driver: [
    {
      key: "dashboard",
      title: "Active Deliveries",
      description: "View assigned deliveries and current route work.",
      href: "/driver",
      icon: LayoutDashboard,
      badge: "Primary",
      matchPrefixes: ["/driver/dashboard"],
    },
    {
      key: "history",
      title: "Delivery History",
      description: "Review completed jobs and proof-of-delivery records.",
      href: "/driver/history",
      icon: FileText,
    },
    {
      key: "inbox",
      title: "Coordination Inbox",
      description: "Coordinate directly with staff and customers.",
      href: "/driver/inbox",
      icon: Bell,
      matchPrefixes: ["/notifications"],
    },
    {
      key: "performance",
      title: "Performance",
      description: "Monitor route execution and delivery reporting.",
      href: "/driver/performance",
      icon: BarChart3,
      matchPrefixes: ["/performance/driver"],
    },
    {
      key: "portfolio",
      title: "Portfolio",
      description: "View your driver portfolio and role profile.",
      href: "/driver/portfolio",
      icon: Users,
      matchPrefixes: ["/portfolio/driver"],
    },
  ],
  pharmacist: [
    {
      key: "dashboard",
      title: "Clinical Dashboard",
      description: "See clinical review, stock risk, and handoff readiness.",
      href: "/pharmacist",
      icon: LayoutDashboard,
      badge: "Primary",
      matchPrefixes: ["/pharmacist/dashboard"],
    },
    {
      key: "prescriptions",
      title: "Prescription Review",
      description: "Review prescriptions, allergies, and clinical flags.",
      href: "/pharmacist/prescriptions",
      icon: FileCheck,
    },
    {
      key: "inventory",
      title: "Inventory Risk",
      description: "Manage low-stock risk, batch health, and expiry pressure.",
      href: "/pharmacist/inventory",
      icon: Package,
    },
    {
      key: "inbox",
      title: "Support Inbox",
      description: "Support customers through pharmacist-led chat.",
      href: "/pharmacist/inbox",
      icon: Bell,
      matchPrefixes: ["/notifications"],
    },
    {
      key: "performance",
      title: "Performance",
      description: "Track review throughput and clinical handoff readiness.",
      href: "/pharmacist/performance",
      icon: BarChart3,
      matchPrefixes: ["/performance/pharmacist"],
    },
    {
      key: "portfolio",
      title: "Portfolio",
      description: "View your pharmacist portfolio and role profile.",
      href: "/pharmacist/portfolio",
      icon: Users,
      matchPrefixes: ["/portfolio/pharmacist"],
    },
  ],
  staff: [
    {
      key: "dashboard",
      title: "Operations Hub",
      description: "Monitor approvals, fulfillment, and operations flow.",
      href: "/staff",
      icon: LayoutDashboard,
      badge: "Primary",
      matchPrefixes: ["/staff/dashboard"],
    },
    {
      key: "orders",
      title: "Fulfillment Queue",
      description: "Manage approvals and move orders through fulfillment.",
      href: "/staff/orders",
      icon: ClipboardList,
    },
    {
      key: "pos",
      title: "POS Transactions",
      description: "Handle point-of-sale work for staff operations.",
      href: "/staff/pos",
      icon: ShoppingCart,
      matchPrefixes: ["/pos"],
    },
    {
      key: "inbox",
      title: "Ops Inbox",
      description: "Monitor role-to-role chat and transaction escalations.",
      href: "/staff/inbox",
      icon: Bell,
      matchPrefixes: ["/notifications"],
    },
    {
      key: "performance",
      title: "Performance",
      description: "Track approvals, fulfillment, and live oversight health.",
      href: "/staff/performance",
      icon: BarChart3,
      matchPrefixes: ["/performance/staff"],
    },
  ],
  admin: [
    {
      key: "dashboard",
      title: "Platform Overview",
      description: "See platform-wide control, risk, and operational movement.",
      href: "/admin",
      icon: LayoutDashboard,
      badge: "Primary",
      matchPrefixes: ["/admin/dashboard"],
    },
    {
      key: "analytics",
      title: "Analytics",
      description: "Track platform performance, revenue, and movement.",
      href: "/admin/analytics",
      icon: BarChart3,
    },
    {
      key: "branches",
      title: "Branch Control",
      description: "Manage branch readiness, footprint, and coverage.",
      href: "/admin/branches",
      icon: Building2,
    },
    {
      key: "users",
      title: "User Roles",
      description: "Control platform roles, access, and assignment.",
      href: "/admin/users",
      icon: Users,
    },
    {
      key: "products",
      title: "Product Catalog",
      description: "Govern medicines, availability, and catalog quality.",
      href: "/admin/products",
      icon: Pill,
    },
    {
      key: "inventory",
      title: "Inventory Control",
      description: "Monitor stock risk, batch pressure, and inventory health.",
      href: "/admin/inventory",
      icon: Package,
    },
    {
      key: "orders",
      title: "Order Control",
      description: "Manage approval, fulfillment, and transaction flow.",
      href: "/admin/orders",
      icon: ShoppingCart,
    },
    {
      key: "content",
      title: "Content Studio",
      description: "Control marketing, education, and published platform content.",
      href: "/admin/content",
      icon: FileText,
    },
    {
      key: "inbox",
      title: "Ops Inbox",
      description: "Monitor chats and transaction escalations across roles.",
      href: "/admin/inbox",
      icon: Bell,
      matchPrefixes: ["/notifications"],
    },
    {
      key: "performance",
      title: "Performance",
      description: "Review platform-wide operational and commercial performance.",
      href: "/admin/performance",
      icon: BarChart3,
      matchPrefixes: ["/performance/admin"],
    },
    {
      key: "settings",
      title: "Settings",
      description: "Maintain system-level configuration and control surfaces.",
      href: "/admin/settings",
      icon: Settings,
    },
  ],
};

export function getRoleWorkspaceRoutes(role?: string | null): RoleWorkspaceRoute[] {
  if (!role || !(role in ROLE_WORKSPACE_ROUTES)) {
    return [];
  }

  return ROLE_WORKSPACE_ROUTES[role as PlatformRole];
}

export function isWorkspaceRouteActive(route: RoleWorkspaceRoute, location: string) {
  const candidates = [route.href, ...(route.matchPrefixes ?? [])];

  return candidates.some((candidate) => location === candidate || location.startsWith(`${candidate}/`));
}
