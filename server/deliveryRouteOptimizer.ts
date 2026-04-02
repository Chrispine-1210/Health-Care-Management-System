/**
 * Delivery Route Optimization - Basic algorithm
 */

interface DeliveryStop {
  id: string;
  latitude: number;
  longitude: number;
  orderId: string;
}

export class DeliveryRouteOptimizer {
  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Nearest neighbor algorithm for route optimization
   */
  static optimizeRoute(stops: DeliveryStop[], startLat: number, startLon: number): DeliveryStop[] {
    const unvisited = [...stops];
    const route: DeliveryStop[] = [];
    let currentLat = startLat;
    let currentLon = startLon;

    while (unvisited.length > 0) {
      let nearest = 0;
      let minDistance = Infinity;

      unvisited.forEach((stop, index) => {
        const distance = this.calculateDistance(currentLat, currentLon, stop.latitude, stop.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = index;
        }
      });

      const nextStop = unvisited.splice(nearest, 1)[0];
      route.push(nextStop);
      currentLat = nextStop.latitude;
      currentLon = nextStop.longitude;
    }

    return route;
  }

  /**
   * Calculate total route distance
   */
  static calculateRouteTotalDistance(
    stops: DeliveryStop[],
    startLat: number,
    startLon: number
  ): number {
    let totalDistance = 0;
    let currentLat = startLat;
    let currentLon = startLon;

    stops.forEach(stop => {
      totalDistance += this.calculateDistance(currentLat, currentLon, stop.latitude, stop.longitude);
      currentLat = stop.latitude;
      currentLon = stop.longitude;
    });

    return totalDistance;
  }

  /**
   * Estimate delivery time (30 min + 5 min per stop + driving time)
   */
  static estimateDeliveryTime(distanceKm: number, numStops: number): number {
    const baseTime = 30; // minutes
    const timePerStop = 5; // minutes
    const avgSpeed = 30; // km/h
    const drivingTime = (distanceKm / avgSpeed) * 60; // convert to minutes

    return baseTime + timePerStop * numStops + drivingTime;
  }
}
