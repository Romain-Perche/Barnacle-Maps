// Playwright helper for the SF-72 AI scenarios (tests/ai/us*.md). The VM cannot reach the OSRM
// servers, Nominatim or the OSM tiles, so the page's requests to them are answered here:
// - OSRM (routing.openstreetmap.de/routed-{foot,car,bike}): each request is checked against the OSRM
//   docs by test/fakes/osrm.js; a refused request gets HTTP 400 InvalidQuery and is logged in `log.refused`.
// - Nominatim /search: jsonv2 results (fields display_name, lat, lon as strings, per the Nominatim docs).
// - Tiles: solid PNGs, park green (#c8facc) when the tile x is even, land beige (#f2efe9) when odd.
// - unpkg.com (Leaflet 1.9.4): served from a local copy, LEAFLET_DIST or /tmp/leaflet/package/dist
//   (made with `npm pack leaflet@1.9.4`; the npm registry is reachable, unpkg.com is not).
//
// Usage (run from the repository root, app served by `npm start` on port 8000):
//   import { chromium } from "playwright";
//   import { installFakes, PLACES, START } from "./tests/ai/support/fake-services.mjs";
//   const context = await browser.newContext({ geolocation: START, permissions: ["geolocation"] });
//   const page = await context.newPage();
//   const log = await installFakes(page, { delayMs: { bike: 3000 } }); // options: see installFakes
//   await page.goto("http://localhost:8000");
//   // log.osrm: [{ url, server: "foot"|"car"|"bike", profile, coords, status }], log.refused: [...]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";
import { checkRouteRequest, loadOsrmSchema, routeResponse } from "../../../test/fakes/osrm.js";

export const START = { latitude: 48.853, longitude: 2.3499 }; // near Notre-Dame, Paris
export const PLACES = {
  "Jardin du Luxembourg": { display_name: "Jardin du Luxembourg, Paris 6e, Paris, Île-de-France, France", lat: "48.8462", lon: "2.3372" },
  "Tour Eiffel": { display_name: "Tour Eiffel, Avenue Anatole France, Paris 7e, Paris, Île-de-France, France", lat: "48.8584", lon: "2.2945" },
  // About 17 km from START: over the 15 km pleasure limit.
  "Château de Versailles": { display_name: "Château de Versailles, Place d'Armes, Versailles, Yvelines, Île-de-France, France", lat: "48.8049", lon: "2.1204" },
  // Destination where the fake bike server has no route (HTTP 400, code NoRoute, as the OSRM docs say).
  "Île aux Cygnes": { display_name: "Île aux Cygnes, Paris 15e, Paris, Île-de-France, France", lat: "48.8500", lon: "2.2810" },
};

// Speeds (m/s) per OSRM server, so durations differ by mode like the real profiles.
const SPEED = { foot: 1.4, bike: 4.5, car: 9 };

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function solidPng([r, g, b]) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(256, 0);
  ihdr.writeUInt32BE(256, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(256 * 3).map((_, i) => [r, g, b][i % 3])]);
  const raw = Buffer.concat(Array.from({ length: 256 }, () => row));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const GREEN_TILE = solidPng([200, 250, 204]);
const LAND_TILE = solidPng([242, 239, 233]);

function metres([lng1, lat1], [lng2, lat2]) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(h));
}
const pathLength = (pts) => pts.slice(1).reduce((s, p, i) => s + metres(pts[i], p), 0);

// Route variants: straight through the points, then two detours bending the first leg sideways.
function variants(coords, count) {
  const out = [];
  for (let v = 0; v < count; v++) {
    const off = [0, 0.004, -0.004][v];
    const pts = [coords[0]];
    for (let i = 1; i < coords.length; i++) {
      const [a, b] = [coords[i - 1], coords[i]];
      if (i === 1 && off) pts.push([(a[0] + b[0]) / 2 + off, (a[1] + b[1]) / 2 - off]);
      pts.push(b);
    }
    out.push(pts);
  }
  return out;
}

