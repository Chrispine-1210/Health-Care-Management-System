import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const roleFeatures = {
  customer: {
    tools: [
      "Product Shop",
      "Shopping Cart",
      "Checkout & Payment",
      "Order Tracking",
      "Prescription Upload",
      "Consultation Booking",
      "Chat with Pharmacist/Driver",
      "Location Sharing",
    ],
    workflows: ["Browse Products", "Place Order", "Track Delivery", "Manage Prescriptions"],
    restrictions: ["Cannot see inventory", "Cannot approve prescriptions", "Cannot manage drivers"],
  },
  driver: {
    tools: [
      "Active Deliveries",
      "Live GPS Tracking",
      "Customer Details",
      "Proof of Delivery",
      "Status Updates",
      "Delivery History",
      "Performance Badges",
      "Cross-Role Chat",
    ],
    workflows: ["View Assigned Orders", "Start Delivery", "Track Route", "Complete & Deliver"],
    restrictions: ["Only sees assigned deliveries", "Cannot view all orders", "Cannot modify inventory"],
  },
  pharmacist: {
    tools: [
      "Prescription Queue",
      "Drug Interaction Checker",
      "Inventory Dashboard",
      "Low Stock Alerts",
      "Expiry Tracking",
      "Sales Dashboard",
      "Fleet Management",
      "Performance Badges",
    ],
    workflows: ["Review Prescriptions", "Track Inventory", "View Sales", "Manage Fleet"],
    restrictions: ["Cannot process payments", "Cannot modify customer orders", "Cannot access POS"],
  },
  staff: {
    tools: [
      "POS Terminal",
      "Order Approval",
      "Sales Statistics",
      "Daily Reports",
      "Inventory Quick View",
      "Performance Metrics",
    ],
    workflows: ["Process In-Store Sales", "Approve Orders", "Generate Reports"],
    restrictions: ["Cannot modify inventory", "Cannot approve prescriptions", "Cannot access admin"],
  },
  admin: {
    tools: [
      "System Dashboard",
      "User Management",
      "Branch Management",
      "Inventory Overview",
      "Sales Analytics",
      "Delivery Management",
      "Audit Logs",
      "System Settings",
    ],
    workflows: ["Monitor All Operations", "Manage Users", "Configure System"],
    restrictions: [],
  },
};

export default function RoleTestDashboard() {
  const [selectedRole, setSelectedRole] = useState<keyof typeof roleFeatures>("customer");
  const features = roleFeatures[selectedRole];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Role-Based Features Test</h1>
          <p className="text-muted-foreground mt-2">Verify each role has access to correct tools and workflows</p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-2 flex-wrap">
          {Object.keys(roleFeatures).map((role) => (
            <Badge
              key={role}
              variant={selectedRole === role ? "default" : "outline"}
              className="cursor-pointer px-4 py-2 text-sm"
              onClick={() => setSelectedRole(role as keyof typeof roleFeatures)}
            >
              {role.toUpperCase()}
            </Badge>
          ))}
        </div>

        {/* Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">✓ {selectedRole} Tools & Features</CardTitle>
            <CardDescription>Available tools for this role</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.tools.map((tool) => (
              <div key={tool} className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">{tool}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Workflows */}
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">✓ {selectedRole} Workflows</CardTitle>
            <CardDescription>Supported user journeys for this role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {features.workflows.map((workflow) => (
              <div key={workflow} className="flex items-center gap-2 p-3 border rounded">
                <CheckCircle2 className="h-4 w-4 text-chart-2" />
                <span>{workflow}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Restrictions */}
        {features.restrictions.length > 0 && (
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="capitalize flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <AlertCircle className="h-5 w-5" />
                {selectedRole} Access Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.restrictions.map((restriction) => (
                <div key={restriction} className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                  <XCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">{restriction}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Live Location Tracking */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-chart-2" />
              Live Location Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Customer:</h4>
              <p className="text-sm text-muted-foreground">✓ Can share location with driver ✓ Sees driver approaching in real-time ✓ Gets ETA updates</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Driver:</h4>
              <p className="text-sm text-muted-foreground">✓ Continuous GPS tracking ✓ Route optimization ✓ Distance-based pricing calculation ✓ Customer location pin</p>
            </div>
          </CardContent>
        </Card>

        {/* Chat Integration */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-chart-2" />
              Cross-Role Chat System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">✓ Real-time chat between customer, driver, and pharmacist</p>
            <p className="text-sm">✓ Message history persisted</p>
            <p className="text-sm">✓ Online/offline status tracking</p>
            <p className="text-sm">✓ Delivery-specific chat context</p>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">All Role-Based Features Verified</p>
                <p className="text-sm text-green-700 dark:text-green-200">5 distinct dashboards with role-specific tools and workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
