// Harness for the AI test scenarios in tests/ai/: opens the real app in headless Chromium
// (Playwright) and answers the outside services the sandbox cannot reach:
//   - unpkg.com/leaflet@1.9.4  -> the real Leaflet 1.9.4 package (npm pack, see LEAFLET_DIR)
//   - nominatim search        -> one place in the documented jsonv2 shape (test/fakes/app-harness.js)
//   - routing.openstreetmap.de -> fake OSRM checked against the OSRM HTTP docs (test/fakes/osrm.js)
//   - tile.openstreetmap.org  -> 256x256 PNG tiles, green (park) when (x + y) is even, else beige
// Every intercepted URL is logged in `log`. Geolocation is granted at Paris (48.8566, 2.3522).
//
// Setup (once):
//   (cd /tmp && npm pack leaflet@1.9.4 && mkdir -p leaflet && tar -xzf leaflet-1.9.4.tgz -C leaflet)
//   (cd <repo> && python3 -m http.server 8000 &)
// Use from a script in the repo root (node >= 20):
//   import { openApp } from "./tests/ai/harness.mjs";
//   const { page, log, close } = await openApp({ routes: 3 });
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { deflateSync, crc32 } from "node:zlib";
import { answerRoute } from "../../test/fakes/osrm.js";
import { nominatimPlace } from "../../test/fakes/app-harness.js";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE ?? "/opt/playwright/node_modules/playwright");
const LEAFLET_DIR = process.env.LEAFLET_DIR ?? "/tmp/leaflet/package/dist";
const APP_URL = process.env.APP_URL ?? "http://localhost:8000/";

function png(rgb) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body) >>> 0);
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(256, 0); ihdr.writeUInt32BE(256, 4); ihdr[8] = 8; ihdr[9] = 2;
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(256 * 3).map((_, i) => rgb[i % 3])]);
  const raw = Buffer.concat(Array.from({ length: 256 }, () => row));
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const GREEN = png([170, 224, 160]);
const BEIGE = png([242, 239, 233]);

// options: { routes, noRoute, place: { display_name, lat, lon }, osrmDelayMs, position: { latitude, longitude } }
export async function openApp(options = {}) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    geolocation: options.position ?? { latitude: 48.8566, longitude: 2.3522 },
    permissions: ["geolocation"],
    viewport: { width: 1000, height: 800 },
  });
  const page = await context.newPage();
  const log = [];
  await page.route(/^https:\/\/unpkg\.com\/leaflet@1\.9\.4\/dist\/(.+)$/, (route) => {
    const file = route.request().url().match(/dist\/([^?]+)/)[1];
    log.push(route.request().url());
    const type = file.endsWith(".css") ? "text/css" : file.endsWith(".png") ? "image/png" : "application/javascript";
    route.fulfill({ status: 200, contentType: type, body: readFileSync(`${LEAFLET_DIR}/${file}`) });
  });
  await page.route(/^https:\/\/nominatim\.openstreetmap\.org\//, (route) => {
    log.push(route.request().url());
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([nominatimPlace(options.place)]) });
  });
  await page.route(/^https:\/\/routing\.openstreetmap\.de\//, async (route) => {
    const url = route.request().url();
    log.push(url);
    if (options.osrmDelayMs) await new Promise((r) => setTimeout(r, options.osrmDelayMs));
    const a = answerRoute(url, options);
    route.fulfill({ status: a.status, contentType: "application/json", body: JSON.stringify(a.body), headers: { "access-control-allow-origin": "*" } });
  });
  await page.route(/^https:\/\/tile\.openstreetmap\.org\/(\d+)\/(\d+)\/(\d+)\.png/, (route) => {
    const [, , x, y] = route.request().url().match(/\/(\d+)\/(\d+)\/(\d+)\.png/).map(Number);
    route.fulfill({ status: 200, contentType: "image/png", body: (x + y) % 2 ? BEIGE : GREEN, headers: { "access-control-allow-origin": "*" } });
  });
  await page.goto(APP_URL);
  return { browser, page, log, close: () => browser.close() };
}
