// Pure helpers for Barnacle Maps (no DOM access and no fetch, so they can be unit tested in Node):
// formatting, Nominatim search, OSRM walking and car routes (alternatives, detours, de-duplication)
// and the Overpass-based "pleasure" score of a route.

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
// `via` forces the route through a waypoint; `alternatives` asks OSRM for alternative routes.
export function routeUrl(
  from,
  to,
  base,
  { alternatives = 0, via = null, mode = "foot" } = {},
) {
  const m = TRAVEL_MODES[mode] || TRAVEL_MODES.foot;
  const pts = via ? [from, via, to] : [from, to];
  const coords = pts.map((p) => `${p.lng},${p.lat}`).join(";");
  const alt = alternatives > 0 ? "&alternatives=3" : "";
  return `${base ?? m.base}/route/v1/${m.profile}/${coords}?overview=full&geometries=geojson${alt}`;
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

// --- Pleasure score (Overpass) -----------------------------------------------------------------

const BUSY_HIGHWAY = /^(motorway|trunk|primary|secondary)(_link)?$/;

export function overpassQuery(bbox) {
  const b = `(${bbox.south},${bbox.west},${bbox.north},${bbox.east})`;
  return (
    "[out:json][timeout:15];(" +
    `way["leisure"~"^(park|garden|nature_reserve|playground)$"]${b};` +
    `relation["leisure"~"^(park|garden|nature_reserve|playground)$"]${b};` +
    `way["landuse"~"^(grass|forest|meadow|recreation_ground|village_green)$"]${b};` +
    `relation["landuse"~"^(grass|forest|meadow|recreation_ground|village_green)$"]${b};` +
    `way["natural"~"^(wood|water|scrub|beach)$"]${b};` +
    `relation["natural"~"^(wood|water|scrub|beach)$"]${b};` +
    `way["waterway"~"^(river|canal)$"]${b};` +
    `way["highway"~"^(pedestrian|footway|path|living_street|track|steps)$"]${b};` +
    `way["highway"~"^(motorway|trunk|primary|secondary)(_link)?$"]${b};` +
    ");out geom;"
  );
}

function geometrySegments(geometry, out) {
  if (!Array.isArray(geometry)) return;
  for (let i = 1; i < geometry.length; i++) {
    const a = geometry[i - 1];
    const b = geometry[i];
    if (!a || !b || !Number.isFinite(a.lat) || !Number.isFinite(a.lon)) continue;
    if (!Number.isFinite(b.lat) || !Number.isFinite(b.lon)) continue;
    out.push([[a.lat, a.lon], [b.lat, b.lon]]);
  }
}

// Splits Overpass elements into positive (green, water, pedestrian) and negative (busy road)
// segments, each [[lat, lng], [lat, lng]].
export function parseOverpass(json) {
  const positive = [];
  const negative = [];
  if (!json || !Array.isArray(json.elements)) return { positive, negative };
  for (const el of json.elements) {
    if (!el) continue;
    const highway = el.tags && el.tags.highway;
    const target = highway && BUSY_HIGHWAY.test(highway) ? negative : positive;
    if (Array.isArray(el.geometry)) geometrySegments(el.geometry, target);
    if (Array.isArray(el.members)) {
      for (const m of el.members) if (m) geometrySegments(m.geometry, target);
    }
  }
  return { positive, negative };
}

const CELL_DEG = 0.001;

// Grid index of segments: each segment is stored in every cell its bbox (padded by padM) touches,
// restricted to the `limit` bbox so huge features outside the walk are cheap.
function buildGrid(segments, padM, limit) {
  const grid = new Map();
  const dLat = padM / M_PER_DEG_LAT;
  for (const seg of segments) {
    const [[aLat, aLng], [bLat, bLng]] = seg;
    const k = Math.max(0.01, Math.cos((((aLat + bLat) / 2) * Math.PI) / 180));
    const dLng = padM / (M_PER_DEG_LAT * k);
    let s = Math.min(aLat, bLat) - dLat;
    let n = Math.max(aLat, bLat) + dLat;
    let w = Math.min(aLng, bLng) - dLng;
    let e = Math.max(aLng, bLng) + dLng;
    if (n < limit.south || s > limit.north || e < limit.west || w > limit.east) continue;
    s = Math.max(s, limit.south);
    n = Math.min(n, limit.north);
    w = Math.max(w, limit.west);
    e = Math.min(e, limit.east);
    for (let i = Math.floor(s / CELL_DEG); i <= Math.floor(n / CELL_DEG); i++) {
      for (let j = Math.floor(w / CELL_DEG); j <= Math.floor(e / CELL_DEG); j++) {
        const key = `${i}:${j}`;
        const cell = grid.get(key);
        if (cell) cell.push(seg);
        else grid.set(key, [seg]);
      }
    }
  }
  return grid;
}

function nearGrid(grid, p, maxM) {
  const ci = Math.floor(p[0] / CELL_DEG);
  const cj = Math.floor(p[1] / CELL_DEG);
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      const cell = grid.get(`${ci + di}:${cj + dj}`);
      if (!cell) continue;
      for (const [a, b] of cell) if (pointToSegmentDistance(p, a, b) <= maxM) return true;
    }
  }
  return false;
}

// 0..100: share of the walk within 40 m of green/water/pedestrian features, minus half the share
// within 15 m of busy roads. A heuristic, not a measurement.
export function pleasureScore(path, features) {
  const samples = samplePath(path, 25);
  if (!samples.length) return 0;
  const limit = routesBbox([path], 200);
  const pos = buildGrid((features && features.positive) || [], 40, limit);
  const neg = buildGrid((features && features.negative) || [], 15, limit);
  let nice = 0;
  let busy = 0;
  for (const p of samples) {
    if (nearGrid(pos, p, 40)) nice++;
    if (nearGrid(neg, p, 15)) busy++;
  }
  const score = Math.round((100 * (nice - 0.5 * busy)) / samples.length);
  return Math.max(0, Math.min(100, score));
}

// Maps a 0..100 score to a 1..5 level.
export function pleasureLevel(score) {
  if (score <= 20) return 1;
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
}

export function formatPleasure(level) {
  const n = Math.max(0, Math.min(5, Math.round(level) || 0));
  return "●".repeat(n) + "○".repeat(5 - n);
}
