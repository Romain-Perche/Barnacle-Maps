// Pure helpers for Barnacle Maps (no DOM access and no fetch, so they can be unit tested in Node):
// formatting, Nominatim search, OSRM walking and car routes (alternatives, detours, de-duplication)
// the green-pixel "pleasure" score of a route on map tiles, and the list of stops of a journey
// (add, remove, reorder; routes go from the start through every stop in order to the destination).

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

// `convert` loads without blocking the app (import map in index.html in the browser, node_modules in Node).
// Until it has loaded, or if it fails, distances use the fallback: whole metres.
let convert;
export const distanceFormatReady = import("convert").then(
  (m) => {
    convert = m.convert;
  },
  () => {},
);

export function formatDistance(meters, conv = convert) {
  if (typeof meters !== "number" || !Number.isFinite(meters) || meters < 0) return "—";
  const m = Math.round(meters);
  if (!conv) return `${m} m`;
  if (m === 0) return "0 m";
  const { quantity, unit } = conv(m, "m").to("best", "metric");
  return `${+quantity.toFixed(1)} ${unit}`;
}

export function formatDuration(seconds) {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Minimum trimmed query length before suggestions are fetched while typing.
export const MIN_SUGGEST_CHARS = 3;

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

export const TRAVEL_MODES = {
  foot: { label: "Walk", base: "https://routing.openstreetmap.de/routed-foot", profile: "foot" },
  car: { label: "Car", base: "https://routing.openstreetmap.de/routed-car", profile: "driving" },
};

// OSRM expects lng,lat order. The "foot" profile gives walking routes, "driving" (mode "car") car routes.
// `stops` are visited in order, `via` forces the route through a waypoint (after the stops);
// `alternatives` asks OSRM for alternative routes.
export function routeUrl(
  from,
  to,
  base,
  { alternatives = 0, via = null, mode = "foot", stops = [] } = {},
) {
  const m = TRAVEL_MODES[mode] || TRAVEL_MODES.foot;
  const pts = [from, ...(stops || []), ...(via ? [via] : []), to];
  const coords = pts.map((p) => `${p.lng},${p.lat}`).join(";");
  const alt = alternatives > 0 ? "&alternatives=3" : "";
  return `${base ?? m.base}/route/v1/${m.profile}/${coords}?overview=full&geometries=geojson${alt}`;
}

// --- Stops -----------------------------------------------------------------------------------
// A stop is { name, lat, lng }. Helpers never mutate the list they get.

export const MAX_STOPS = 5;
// A place closer than this (metres) to an existing stop counts as the same stop.
export const STOP_DUPLICATE_M = 20;

// Appends a stop. Returns { stops, error } with error null, "limit" or "duplicate".
export function addStop(stops, place, max = MAX_STOPS) {
  if (stops.length >= max) return { stops: [...stops], error: "limit" };
  if (stops.some((s) => haversine(s, place) <= STOP_DUPLICATE_M)) {
    return { stops: [...stops], error: "duplicate" };
  }
  return { stops: [...stops, { name: place.name, lat: place.lat, lng: place.lng }], error: null };
}

export function removeStop(stops, index) {
  if (!Number.isInteger(index) || index < 0 || index >= stops.length) return [...stops];
  return stops.filter((_, i) => i !== index);
}

// Swaps the stop at index with the one at index + delta (e.g. -1 = up, 1 = down).
export function moveStop(stops, index, delta) {
  const out = [...stops];
  const j = index + delta;
  if (!Number.isInteger(index) || !Number.isInteger(j)) return out;
  if (index < 0 || index >= out.length || j < 0 || j >= out.length) return out;
  [out[index], out[j]] = [out[j], out[index]];
  return out;
}

export function mapPointStop({ lat, lng }) {
  return { name: `Point on map (${lat.toFixed(5)}, ${lng.toFixed(5)})`, lat, lng };
}

// Sum of the straight-line distances (metres) between consecutive { lat, lng } points.
export function straightLineLength(points) {
  let total = 0;
  for (let i = 1; i < (points || []).length; i++) total += haversine(points[i - 1], points[i]);
  return total;
}

// Returns every route as { distance, duration, path: [[lat, lng], ...] }, or [] when none exists.
export function parseRoutes(json) {
  if (!json || json.code !== "Ok" || !Array.isArray(json.routes)) return [];
  return json.routes
    .filter((r) => r && r.geometry && Array.isArray(r.geometry.coordinates))
    .map((route) => ({
      distance: route.distance,
      duration: route.duration,
      path: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    }));
}

// Returns { distance, duration, path: [[lat, lng], ...] } or null when no route exists.
export function parseRoute(json) {
  return parseRoutes(json)[0] ?? null;
}

// --- Local geometry -------------------------------------------------------------------------
// Small distances are computed in a local equirectangular projection (metres), with longitude
// scaled by cos(reference latitude). Points may be [lat, lng] arrays or { lat, lng } objects.

const M_PER_DEG_LAT = (Math.PI / 180) * EARTH_RADIUS_M;

function toLatLng(p) {
  return Array.isArray(p) ? { lat: p[0], lng: p[1] } : { lat: p.lat, lng: p.lng };
}

function project(p, refLat) {
  const { lat, lng } = toLatLng(p);
  const k = Math.cos((refLat * Math.PI) / 180);
  return { x: lng * M_PER_DEG_LAT * k, y: lat * M_PER_DEG_LAT };
}

function unproject(pt, refLat) {
  const k = Math.cos((refLat * Math.PI) / 180);
  return { lat: pt.y / M_PER_DEG_LAT, lng: pt.x / (M_PER_DEG_LAT * k) };
}

function segDistXY(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

// Distance in metres from point p to segment a-b.
export function pointToSegmentDistance(p, a, b) {
  const refLat = toLatLng(p).lat;
  return segDistXY(project(p, refLat), project(a, refLat), project(b, refLat));
}

// Two waypoints, one on each side of the from->to line, offset perpendicular from its midpoint
// by max(150 m, factor x straight-line distance). Used to force detour routes.
export function detourWaypoints(from, to, factor = 0.25) {
  const f = toLatLng(from);
  const t = toLatLng(to);
  const refLat = (f.lat + t.lat) / 2;
  const a = project(f, refLat);
  const b = project(t, refLat);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const offset = Math.max(150, factor * len);
  // Unit perpendicular; north/south when both points are the same.
  const nx = len ? -dy / len : 0;
  const ny = len ? dx / len : 1;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return [
    unproject({ x: mid.x + nx * offset, y: mid.y + ny * offset }, refLat),
    unproject({ x: mid.x - nx * offset, y: mid.y - ny * offset }, refLat),
  ];
}

// Points along a [[lat, lng], ...] path about every stepM metres, always including the
// first and last point.
export function samplePath(path, stepM = 25) {
  if (!Array.isArray(path) || !path.length) return [];
  const out = [[path[0][0], path[0][1]]];
  let carried = 0; // distance travelled since the last emitted sample
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const segLen = haversine(toLatLng(a), toLatLng(b));
    let pos = stepM - carried; // distance along this segment of the next sample
    while (segLen > 0 && pos < segLen) {
      const t = pos / segLen;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      pos += stepM;
    }
    carried = segLen - (pos - stepM);
  }
  const last = path[path.length - 1];
  const prev = out[out.length - 1];
  if (path.length > 1 && (prev[0] !== last[0] || prev[1] !== last[1])) out.push([last[0], last[1]]);
  return out;
}

function minDistToPath(p, path) {
  if (path.length === 1) return haversine(toLatLng(p), toLatLng(path[0]));
  let best = Infinity;
  for (let i = 1; i < path.length; i++) {
    best = Math.min(best, pointToSegmentDistance(p, path[i - 1], path[i]));
  }
  return best;
}

// Share (0..1) of route a's sampled points that lie within 20 m of route b's polyline.
export function routeOverlap(a, b) {
  const samples = samplePath(a.path, 25);
  const other = b.path || [];
  if (!samples.length || !other.length) return 0;
  let near = 0;
  for (const p of samples) if (minDistToPath(p, other) <= 20) near++;
  return near / samples.length;
}

// Keeps the fastest route plus distinct alternatives that are not much longer.
export function pickRoutes(candidates, max = 3) {
  const sorted = (candidates || []).filter(Boolean).slice().sort((x, y) => x.duration - y.duration);
  if (!sorted.length) return [];
  const shortest = Math.min(...sorted.map((r) => r.distance));
  const kept = [sorted[0]];
  for (const r of sorted.slice(1)) {
    if (kept.length >= max) break;
    if (r.distance > 1.6 * shortest) continue;
    if (kept.every((k) => routeOverlap(r, k) < 0.8)) kept.push(r);
  }
  return kept.slice(0, max);
}

// Bounding box { south, west, north, east } of all paths, padded by about padM metres.
export function routesBbox(paths, padM = 100) {
  let south = Infinity, west = Infinity, north = -Infinity, east = -Infinity;
  for (const path of paths || []) {
    for (const [lat, lng] of path || []) {
      south = Math.min(south, lat);
      north = Math.max(north, lat);
      west = Math.min(west, lng);
      east = Math.max(east, lng);
    }
  }
  if (!Number.isFinite(south)) return null;
  const dLat = padM / M_PER_DEG_LAT;
  const k = Math.max(0.01, Math.cos((((south + north) / 2) * Math.PI) / 180));
  const dLng = padM / (M_PER_DEG_LAT * k);
  return { south: south - dLat, west: west - dLng, north: north + dLat, east: east + dLng };
}

// --- Pleasure: green pixels on map tiles -------------------------------------------------------

const TILE_SIZE = 256;

export function lngLatToPixel(lat, lng, zoom) {
  const size = TILE_SIZE * 2 ** zoom;
  const r = (lat * Math.PI) / 180;
  const x = ((lng + 180) / 360) * size;
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * size;
  return { x, y };
}

// Unique integer [x, y] world pixels covered by the polyline, widened by a disc of `radius` px.
export function pathPixels(path, zoom, radius = 0) {
  if (!Array.isArray(path) || path.length === 0) return [];
  const pts = path.map((p) => lngLatToPixel(p[0], p[1], zoom));
  const centres = new Set();
  const add = (x, y) => centres.add(`${Math.floor(x)}:${Math.floor(y)}`);
  add(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const n = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) * 2) + 1;
    for (let k = 0; k <= n; k++) add(a.x + (dx * k) / n, a.y + (dy * k) / n);
  }
  const r = Math.max(0, Math.floor(radius));
  const out = new Map();
  for (const key of centres) {
    const [cx, cy] = key.split(":").map(Number);
    for (let oy = -r; oy <= r; oy++) {
      for (let ox = -r; ox <= r; ox++) {
        if (ox * ox + oy * oy > radius * radius) continue;
        out.set(`${cx + ox}:${cy + oy}`, [cx + ox, cy + oy]);
      }
    }
  }
  return [...out.values()];
}

export function pathTiles(pixels) {
  const seen = new Map();
  for (const [x, y] of pixels || []) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    seen.set(`${tx}/${ty}`, [tx, ty]);
  }
  return [...seen.values()];
}

export function isGreenPixel(r, g, b, a = 255) {
  return a >= 128 && g >= r + 12 && g >= b + 12;
}

// tiles: Map of `${tx}/${ty}` -> RGBA data (256x256x4). Pixels on missing tiles are not counted.
export function countGreenPixels(pixels, tiles) {
  let count = 0;
  for (const [x, y] of pixels) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    const d = tiles.get(`${tx}/${ty}`);
    if (!d) continue;
    const i = ((y - ty * TILE_SIZE) * TILE_SIZE + (x - tx * TILE_SIZE)) * 4;
    if (isGreenPixel(d[i], d[i + 1], d[i + 2], d[i + 3])) count++;
  }
  return count;
}

// Index of the largest count (first wins ties); -1 when there is no green at all.
export function bestPleasure(counts) {
  if (!Array.isArray(counts) || counts.length === 0) return -1;
  let best = 0;
  for (let i = 1; i < counts.length; i++) if (counts[i] > counts[best]) best = i;
  return counts[best] > 0 ? best : -1;
}
