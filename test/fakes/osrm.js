// Fake OSRM route service (FOSSGIS servers at routing.openstreetmap.de), checked against the
// OSRM HTTP API docs (.factory/schemas/osrm-http.md, see .factory/test-env.md).
// It refuses what real OSRM refuses (unknown option, bad value, bad coordinates, unknown server)
// and answers in the documented shape: 200 + { code: "Ok", waypoints, routes } or
// 400 + { code: "<error>", message } (the docs: "In case of an error the HTTP status code will be 400").
import { existsSync, readFileSync } from "node:fs";

// Options documented for the route service: the general options plus the route options.
export const GENERAL_OPTIONS = [
  "bearings", "radiuses", "generate_hints", "hints", "approaches", "exclude", "snapping", "skip_waypoints",
];
export const ROUTE_OPTIONS = [
  "alternatives", "steps", "annotations", "geometries", "overview", "continue_straight", "waypoints",
];
const VALUES = {
  geometries: ["polyline", "polyline6", "geojson"],
  overview: ["simplified", "full", "false", "by_legs"],
  steps: ["true", "false"],
  generate_hints: ["true", "false"],
  skip_waypoints: ["true", "false"],
  continue_straight: ["default", "true", "false"],
  snapping: ["default", "any"],
};

// FOSSGIS servers: one OSRM instance per profile. Speeds (m/s) give mode-like durations.
export const SERVERS = {
  "https://routing.openstreetmap.de/routed-foot": { speed: 1.4 },
  "https://routing.openstreetmap.de/routed-bike": { speed: 4.5 },
  "https://routing.openstreetmap.de/routed-car": { speed: 11 },
};

export const SCHEMA_PATH = new URL("../../.factory/schemas/osrm-http.md", import.meta.url);

// Option names of the first markdown table after `heading` in the docs (null when no docs file).
export function schemaOptionNames(heading) {
  if (!existsSync(SCHEMA_PATH)) return null;
  const doc = readFileSync(SCHEMA_PATH, "utf8");
  const start = doc.indexOf(heading);
  if (start < 0) throw new Error(`heading not found in OSRM docs: ${heading}`);
  const lines = doc.slice(start).split("\n");
  const first = lines.findIndex((l) => l.startsWith("|"));
  const names = [];
  for (const l of lines.slice(first + 2)) {
    if (!l.startsWith("|")) break;
    names.push(l.split("|")[1].trim().replace(/\\_/g, "_"));
  }
  return names;
}

const R = 6371008.8;
function metres(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(b[1] - a[1]) / 2) ** 2 +
    Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function error(code, message) {
  return { status: 400, body: { code, message } };
}

// Validates a route request URL like real OSRM. Returns null when valid, else the 400 answer.
export function checkRouteUrl(url) {
  let u;
  try { u = new URL(url); } catch { return error("InvalidUrl", "URL string malformed close to position 0"); }
  const m = u.pathname.match(/^(\/[^/]+)\/route\/v1\/([^/]+)\/([^/]+)$/);
  if (!m) return error("InvalidUrl", "URL string malformed");
  const base = `${u.origin}${m[1]}`;
  if (!SERVERS[base]) return error("InvalidUrl", `unknown server ${base}`);
  const coords = m[3].split(";").map((p) => p.split(",").map(Number));
  if (coords.length < 2) return error("InvalidUrl", "need at least 2 coordinates");
  for (const c of coords) {
    if (c.length !== 2 || !c.every(Number.isFinite) || Math.abs(c[0]) > 180 || Math.abs(c[1]) > 90) {
      return error("InvalidValue", "Invalid coordinate value.");
    }
  }
  for (const [k, v] of u.searchParams) {
    if (!GENERAL_OPTIONS.includes(k) && !ROUTE_OPTIONS.includes(k)) return error("InvalidOptions", `unknown option ${k}`);
    if (VALUES[k] && !VALUES[k].includes(v)) return error("InvalidValue", `invalid value for ${k}: ${v}`);
    if (k === "alternatives" && !/^(true|false|\d+)$/.test(v)) return error("InvalidValue", `invalid alternatives ${v}`);
  }
  return null;
}

// Answers a route request. opts: { routes: n (max routes returned, default: 3 with alternatives
// else 1), noRoute: true (code NoRoute) }. Each extra route bends sideways (~250 m per rank) so
// alternatives are distinct; duration = distance / server speed.
export function answerRoute(url, opts = {}) {
  const bad = checkRouteUrl(url);
  if (bad) return bad;
  const u = new URL(url);
  const [, prefix, , coordsText] = u.pathname.match(/^(\/[^/]+)\/route\/v1\/([^/]+)\/([^/]+)$/);
  const { speed } = SERVERS[`${u.origin}${prefix}`];
  if (opts.noRoute) return error("NoRoute", "Impossible route between points");
  const pts = coordsText.split(";").map((p) => p.split(",").map(Number));
  const alt = u.searchParams.get("alternatives");
  const wanted = alt && alt !== "false" ? 1 + (alt === "true" ? 2 : Number(alt)) : 1;
  const count = Math.min(wanted, opts.routes ?? wanted);
  const routes = [];
  for (let r = 0; r < count; r++) {
    const coordinates = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const off = Math.ceil(r / 2) * 0.0025 * (r % 2 ? 1 : -1);
      coordinates.push([(a[0] + b[0]) / 2 + off, (a[1] + b[1]) / 2 - off], b);
    }
    let distance = 0;
    for (let i = 1; i < coordinates.length; i++) distance += metres(coordinates[i - 1], coordinates[i]);
    const duration = distance / speed;
    routes.push({
      distance, duration, weight: duration, weight_name: "routability",
      geometry: { type: "LineString", coordinates },
      legs: pts.slice(1).map(() => ({ distance: distance / (pts.length - 1), duration: duration / (pts.length - 1), weight: duration / (pts.length - 1), summary: "", steps: [] })),
    });
  }
  routes.sort((x, y) => x.duration - y.duration);
  const waypoints = pts.map((p) => ({ hint: "AAAA", distance: 1.5, name: "Rue Fictive", location: p }));
  return { status: 200, body: { code: "Ok", waypoints, routes } };
}
