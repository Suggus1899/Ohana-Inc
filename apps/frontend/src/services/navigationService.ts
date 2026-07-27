// Threshold in meters to consider user off-route
const OFF_ROUTE_THRESHOLD = 50;

/**
 * Calculates the perpendicular distance from a point to a line segment
 */
const getDistanceToSegment = (
  p: [number, number],
  a: [number, number],
  b: [number, number]
): number => {
  const x = p[0], y = p[1];
  const x1 = a[0], y1 = a[1];
  const x2 = b[0], y2 = b[1];

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  
  // Convert lat/lng distance to meters (approximation)
  // 1 degree latitude is approx 111,320 meters
  // 1 degree longitude is approx 111,320 * cos(lat) meters
  const latMeters = dy * 111320;
  const lngMeters = dx * 111320 * Math.cos(y * Math.PI / 180);
  
  return Math.sqrt(latMeters * latMeters + lngMeters * lngMeters);
};

/**
 * Calculates the Haversine-like distance between two points in meters
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const dy = lat1 - lat2;
  const dx = lng1 - lng2;
  
  const latMeters = dy * 111320;
  const lngMeters = dx * 111320 * Math.cos(lat1 * Math.PI / 180);
  
  return Math.sqrt(latMeters * latMeters + lngMeters * lngMeters);
};

export const isUserOffRoute = (
  currentLat: number,
  currentLng: number,
  routeGeometry: [number, number][]
): boolean => {
  if (routeGeometry.length < 2) return false;

  let minDistance = Infinity;

  for (let i = 0; i < routeGeometry.length - 1; i++) {
    const distance = getDistanceToSegment(
      [currentLng, currentLat],
      routeGeometry[i],
      routeGeometry[i + 1]
    );
    if (distance < minDistance) minDistance = distance;
  }

  return minDistance > OFF_ROUTE_THRESHOLD;
};

export const findCurrentStepIndex = (
  currentLat: number,
  currentLng: number,
  steps: Array<{ maneuver: { location: [number, number] } }>
): number => {
  let closestIndex = 0;
  let minDistance = Infinity;

  steps.forEach((step, index) => {
    const [stepLng, stepLat] = step.maneuver.location;
    const dy = currentLat - stepLat;
    const dx = currentLng - stepLng;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
};
