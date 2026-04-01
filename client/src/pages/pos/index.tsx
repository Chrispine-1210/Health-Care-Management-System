import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { canUsePointOfSale } from "@shared/roleCapabilities";
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  X
} from "lucide-react";
import type { Product } from "@shared/schema";

type CartItem = {
  product: Product;
  quantity: number;
};

export default function POSPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'airtel_money' | 'tnm_mpamba' | 'card'>('cash');

  const canAccessPointOfSale = canUsePointOfSale(user?.role);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !canAccessPointOfSale)) {
      toast({
        title: "Unauthorized",
        description: "This point-of-sale workspace is available to admin and staff roles only.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [authLoading, canAccessPointOfSale, isAuthenticated, toast]);

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated && canAccessPointOfSale,
  });

  const filteredProducts = useMemo(
    () => products?.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [],
    [products, searchQuery]
  );

  const createOrderMutation = useMutation({
    mutationFn: async (items: CartItem[]) => {
      const res = await apiRequest("POST", "/api/orders", {
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        paymentMethod: selectedPaymentMethod,
        deliveryAddress: "Counter",
      });
      return res.json();
    },
    onSuccess: () => {
      setCart([]);
      toast({ title: "Order Created", description: "POS order has been created successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    }
  });

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0),
    [cart]
  );

  const addToCart = useCallback((product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    toast({
      title: "Added to cart",
      description: `${product.name} added successfully`,
    });
  }, [cart, toast]);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ).filter(item => item.quantity > 0));
  }, [cart]);

  const removeFromCart = useCallback((productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  }, [cart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
  const tax = subtotal * 0.16; // 16% VAT in Malawi
  const total = subtotal + tax;

  const completeSale = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to the cart",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sale completed",
      description: `Total: MK ${total.toFixed(2)}`,
    });
    clearCart();
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const paymentMethods = [
    { id: 'cash' as const, label: 'Cash', icon: Banknote },
    { id: 'airtel_money' as const, label: 'Airtel Money', icon: Smartphone },
    { id: 'tnm_mpamba' as const, label: 'TNM Mpamba', icon: Smartphone },
    { id: 'card' as const, label: 'Card', icon: CreditCard },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
      <div className="flex-1 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Product Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or generic name..."
                className="pl-10 text-lg h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-product-search"
                autoFocus
              />
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Available Products</CardTitle>
            <CardDescription>
              {filteredProducts.length} products found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-22rem)]">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProducts.slice(0, 50).map((product) => (
                  <Card
                    key={product.id}
                    className="hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => addToCart(product)}
                    data-testid={`product-card-${product.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm line-clamp-2">{product.name}</h4>
                          {product.genericName && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{product.genericName}</p>
                          )}
                        </div>
                        {product.prescriptionRequired && (
                          <Badge variant="destructive" className="ml-2 text-xs">Rx</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">MK {parseFloat(product.price).toFixed(2)}</span>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="w-[400px] flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Cart</CardTitle>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} data-testid="button-clear-cart">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Cart is empty</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2 p-2 border border-border rounded-md" data-testid={`cart-item-${item.product.id}`}>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        MK {parseFloat(item.product.price).toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)} data-testid={`button-decrease-${item.product.id}`}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)} data-testid={`button-increase-${item.product.id}`}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeFromCart(item.product.id)} data-testid={`button-remove-${item.product.id}`}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 space-y-4 border-t border-border">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium" data-testid="text-subtotal">MK {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (16%)</span>
                <span className="font-medium" data-testid="text-tax">MK {tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary" data-testid="text-total">MK {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    data-testid={`button-payment-${method.id}`}
                  >
                    <method.icon className="h-4 w-4 mr-2" />
                    {method.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={completeSale}
              disabled={cart.length === 0}
              data-testid="button-complete-sale"
            >
              Complete Sale - MK {total.toFixed(2)}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
