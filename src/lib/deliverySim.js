/*
  Delivery simulation — drives a rider along an order's route in real time.
  Interpolates position along the polyline, reports remaining distance and ETA,
  and ticks the order's status timeline as the journey progresses.
*/

const R = 6371; // km
const toRad = (d) => (d * Math.PI) / 180;

export function haversineKm(a, b) {
  if (!a || !b) return 0;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function routeLengthKm(route) {
  let total = 0;
  for (let i = 1; i < route.length; i++) total += haversineKm(route[i - 1], route[i]);
  return total;
}

/** Position + heading at a given fraction along the route. */
export function pointAt(route, fraction) {
  if (!route || route.length === 0) return null;
  if (route.length === 1) return { lat: route[0][0], lng: route[0][1], heading: 0 };
  const segs = [];
  let total = 0;
  for (let i = 1; i < route.length; i++) {
    const d = haversineKm(route[i - 1], route[i]);
    segs.push({ from: route[i - 1], to: route[i], d, start: total });
    total += d;
  }
  if (total === 0) return { lat: route[0][0], lng: route[0][1], heading: 0 };

  const target = Math.max(0, Math.min(1, fraction)) * total;
  for (const s of segs) {
    if (target <= s.start + s.d || s === segs[segs.length - 1]) {
      const t = s.d === 0 ? 0 : (target - s.start) / s.d;
      const lat = s.from[0] + (s.to[0] - s.from[0]) * t;
      const lng = s.from[1] + (s.to[1] - s.from[1]) * t;
      const heading = (Math.atan2(s.to[1] - s.from[1], s.to[0] - s.from[0]) * 180) / Math.PI;
      return { lat, lng, heading };
    }
  }
  const last = route[route.length - 1];
  return { lat: last[0], lng: last[1], heading: 0 };
}

/**
 * Stage thresholds: the first stages tick quickly, the remainder of the run
 * is reserved for the actual ride so the map motion is the main event.
 */
function stageThresholds(stages) {
  const n = stages.length;
  if (n === 0) return [];
  return stages.map((_, i) => (i === n - 1 ? 1 : (i / (n - 1)) * 0.55));
}

/** Build a gently curving route between two [lat,lng] points. */
export function buildRoute(from, to, steps = 27) {
  if (!from || !to) return [];
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = from[0] + (to[0] - from[0]) * t;
    const lng = from[1] + (to[1] - from[1]) * t;
    // slight lateral bow so the path reads as a road, not a ruler line
    const bow = Math.sin(t * Math.PI) * 0.0022;
    pts.push([Number((lat + bow).toFixed(6)), Number((lng - bow * 0.6).toFixed(6))]);
  }
  return pts;
}

/**
 * createDeliveryRunner(order, handlers) -> { start, stop, destroy }
 * handlers: { onTick(state), onStage(index), onArrive() }
 */
export function createDeliveryRunner(order, { onTick, onStage, onArrive, durationMs = 75000 } = {}) {
  const route = order?.route || [];
  const stages = order?.timeline || [];
  const thresholds = stageThresholds(stages);
  const totalKm = routeLengthKm(route);
  const outIdx = stages.findIndex((s) => s.status === "out_for_delivery");
  const travelStart = outIdx >= 0 ? thresholds[outIdx] : 0.5;

  let raf = 0;
  let startedAt = 0;
  let lastStage = -1;
  let stopped = false;

  const step = (now) => {
    if (stopped) return;
    if (!startedAt) startedAt = now;
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / durationMs);

    // stage ticks
    let stage = 0;
    for (let i = 0; i < thresholds.length; i++) {
      if (progress >= thresholds[i]) stage = i;
    }
    if (stage !== lastStage) {
      lastStage = stage;
      onStage?.(stage, stages[stage]);
    }

    // rider position along the route
    const travelFrac =
      travelStart >= 1 ? 1 : Math.max(0, Math.min(1, (progress - travelStart) / (1 - travelStart)));
    const pos = pointAt(route, travelFrac);
    const remainingKm = totalKm * (1 - travelFrac);
    const riderVisible = outIdx >= 0 ? progress >= travelStart : true;

    onTick?.({
      progress,
      travelFraction: travelFrac,
      position: pos,
      remainingKm,
      totalKm,
      riderVisible,
      stage,
      etaMinutes: Math.max(0, Math.round((remainingKm / (totalKm || 1)) * 12)),
    });

    if (progress >= 1) {
      onArrive?.();
      return;
    }
    raf = requestAnimationFrame(step);
  };

  return {
    start() {
      stopped = false;
      raf = requestAnimationFrame(step);
    },
    stop() {
      stopped = true;
      cancelAnimationFrame(raf);
    },
    destroy() {
      stopped = true;
      cancelAnimationFrame(raf);
    },
  };
}
