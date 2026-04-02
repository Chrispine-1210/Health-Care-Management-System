import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { CustomerNav } from "@/components/CustomerNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ShoppingCart, FileText, Package, Phone, Plus, Truck, MapPin, Search } from "lucide-react";
import type { Product, User } from "@shared/schema";

export default function CustomerHome() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: featuredProducts, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
    enabled: isAuthenticated,
  });

  const { data: activeDrivers, isLoading: driversLoading } = useQuery<(User & { activeDeliveries: number })[]>({
    queryKey: ["/api/drivers/active"],
    enabled: isAuthenticated,
  });

  const { data: myOrders } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  const filteredProducts = useMemo(
    () => featuredProducts?.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.genericName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [],
    [featuredProducts, searchQuery]
  );

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to Thandizo Pharmacy</h1>
          <p className="text-muted-foreground">Your trusted healthcare partner in Malawi</p>
          <p className="text-muted-foreground text-sm mt-2">Browse medications, manage prescriptions, and track your orders</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <a href="/shop">
            <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-shop">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shop Medications</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Browse</div>
                <p className="text-xs text-muted-foreground mt-1">
                  View our full catalog
                </p>
              </CardContent>
            </Card>
          </a>

          <a href="/prescriptions">
            <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-prescriptions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Prescriptions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Manage</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload & track prescriptions
                </p>
              </CardContent>
            </Card>
          </a>

          <a href="/orders">
            <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-orders">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Track</div>
                <p className="text-xs text-muted-foreground mt-1">
                  View order history
                </p>
              </CardContent>
            </Card>
          </a>

          <a href="/consultations">
            <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid="card-consult">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consultations</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Book</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Talk to a pharmacist
                </p>
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Active Drivers Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Available Delivery Drivers</h2>
              <p className="text-sm text-muted-foreground mt-1">Track drivers delivering your orders</p>
            </div>
          </div>

          {driversLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : activeDrivers && activeDrivers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeDrivers.slice(0, 4).map((driver) => (
                <Card key={driver.id} className="hover-elevate active-elevate-2" data-testid={`driver-card-${driver.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {driver.firstName?.[0] || 'D'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {driver.firstName} {driver.lastName}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          <Truck className="w-3 h-3 mr-1" />
                          {driver.activeDeliveries} active
                        </Badge>
                      </div>
                    </div>
                    {driver.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Phone className="w-3 h-3" />
                        <span>{driver.phone}</span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      <p>Ready for deliveries</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">No drivers available at the moment</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Popular Medications</h2>
              <p className="text-sm text-muted-foreground mt-1">Frequently ordered items</p>
            </div>
            <a href="/shop">
              <Button data-testid="button-view-all">View All</Button>
            </a>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-48 w-full" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts && featuredProducts.length > 0 ? (
                featuredProducts.slice(0, 4).map((product) => (
                  <Card key={product.id} className="hover-elevate active-elevate-2" data-testid={`card-product-${product.id}`}>
                    <CardHeader className="p-0">
                      <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center relative overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                        ) : (
                          <Package className="w-16 h-16 text-muted-foreground" />
                        )}
                        {product.prescriptionRequired && (
                          <Badge className="absolute top-2 right-2 bg-destructive text-destructive-foreground">
                            Rx
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg line-clamp-2 mb-1">{product.name}</h3>
                      {product.genericName && (
                        <p className="text-sm text-muted-foreground mb-2">{product.genericName}</p>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-bold text-primary">
                          MK {parseFloat(product.price).toFixed(2)}
                        </span>
                      </div>
                      <a href="/shop" className="w-full block">
                        <Button className="w-full" size="sm" data-testid={`button-add-to-cart-${product.id}`}>
                          <Plus className="w-4 h-4 mr-1" />
                          Shop Now
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No products available at the moment</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
