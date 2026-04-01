import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, AlertCircle } from "lucide-react";

interface CustomerTrackerProps {
  driverLocation?: { lat: number; lng: number } | null;
  customerLocation?: { lat: number; lng: number } | null;
  driverName?: string;
  driverPhone?: string;
  deliveryAddress?: string;
  estimatedArrival?: string;
  isDelivering: boolean;
}

export function CustomerDriverTracker({
  driverLocation,
  customerLocation,
  driverName = "Driver",
  driverPhone,
  deliveryAddress,
  estimatedArrival,
  isDelivering,
}: CustomerTrackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !driverLocation) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#f0f9ff");
    gradient.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid background (subtle)
    ctx.strokeStyle = "#d0e8ff";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 50000;

    // Draw customer location (destination)
    if (customerLocation) {
      const deltaLat = (customerLocation.lat - driverLocation.lat) * scale;
      const deltaLng = (customerLocation.lng - driverLocation.lng) * scale;

      const custX = centerX + deltaLng;
      const custY = centerY - deltaLat;

      // Destination house marker
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(custX, custY, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 2;
      ctx.stroke();

      // House icon
      ctx.fillStyle = "white";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🏠", custX, custY);

      // Draw route
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(custX, custY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Distance label at midpoint
      const midX = (centerX + custX) / 2;
      const midY = (centerY + custY) / 2;
      const distPixels = Math.sqrt(deltaLng ** 2 + deltaLat ** 2);
      const distKm = (distPixels / scale) * 111; // Approximate km

      ctx.fillStyle = "#1e40af";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${distKm.toFixed(1)} km`, midX, midY - 10);
    }

    // Draw driver marker with pulsing effect
    const pulse = Math.sin(Date.now() / 500) * 3;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15 + pulse, 0, Math.PI * 2);
    ctx.fill();

    // Driver circle background
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15 + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Driver icon
    ctx.fillStyle = "white";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚗", centerX, centerY);

    // Draw heading/direction indicator
    if (isDelivering) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, centerY - 35);
      ctx.stroke();

      // Arrow head
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 35);
      ctx.lineTo(centerX - 6, centerY - 25);
      ctx.lineTo(centerX + 6, centerY - 25);
      ctx.closePath();
      ctx.fill();
    }
  }, [driverLocation, customerLocation, isDelivering]);

  if (!driverLocation) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Driver location not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-chart-1/50 bg-chart-1/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-chart-1" />
            Your Driver Is On The Way
          </CardTitle>
          {isDelivering && <Badge className="bg-chart-1 animate-pulse">ARRIVING SOON</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas Map */}
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full border rounded-lg bg-white shadow-sm"
        />

        {/* Driver Info & Arrival */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <p className="text-xs text-muted-foreground mb-1">Driver</p>
            <p className="font-bold">{driverName}</p>
            {driverPhone && (
              <a
                href={`tel:${driverPhone}`}
                className="text-xs text-chart-1 hover:underline mt-1 flex items-center gap-1"
                data-testid="link-call-driver"
              >
                📞 {driverPhone}
              </a>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-chart-1 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground mb-1">ETA</p>
                <p className="font-bold">{estimatedArrival || "15-20 mins"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {deliveryAddress && (
          <div className="bg-white rounded-lg p-3 border">
            <p className="text-xs text-muted-foreground mb-1">Delivery Address</p>
            <p className="text-sm font-semibold line-clamp-2">{deliveryAddress}</p>
          </div>
        )}

        {/* Status Indicator */}
        <div className="p-3 bg-chart-1/10 rounded-lg border border-chart-1/20">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-chart-1 animate-pulse" />
            <span className="text-sm text-chart-1">
              {isDelivering ? "📍 Live tracking - Your driver is nearby" : "🚗 Order is being prepared"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
