import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { CustomerNav } from "@/components/CustomerNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart } from "lucide-react";

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCart();
  const deliveryFee = 500; // MK base fee (will add distance multiplier in checkout)
  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNav />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Please log in to view your cart</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex items-center gap-2">
          <a href="/shop">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Shop
            </Button>
          </a>
        </div>

        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">Your cart is empty</p>
              <a href="/shop">
                <Button>Continue Shopping</Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.productId} data-testid={`cart-item-${item.productId}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2">{item.name}</h3>
                        <p className="text-lg font-bold text-primary">MK {parseFloat(item.price).toFixed(2)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          data-testid={`button-decrease-${item.productId}`}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                          data-testid={`input-quantity-${item.productId}`}
                        />
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          data-testid={`button-increase-${item.productId}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeItem(item.productId)}
                          data-testid={`button-remove-${item.productId}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 text-right pt-3 border-t">
                      <p className="text-sm">Subtotal: <span className="font-semibold">MK {(parseFloat(item.price) * item.quantity).toFixed(2)}</span></p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="space-y-4">
              <Card data-testid="card-order-summary-sidebar">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 pb-3 border-b">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span className="font-medium">MK {getTotalPrice().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery (Base Fee)</span>
                      <span className="font-medium">MK {deliveryFee.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">MK {total.toFixed(2)}</span>
                  </div>

                  <a href="/checkout" className="block">
                    <Button className="w-full" size="lg" data-testid="button-checkout">Proceed to Checkout</Button>
                  </a>

                  <a href="/shop" className="block">
                    <Button
                      variant="outline"
                      className="w-full"
                      data-testid="button-continue-shopping"
                    >
                      Continue Shopping
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
