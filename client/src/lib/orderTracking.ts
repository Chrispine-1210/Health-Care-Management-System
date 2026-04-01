type TrackingStep = {
  label: string;
  reached: boolean;
};

const ORDER_STAGE_LABELS = ["Review", "Preparation", "On The Way", "Delivered"] as const;

export function normalizeTrackingStatus(status?: string | null) {
  switch (status) {
    case "assigned":
      return "pending";
    case "picked_up":
      return "processing";
    default:
      return status ?? "pending";
  }
}

export function getTrackingProgress(status?: string | null) {
  switch (normalizeTrackingStatus(status)) {
    case "pending":
      return 18;
    case "confirmed":
      return 34;
    case "processing":
      return 56;
    case "ready":
      return 74;
    case "in_transit":
      return 90;
    case "delivered":
      return 100;
    case "cancelled":
      return 0;
    default:
      return 0;
  }
}

export function getTrackingHeadline(status?: string | null) {
  switch (normalizeTrackingStatus(status)) {
    case "pending":
      return "Awaiting review";
    case "confirmed":
      return "Order confirmed";
    case "processing":
      return "Preparing medicines";
    case "ready":
      return "Ready for dispatch";
    case "in_transit":
      return "Heading to destination";
    case "delivered":
      return "Delivered successfully";
    case "cancelled":
      return "Order cancelled";
    default:
      return "Tracking unavailable";
  }
}

export function getTrackingSteps(status?: string | null): TrackingStep[] {
  const progress = getTrackingProgress(status);
  const thresholds = [18, 56, 90, 100];

  return ORDER_STAGE_LABELS.map((label, index) => ({
    label,
    reached: progress >= thresholds[index],
  }));
}

export function formatTrackingDistance(distance?: string | number | null) {
  if (distance === null || distance === undefined || distance === "") {
    return null;
  }

  const parsed = Number(distance);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return `${parsed.toFixed(1)} km remaining`;
}

export function getEstimatedArrivalLabel(status?: string | null, distance?: string | number | null) {
  const normalizedStatus = normalizeTrackingStatus(status);
  if (normalizedStatus !== "in_transit" && normalizedStatus !== "ready") {
    return null;
  }

  const parsedDistance = Number(distance);
  if (Number.isNaN(parsedDistance) || parsedDistance <= 0) {
    return normalizedStatus === "ready" ? "Dispatching soon" : "Approaching destination";
  }

  const minutes = Math.max(5, Math.round((parsedDistance / 25) * 60));
  return `Approx. ${minutes} min to destination`;
}
