import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderFilters } from '@/components/OrderFilters';
import { useOrderFilters } from '@/hooks/useOrderFilters';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Link } from 'wouter';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { filtered, filters, setFilters, clearFilters } = useOrderFilters(orders);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <LoadingSpinner text="Loading orders..." />;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Orders</h1>

      <OrderFilters
        onFilterChange={(f) => setFilters(f)}
        onClear={clearFilters}
      />

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No orders found
            </CardContent>
          </Card>
        ) : (
          filtered.map(order => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Order #{order.id}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link href={`/orders/${order.id}`}>
                  <Button size="sm">View Details</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">{order.status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-semibold">MK {order.total}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Items</p>
                    <p className="font-semibold">{order.items?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
