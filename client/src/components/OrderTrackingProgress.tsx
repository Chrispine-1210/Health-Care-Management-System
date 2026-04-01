import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  formatTrackingDistance,
  getEstimatedArrivalLabel,
  getTrackingHeadline,
  getTrackingProgress,
  getTrackingSteps,
} from "@/lib/orderTracking";

type OrderTrackingProgressProps = {
  status?: string | null;
  deliveryDistance?: string | number | null;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
};

export function OrderTrackingProgress({
  status,
  deliveryDistance,
  deliveryAddress,
  deliveryNotes,
}: OrderTrackingProgressProps) {
  const progress = getTrackingProgress(status);
  const steps = getTrackingSteps(status);
  const distanceLabel = formatTrackingDistance(deliveryDistance);
  const etaLabel = getEstimatedArrivalLabel(status, deliveryDistance);

  return (
    <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-medium">{getTrackingHeadline(status)}</p>
          <p className="text-sm text-muted-foreground">
            {deliveryAddress || "Destination details will appear when the order is prepared."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {etaLabel && <Badge variant="outline">{etaLabel}</Badge>}
          {distanceLabel && <Badge variant="secondary">{distanceLabel}</Badge>}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Tracking progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.label}
            className={`rounded-lg border px-3 py-2 text-xs font-medium ${
              step.reached ? "border-primary bg-primary/10 text-foreground" : "text-muted-foreground"
            }`}
          >
            {step.label}
          </div>
        ))}
      </div>

      {deliveryNotes && (
        <p className="text-sm text-muted-foreground">Latest update: {deliveryNotes}</p>
      )}
    </div>
  );
}
