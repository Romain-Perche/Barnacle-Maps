// Pure helpers for Barnacle Maps (no DOM access, so they can be unit tested in Node).

const EARTH_RADIUS_M = 6371008.8;

export function haversine(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 2 : 1)} km`;
}

export function formatDuration(seconds) {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function searchUrl(query, base = "https://nominatim.openstreetmap.org") {
  const p = new URLSearchParams({ q: query, format: "jsonv2", limit: "5" });
  return `${base}/search?${p}`;
}

export function parseSearchResults(json) {
  if (!Array.isArray(json)) return [];
  return json
    .map((r) => ({
      name: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }))
    .filter((r) => r.name && Number.isFinite(r.lat) && Number.isFinite(r.lng));
}

// OSRM expects lng,lat order. The "foot" profile gives walking routes.
export function routeUrl(from, to, base = "https://routing.openstreetmap.de/routed-foot") {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  return `${base}/route/v1/foot/${coords}?overview=full&geometries=geojson`;
}

// Returns { distance, duration, path: [[lat, lng], ...] } or null when no route exists.
export function parseRoute(json) {
  const route = json && json.code === "Ok" && json.routes && json.routes[0];
  if (!route) return null;
  return {
    distance: route.distance,
    duration: route.duration,
    path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  };
}
