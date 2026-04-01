import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, AlertCircle } from "lucide-react";

interface MapTrackerProps {
  driverLocation?: { lat: number; lng: number } | null;
  customerLocation?: { lat: number; lng: number } | null;
  destination?: string;
  distance?: number;
  isTracking: boolean;
}

export function DriverMapTracker({
  driverLocation,
  customerLocation,
  destination,
  distance,
  isTracking,
}: MapTrackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !driverLocation) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid background
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i <= canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Normalize coordinates to canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 50000; // Adjust for zoom level

    // Draw destination if available
    if (customerLocation) {
      const deltaLat = (customerLocation.lat - driverLocation.lat) * scale;
      const deltaLng = (customerLocation.lng - driverLocation.lng) * scale;

      // Draw destination marker
      const destX = centerX + deltaLng;
      const destY = centerY - deltaLat;

      // Destination circle
      ctx.fillStyle = "#ff6b6b";
      ctx.beginPath();
      ctx.arc(destX, destY, 12, 0, Math.PI * 2);
      ctx.fill();

      // Destination icon
      ctx.fillStyle = "white";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("📍", destX, destY);

      // Draw route line
      ctx.strokeStyle = "#4CAF50";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(destX, destY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw driver marker
    ctx.fillStyle = "#2196F3";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Driver icon with animation
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚗", centerX, centerY);

    // Draw heading indicator
    if (isTracking) {
      ctx.strokeStyle = "#2196F3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, centerY - 30);
      ctx.stroke();
    }
  }, [driverLocation, customerLocation, isTracking]);

  if (!driverLocation) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Enable location to see map</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Real-Time Tracking Map
          </CardTitle>
          {isTracking && <Badge className="bg-chart-1 animate-pulse">LIVE</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas Map */}
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full border rounded-lg bg-white"
        />

        {/* Map Legend & Info */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span className="font-semibold">Your Position</span>
            </div>
            <p className="text-xs text-muted-foreground">
              📍 {driverLocation?.lat.toFixed(4)}, {driverLocation?.lng.toFixed(4)}
            </p>
          </div>

          <div className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="font-semibold">Destination</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{destination || "Not set"}</p>
          </div>

          <div className="text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="font-semibold">Distance</span>
            </div>
            <p className="text-xs text-muted-foreground font-bold text-primary">
              {distance ? `${distance.toFixed(1)} km` : "--"}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="p-3 bg-white rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-chart-1 animate-pulse" />
            <span className="text-sm">
              {isTracking
                ? "📡 Live tracking active - Customer can see your location"
                : "⏸️ Tracking inactive"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
