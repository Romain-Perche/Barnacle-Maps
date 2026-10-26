// Pure helpers for Barnacle Maps (no DOM, so they can be unit tested in Node).

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OSRM_FOOT = 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';

export function buildSearchUrl(query, limit = 5) {
  const params = new URLSearchParams({ q: query.trim(), format: 'jsonv2', limit: String(limit) });
  return `${NOMINATIM}?${params}`;
}

export function parseSearchResults(json) {
  return (Array.isArray(json) ? json : []).map((r) => ({
    name: r.display_name,
    lat: Number(r.lat),
    lon: Number(r.lon),
  }));
}

// Coordinates are {lat, lon}; OSRM expects lon,lat order.
export function buildRouteUrl(from, to) {
  const coords = `${from.lon},${from.lat};${to.lon},${to.lat}`;
  return `${OSRM_FOOT}/${coords}?overview=full&geometries=geojson`;
}

// Returns {distance (m), duration (s), path: [[lat, lon], ...]} or null if no route.
export function parseRoute(json) {
  const route = json && json.code === 'Ok' && json.routes && json.routes[0];
  if (!route) return null;
  return {
    distance: route.distance,
    duration: route.duration,
    path: route.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
  };
}

export function formatDistance(meters) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