// Options: delayMs { foot|car|bike: ms } delays that server's answers; fail [servers] aborts their requests
// (network error); noRoute [place names] where the bike server answers HTTP 400 NoRoute; single [servers]
// that return only 1 route even when alternatives are asked (as OSRM often does for short trips).
export async function installFakes(page, { delayMs = {}, fail = [], noRoute = ["Île aux Cygnes"], single = [] } = {}) {
  const schema = loadOsrmSchema();
  if (!schema) throw new Error("OSRM docs missing: .factory/schemas/osrm-http.md (see .factory/test-env.md)");
  const log = { osrm: [], refused: [], search: [] };
  const noRouteAt = noRoute.map((name) => [Number(PLACES[name].lon), Number(PLACES[name].lat)]);

  await page.route("https://routing.openstreetmap.de/**", async (route) => {
    const url = route.request().url();
    const server = (url.match(/routed-(foot|car|bike)\//) || [])[1] || "unknown";
    let req;
    try {
      req = checkRouteRequest(url, schema);
    } catch (err) {
      log.refused.push({ url, error: err.message });
      return route.fulfill({ status: 400, json: { code: "InvalidQuery", message: err.message } });
    }
    if (delayMs[server]) await new Promise((r) => setTimeout(r, delayMs[server]));
    if (fail.includes(server)) {
      log.osrm.push({ url, server, profile: req.profile, coords: req.coords, status: "aborted" });
      return route.abort("connectionrefused");
    }
    const dest = req.coords[req.coords.length - 1];
    if (server === "bike" && noRouteAt.some((p) => metres(p, dest) < 50)) {
      log.osrm.push({ url, server, profile: req.profile, coords: req.coords, status: 400 });
      return route.fulfill({ status: 400, json: routeResponse(req.coords, []) });
    }
    const count = req.query.has("alternatives") && req.coords.length === 2 && !single.includes(server) ? 3 : 1;
    const routes = variants(req.coords, count).map((pts) => {
      const distance = Math.round(pathLength(pts) * 1.25);
      return { distance, duration: Math.round(distance / (SPEED[server] ?? 1.4)), coordinates: pts };
    });
    log.osrm.push({ url, server, profile: req.profile, coords: req.coords, status: 200 });
    return route.fulfill({ status: 200, json: routeResponse(req.coords, routes) });
  });

  await page.route("https://nominatim.openstreetmap.org/**", async (route) => {
    const q = new URL(route.request().url()).searchParams.get("q") || "";
    log.search.push(q);
    const hits = Object.entries(PLACES)
      .filter(([name]) => name.toLowerCase().includes(q.toLowerCase().split(",")[0].trim()) || q.toLowerCase().includes(name.toLowerCase()))
      .map(([, p], i) => ({ place_id: 1000 + i, category: "leisure", type: "park", place_rank: 25, importance: 0.5, ...p }));
    return route.fulfill({ status: 200, json: hits });
  });

  // unpkg.com is blocked too: serve Leaflet 1.9.4 from a local `npm pack` copy (see the scenario setup).
  const leafletDist = process.env.LEAFLET_DIST || "/tmp/leaflet/package/dist";
  await page.route("https://unpkg.com/leaflet@1.9.4/dist/**", async (route) => {
    const file = route.request().url().split("/dist/")[1].split("?")[0];
    try {
      const body = readFileSync(join(leafletDist, file));
      const contentType = file.endsWith(".css") ? "text/css" : file.endsWith(".js") ? "application/javascript" : "image/png";
      return route.fulfill({ status: 200, contentType, body });
    } catch {
      return route.fulfill({ status: 404, body: `missing ${file} in ${leafletDist}` });
    }
  });

  await page.route("https://tile.openstreetmap.org/**", async (route) => {
    const m = route.request().url().match(/\/(\d+)\/(\d+)\/(\d+)\.png/);
    const x = m ? Number(m[2]) : 0;
    return route.fulfill({ status: 200, contentType: "image/png", body: x % 2 === 0 ? GREEN_TILE : LAND_TILE });
  });

  return log;
}
