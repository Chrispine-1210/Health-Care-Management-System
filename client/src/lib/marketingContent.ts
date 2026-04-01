import abstractPattern from "@assets/generated_images/healthcare_abstract_pattern_background.png";
import deliveryIllustration from "@assets/generated_images/pharmacy_delivery_service_illustration.png";
import pharmacistPortrait from "@assets/generated_images/professional_pharmacist_portrait.png";
import consultationScene from "@assets/generated_images/professional_pharmacy_consultation_scene.png";
import brandWave from "@assets/brand/brand-wave.svg";
import brandGrid from "@assets/brand/brand-grid.svg";
import brandRibbon from "@assets/brand/brand-ribbon.svg";
import brandPulse from "@assets/brand/brand-pulse.svg";

export const MARKETING_IMAGES = {
  abstractPattern,
  deliveryIllustration,
  pharmacistPortrait,
  consultationScene,
  brandWave,
  brandGrid,
  brandRibbon,
  brandPulse,
};

export const BLOG_ARTICLES = [
  {
    id: "patient-flow",
    title: "From prescription to pickup: a patient-ready flow",
    category: "Operations",
    readTime: "6 min read",
    excerpt:
      "See how the platform keeps approvals, inventory, and delivery updates in sync for every patient order.",
    image: consultationScene,
  },
  {
    id: "delivery-trust",
    title: "Building trust in last mile pharmacy delivery",
    category: "Delivery",
    readTime: "5 min read",
    excerpt:
      "Proof of delivery, real time status, and role-based chats keep customers and staff aligned.",
    image: deliveryIllustration,
  },
  {
    id: "clinical-safety",
    title: "Clinical safety checks that fit a busy pharmacy",
    category: "Clinical",
    readTime: "7 min read",
    excerpt:
      "Pharmacists can review prescriptions quickly while staff track approvals and fulfillment.",
    image: pharmacistPortrait,
  },
];

export const PARTNERS = [
  {
    name: "Ministry of Health",
    focus: "Regulatory alignment and clinical guidance",
  },
  {
    name: "City Clinics Network",
    focus: "Community patient referrals and follow-up",
  },
  {
    name: "Faith-Based Hospitals",
    focus: "Shared care and prescription continuity",
  },
  {
    name: "Community Pharmacies",
    focus: "Local fulfillment and branch operations",
  },
  {
    name: "Digital Health Alliance",
    focus: "Secure data exchange and interoperability",
  },
  {
    name: "Logistics Providers",
    focus: "Regional distribution and delivery coverage",
  },
];

export const TEAM_MEMBERS = [
  {
    name: "Dr. Thandi Moyo",
    role: "Chief Pharmacist",
    bio: "Leads clinical review standards and pharmacist training across branches.",
    image: pharmacistPortrait,
  },
  {
    name: "Luka Phiri",
    role: "Operations Director",
    bio: "Coordinates branch fulfillment, inventory readiness, and daily ops reporting.",
    image: consultationScene,
  },
  {
    name: "Rita Banda",
    role: "Customer Success Lead",
    bio: "Ensures patient onboarding, education, and ongoing support are consistent.",
    image: brandWave,
  },
  {
    name: "Chikondi Tembo",
    role: "Delivery Coordinator",
    bio: "Manages fleet readiness, route coverage, and proof-of-delivery workflows.",
    image: deliveryIllustration,
  },
  {
    name: "Henderson Mkandawire",
    role: "Quality & Data Lead",
    bio: "Tracks compliance metrics and ensures clinical reporting accuracy across branches.",
    image: brandGrid,
  },
  {
    name: "Ethel Chirwa",
    role: "Community Programs Lead",
    bio: "Builds outreach programs and partnerships with clinics and local health teams.",
    image: brandRibbon,
  },
];

export const TESTIMONIALS = [
  {
    name: "Madalitso Nkosi",
    role: "Branch Manager",
    quote:
      "Order handoffs finally make sense. Staff, pharmacists, and drivers see exactly what they need.",
  },
  {
    name: "Lindiwe Banda",
    role: "Patient",
    quote:
      "I can follow my prescription status and delivery updates without calling the branch every time.",
  },
  {
    name: "Mr. Kachale",
    role: "Logistics Partner",
    quote:
      "Proof of delivery and live updates keep our teams aligned with the pharmacy in minutes.",
  },
  {
    name: "Chisomo Tembo",
    role: "Pharmacist",
    quote:
      "The review queue and chat tools help me focus on clinical safety without losing speed.",
  },
];

export const GALLERY_ITEMS = [
  {
    id: "branch-operations",
    title: "Branch Operations",
    description: "Fulfillment and inventory coordination across teams.",
    image: consultationScene,
  },
  {
    id: "delivery-fleet",
    title: "Delivery Fleet",
    description: "Drivers stay on route with live updates and proof of delivery.",
    image: deliveryIllustration,
  },
  {
    id: "clinical-review",
    title: "Clinical Review",
    description: "Pharmacists keep prescriptions safe and verified.",
    image: pharmacistPortrait,
  },
  {
    id: "patient-support",
    title: "Patient Support",
    description: "Customers get guided support through chat and consultations.",
    image: abstractPattern,
  },
  {
    id: "inventory-focus",
    title: "Inventory Focus",
    description: "Low stock alerts and branch-level visibility stay consistent.",
    image: consultationScene,
  },
  {
    id: "community-outreach",
    title: "Community Outreach",
    description: "Trusted engagement with local clinics and partners.",
    image: brandRibbon,
  },
  {
    id: "quality-monitoring",
    title: "Quality Monitoring",
    description: "Performance dashboards and safety reporting with branded visuals.",
    image: brandPulse,
  },
  {
    id: "network-coverage",
    title: "Network Coverage",
    description: "Branch and partner coverage mapped across Malawi.",
    image: brandGrid,
  },
  {
    id: "patient-journey",
    title: "Patient Journey",
    description: "Clear handoffs from prescription review to delivery confirmation.",
    image: brandWave,
  },
];
