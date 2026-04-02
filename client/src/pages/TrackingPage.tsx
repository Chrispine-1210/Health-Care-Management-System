import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MapPin, Truck, Clock } from 'lucide-react';

export default function TrackingPage() {
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('orderId');
    const fetchTracking = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/orders/${orderId}/tracking`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setTracking(data.data);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchTracking();
  }, []);

  if (loading) return <LoadingSpinner text="Loading tracking..." />;
  if (!tracking) return <div className="p-6 text-center">No tracking data available</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Order Tracking</h1>

      {/* Driver Info */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">{tracking.driver.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold">{tracking.driver.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vehicle</p>
              <p className="font-semibold">{tracking.driver.vehicle}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-semibold capitalize">{tracking.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimated Arrival */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Estimated Arrival
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {new Date(tracking.estimatedArrival).toLocaleTimeString()}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round((new Date(tracking.estimatedArrival).getTime() - Date.now()) / 60000)} minutes away
          </p>
        </CardContent>
      </Card>

      {/* Route */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Delivery Route
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tracking.route?.map((stop: any, index: number) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="font-semibold">{stop.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
