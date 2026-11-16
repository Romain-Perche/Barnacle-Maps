// Fake OSRM route service, checked against the official OSRM HTTP API docs
// (.factory/schemas/osrm-http.md, see .factory/test-env.md). Used by test/bike.test.js and by the
// AI scenarios in tests/ai/ (through tests/ai/support/fake-services.mjs).
//
// checkRouteRequest(url, schema) throws when the request is one the documented route service refuses:
// wrong path, coordinates out of range, an option the docs do not list, or a value the docs do not allow.
// routeResponse(...) builds a response with the documented Route object shape.
import { existsSync, readFileSync } from "node:fs";

export const SCHEMA_PATH = new URL("../../.factory/schemas/osrm-http.md", import.meta.url);

// Returns { options: Map(name -> allowed values string) } read from the docs, or null when the file is missing.
export function loadOsrmSchema(path = SCHEMA_PATH) {
  if (!existsSync(path)) return null;
  const md = readFileSync(path, "utf8");
  const section = (start, end) => {
    const i = md.indexOf(start);
    if (i < 0) throw new Error(`OSRM docs: section "${start}" not found`);
    const j = md.indexOf(end, i + start.length);
    return md.slice(i, j < 0 ? undefined : j);
  };
  const options = new Map();
  const rows = (text) => {
    for (const line of text.split("\n")) {
      const m = line.match(/^\|\s*([a-z_\\]+)\s*\|([^|]*)\|/);
      if (!m) continue;
      const name = m[1].replace(/\\/g, "");
      if (name === "option") continue;
      options.set(name, m[2]);
    }
  };
  rows(section("### Requests", "#### Example Requests"));
  rows(section("### Route service", "**Response**"));
  if (!options.has("alternatives") || !options.has("geometries")) {
    throw new Error("OSRM docs: route options table not recognised");
  }
  return { options };
}

function valueAllowed(spec, value) {
  const allowed = [...spec.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  if (allowed.includes(value)) return true;
  if (/Number|integer/i.test(spec) && /^\d+$/.test(value)) return true;
  return false;
}

// Returns { base, profile, coords: [[lng, lat], ...], query: URLSearchParams } or throws.
export function checkRouteRequest(url, schema) {
  if (!schema) throw new Error("OSRM schema missing");
  const u = new URL(url);
  const m = u.pathname.match(/^(.*)\/route\/v1\/([^/]+)\/([^/]+?)(\.json)?$/);
  if (!m) throw new Error(`not a /route/v1/{profile}/{coordinates} request: ${u.pathname}`);
  const [, prefix, profile, rawCoords] = m;
  const coords = decodeURIComponent(rawCoords).split(";").map((pair) => {
    const parts = pair.split(",");
    if (parts.length !== 2) throw new Error(`coordinate "${pair}" is not {longitude},{latitude}`);
    const [lng, lat] = parts.map(Number);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new Error(`longitude out of range: ${pair}`);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error(`latitude out of range: ${pair}`);
    return [lng, lat];
  });
  if (coords.length < 2) throw new Error("route needs at least 2 coordinates");
  for (const [name, value] of u.searchParams) {
    const spec = schema.options.get(name);
    if (spec === undefined) throw new Error(`option "${name}" is not in the OSRM route docs`);
    if (!valueAllowed(spec, value)) throw new Error(`option ${name}=${value} is not allowed by the OSRM docs`);
  }
  return { base: `${u.origin}${prefix}`, profile, coords, query: u.searchParams };
}

// A documented route response. `routes` is a list of { distance, duration, coordinates? }; geometry is a
// GeoJSON LineString through the request coordinates when none is given.
export function routeResponse(coords, routes) {
  if (!routes.length) return { code: "NoRoute", message: "No route found." };
  return {
    code: "Ok",
    waypoints: coords.map(([lng, lat]) => ({ name: "", location: [lng, lat], distance: 0, hint: "" })),
    routes: routes.map((r) => ({
      distance: r.distance,
      duration: r.duration,
      weight: r.duration,
      weight_name: "duration",
      geometry: { type: "LineString", coordinates: r.coordinates ?? coords },
      legs: coords.slice(1).map(() => ({ distance: r.distance / (coords.length - 1), duration: r.duration / (coords.length - 1), weight: r.duration / (coords.length - 1), summary: "", steps: [] })),
    })),
  };
}
