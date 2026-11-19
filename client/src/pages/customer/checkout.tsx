import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { CustomerNav } from "@/components/CustomerNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useCallback } from "react";
import type { Branch, Prescription } from '@shared/schema';

export default function CheckoutPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { items, clearCart, getTotalPrice } = useCart();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    deliveryCity: "Lilongwe",
    paymentMethod: "cash",
    branchId: "",
    prescriptionId: "",
  });
  const { data: branches = [], isLoading: branchesLoading, isError: branchesError } = useQuery<Branch[]>({
    queryKey: ['/api/branches'],
    enabled: isAuthenticated,
  });
  const { data: prescriptions = [] } = useQuery<Prescription[]>({
    queryKey: [`/api/prescriptions/patient/${user?.id}`],
    enabled: Boolean(user?.id),
  });
  const activeBranches = branches.filter((branch) => branch.isActive);
  const selectedBranchId = formData.branchId || (activeBranches.length === 1 ? activeBranches[0].id : '');
  const eligiblePrescriptions = prescriptions.filter((prescription) => !prescription.revokedAt
    && !['revoked', 'cancelled', 'expired', 'rejected'].includes(prescription.status)
    && (!prescription.expiresAt || new Date(prescription.expiresAt) > new Date()));

  const createOrderMutation = useMutation<Response, Error, Record<string, unknown>>({
    mutationFn: async (orderData) => {
      return apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Order placed successfully!",
      });
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setLocation("/orders");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!items.length) {
      toast({
        title: "Error",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBranchId || !activeBranches.some((branch) => branch.id === selectedBranchId)) {
      toast({ title: 'Select a pharmacy', description: 'Choose an available branch to fulfil your order.', variant: 'destructive' });
      return;
    }
    if (!formData.deliveryAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a delivery address",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate({
      branchId: selectedBranchId,
      ...(formData.prescriptionId ? { prescriptionId: formData.prescriptionId } : {}),
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      deliveryAddress: formData.deliveryAddress,
      deliveryCity: formData.deliveryCity,
      paymentMethod: formData.paymentMethod,
    });
  }, [items, formData, selectedBranchId, activeBranches, createOrderMutation, toast]);

  const subtotal = getTotalPrice();
  const deliveryCharge = 500;
  const total = subtotal + deliveryCharge;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <CustomerNav />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">Please log in to checkout</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNav />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 flex items-center gap-2">
          <a href="/cart">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
          </a>
        </div>

        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader><CardTitle>Pharmacy and Prescription</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checkout-branch">Fulfilment Branch</Label>
                <Select value={selectedBranchId} onValueChange={(branchId) => setFormData({ ...formData, branchId })} disabled={branchesLoading}>
                  <SelectTrigger id="checkout-branch" data-testid="select-checkout-branch"><SelectValue placeholder={branchesLoading ? 'Loading branches...' : 'Select a pharmacy'} /></SelectTrigger>
                  <SelectContent>{activeBranches.map((branch) => <SelectItem key={branch.id} value={branch.id}>{branch.name} — {branch.city}</SelectItem>)}</SelectContent>
                </Select>
                {branchesError && <p role="alert" className="text-sm text-destructive">Pharmacy availability could not be loaded. Please try again.</p>}
                {!branchesLoading && !branchesError && !activeBranches.length && <p role="alert" className="text-sm text-destructive">No pharmacy is currently accepting online orders.</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="checkout-prescription">Prescription, when required</Label>
                <Select value={formData.prescriptionId || 'none'} onValueChange={(value) => setFormData({ ...formData, prescriptionId: value === 'none' ? '' : value })}>
                  <SelectTrigger id="checkout-prescription" data-testid="select-checkout-prescription"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No prescription selected</SelectItem>
                    {eligiblePrescriptions.map((prescription) => <SelectItem key={prescription.id} value={prescription.id}>Prescription {prescription.id.slice(0, 8)} · {prescription.status}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Prescription medicines require a valid prescription covering the selected products and quantities. <a href="/prescriptions" className="underline">Manage prescriptions</a></p>
              </div>
            </CardContent>
          </Card>
          {/* Order Summary */}
          <Card data-testid="card-order-summary">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 border-b pb-4">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span>MK {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No items in cart</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal</span>
                  <span className="font-medium">MK {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Delivery Charge</span>
                  <span className="font-medium">MK {deliveryCharge.toFixed(2)}</span>
                </div>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">MK {total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card data-testid="card-delivery-address">
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your delivery address"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  data-testid="input-delivery-address"
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select value={formData.deliveryCity} onValueChange={(value) => setFormData({ ...formData, deliveryCity: value })}>
                  <SelectTrigger id="city" data-testid="select-delivery-city">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lilongwe">Lilongwe</SelectItem>
                    <SelectItem value="Blantyre">Blantyre</SelectItem>
                    <SelectItem value="Mzuzu">Mzuzu</SelectItem>
                    <SelectItem value="Zomba">Zomba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card data-testid="card-payment-method">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
              
              <p className="text-sm text-muted-foreground">Online payments are currently unavailable. Pay on delivery.</p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <a href="/shop" className="flex-1">
              <Button
                variant="outline"
                className="w-full"
                data-testid="button-continue-shopping"
              >
                Continue Shopping
              </Button>
            </a>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={createOrderMutation.isPending || items.length === 0 || !selectedBranchId || branchesLoading || branchesError || !activeBranches.length}
              data-testid="button-place-order"
            >
              {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
