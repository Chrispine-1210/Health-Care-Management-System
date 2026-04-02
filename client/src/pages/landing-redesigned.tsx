import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Users, Package, Shield, Zap, Pill, Heart, TrendingUp, MapPin } from "lucide-react";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

export default function Landing() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-chart-2" />
            <div className="text-2xl font-bold text-primary">Thandizo Pharmacy</div>
          </div>
          <Link href="/sign-in">
            <Button variant="outline" data-testid="button-signin-nav">
              Sign In
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center mb-20">
          <Badge className="mb-6 bg-chart-2/20 text-chart-2 hover:bg-chart-2/30">
            Malawi's Leading Pharmacy Management System
          </Badge>
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Healthcare Made <span className="text-chart-2">Simple & Accessible</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Thandizo Pharmacy brings complete healthcare management to Malawi with medicine delivery, 
            live tracking, and multi-role system for seamless pharmacy operations across all branches.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/sign-in">
              <Button size="lg" className="gap-2" data-testid="button-get-started">
                Get Started Now
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Medicine Showcase */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Available Medicines</h2>
          <p className="text-lg text-muted-foreground">Order from our comprehensive catalog of medications</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {products && products.length > 0 ? (
            products.slice(0, 6).map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow" data-testid={`card-product-${product.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    {product.requiresPrescription && (
                      <Badge variant="outline" className="ml-2">Rx</Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-bold text-chart-2">MK {product.price}</span>
                  </div>
                  <Button className="w-full" size="sm" data-testid={`button-add-cart-${product.id}`}>
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-3">
              <CardContent className="pt-6 text-center">
                <Pill className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">Loading medicines...</p>
              </CardContent>
            </Card>
          )}
        </div>
        <div className="text-center">
          <Link href="/sign-in">
            <Button size="lg" variant="outline" data-testid="button-browse-all">
              Browse Full Catalog
            </Button>
          </Link>
        </div>
      </section>

      {/* Key Features */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Complete Healthcare Solution</h2>
            <p className="text-lg text-muted-foreground">Everything you need for modern pharmacy operations</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card data-testid="card-feature-delivery">
              <CardContent className="pt-6">
                <Truck className="h-8 w-8 text-chart-2 mb-4" />
                <h3 className="font-bold mb-2">Live Delivery Tracking</h3>
                <p className="text-sm text-muted-foreground">Real-time GPS tracking, customer location pinning, and distance-based pricing (500 MK + 50 MK/km)</p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-inventory">
              <CardContent className="pt-6">
                <Package className="h-8 w-8 text-chart-2 mb-4" />
                <h3 className="font-bold mb-2">Smart Inventory</h3>
                <p className="text-sm text-muted-foreground">Track stock levels, expiry dates, batch numbers, and automatic low-stock alerts</p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-prescriptions">
              <CardContent className="pt-6">
                <Pill className="h-8 w-8 text-chart-2 mb-4" />
                <h3 className="font-bold mb-2">Prescription Management</h3>
                <p className="text-sm text-muted-foreground">Digital prescription uploads, pharmacist review queue, drug interaction checking</p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-roles">
              <CardContent className="pt-6">
                <Users className="h-8 w-8 text-chart-2 mb-4" />
                <h3 className="font-bold mb-2">Multi-Role System</h3>
                <p className="text-sm text-muted-foreground">Customer, Driver, Pharmacist, Staff, and Admin with specialized dashboards</p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-security">
              <CardContent className="pt-6">
                <Shield className="h-8 w-8 text-chart-2 mb-4" />
                <h3 className="font-bold mb-2">Secure & Compliant</h3>
                <p className="text-sm text-muted-foreground">PMRA regulated, audit logs, account verification via National ID/face scan/OTP</p>
              </CardContent>
            </Card>

            <Card data-testid="card-feature-analytics">
              <CardContent className="pt-6">
                <TrendingUp className="h-8 w-8 text-chart-2 mb-4" />
                <h3 className="font-bold mb-2">Performance Tracking</h3>
                <p className="text-sm text-muted-foreground">Merit badges, driver/pharmacist analytics, sales dashboards, performance metrics</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Role Showcase */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Built for Every Role</h2>
          <p className="text-lg text-muted-foreground">Specialized dashboards and tools for each user type</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card data-testid="card-role-customer">
            <CardContent className="pt-6">
              <div className="mb-4 p-3 bg-purple-100 dark:bg-purple-900 rounded-lg w-fit">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="font-bold text-lg mb-2">Customers</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Browse medicine catalog</li>
                <li>✓ Place orders online</li>
                <li>✓ Track deliveries live</li>
                <li>✓ Upload prescriptions</li>
                <li>✓ Book consultations</li>
              </ul>
            </CardContent>
          </Card>

          <Card data-testid="card-role-driver">
            <CardContent className="pt-6">
              <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded-lg w-fit">
                <Truck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="font-bold text-lg mb-2">Drivers</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ View assigned deliveries</li>
                <li>✓ Live GPS tracking</li>
                <li>✓ Proof of delivery uploads</li>
                <li>✓ Customer communication</li>
                <li>✓ Earn merit badges</li>
              </ul>
            </CardContent>
          </Card>

          <Card data-testid="card-role-pharmacist">
            <CardContent className="pt-6">
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg w-fit">
                <Pill className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="font-bold text-lg mb-2">Pharmacists</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Review prescription queue</li>
                <li>✓ Manage inventory & stock</li>
                <li>✓ Check drug interactions</li>
                <li>✓ View sales dashboards</li>
                <li>✓ Manage delivery fleet</li>
              </ul>
            </CardContent>
          </Card>

          <Card data-testid="card-role-staff">
            <CardContent className="pt-6">
              <div className="mb-4 p-3 bg-orange-100 dark:bg-orange-900 rounded-lg w-fit">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-300" />
              </div>
              <h3 className="font-bold text-lg mb-2">Staff</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ In-store POS terminal</li>
                <li>✓ Order approvals</li>
                <li>✓ Sales statistics</li>
                <li>✓ Inventory quick view</li>
                <li>✓ Daily performance reports</li>
              </ul>
            </CardContent>
          </Card>

          <Card data-testid="card-role-admin">
            <CardContent className="pt-6">
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg w-fit">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
              <h3 className="font-bold text-lg mb-2">Admin</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ Full system overview</li>
                <li>✓ User management</li>
                <li>✓ Branch management</li>
                <li>✓ Comprehensive analytics</li>
                <li>✓ Audit logs & reports</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-primary/5 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div data-testid="stat-medicines">
              <div className="text-3xl font-bold text-chart-2 mb-2">500+</div>
              <p className="text-muted-foreground">Medicines Available</p>
            </div>
            <div data-testid="stat-branches">
              <div className="text-3xl font-bold text-chart-2 mb-2">5</div>
              <p className="text-muted-foreground">Pharmacy Branches</p>
            </div>
            <div data-testid="stat-users">
              <div className="text-3xl font-bold text-chart-2 mb-2">5 Roles</div>
              <p className="text-muted-foreground">Multi-Role System</p>
            </div>
            <div data-testid="stat-coverage">
              <div className="text-3xl font-bold text-chart-2 mb-2">Malawi</div>
              <p className="text-muted-foreground">Wide Coverage</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Pharmacy?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join Thandizo Pharmacy and experience seamless healthcare management with real-time tracking, 
            comprehensive inventory control, and multi-role collaboration.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/sign-in">
              <Button size="lg" data-testid="button-signin-cta">
                Test Demo Now
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2024 Thandizo Pharmacy. Malawi's Leading Healthcare Management System.</p>
        </div>
      </footer>
    </div>
  );
}
