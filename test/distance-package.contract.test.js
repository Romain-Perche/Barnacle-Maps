// Contract tests for the distance-formatting package wiring (US2):
// package.json pin, index.html import map, README, and the package actually driving formatDistance.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const pkg = JSON.parse(read("package.json"));
const html = read("index.html");

// covers FR-005, SC-003, US2 scenario 1: exactly one runtime dependency, exact pin
test("package.json declares exactly one dependency: convert at an exact version (FR-005, SC-003, US2 scenario 1)", () => {
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}), ["convert"]);
  assert.match(pkg.dependencies.convert, /^\d+\.\d+\.\d+$/, "exact version, no range");
  assert.equal(pkg.dependencies.convert, "8.0.2");
});

// covers SC-003, US2 scenario 2: no build step, same start command
test("npm scripts unchanged: no build step (SC-003, US2 scenario 2)", () => {
  assert.equal(pkg.scripts.start, "python3 -m http.server 8000");
  assert.equal(pkg.scripts.test, "node --test test/");
  assert.equal(pkg.scripts.build, undefined);
});

// covers FR-006, US2 scenario 2: browser loads the same pinned version from unpkg via an import map before the app module
test("index.html import map maps convert to unpkg at the package.json version, before app.js (FR-006, US2 scenario 2)", () => {
  const m = html.match(/<script type="importmap">([\s\S]*?)<\/script>/);
  assert.ok(m, "an import map script is present");
  const map = JSON.parse(m[1]);
  const version = pkg.dependencies?.convert;
  assert.equal(map.imports?.convert, `https://unpkg.com/convert@${version}/dist/index.js`);
  assert.ok(html.indexOf('type="importmap"') < html.indexOf('src="src/app.js"'), "import map comes before the app module");
  assert.doesNotMatch(m[0], /integrity/, "no integrity hash (same trust model as Leaflet)");
  assert.match(html, /unpkg\.com\/leaflet@1\.9\.4\/dist\/leaflet\.js/, "Leaflet script unchanged");
});

// covers FR-005, US2 scenario 3: the package is installed for tests and drives formatDistance
test("convert resolves in Node and formatDistance uses it (FR-005, US2 scenario 3)", async () => {
  const { convert } = await import("convert");
  assert.deepEqual(
    { ...convert(1500, "m").to("best", "metric") },
    { quantity: 1.5, unit: "km" },
  );
  const geo = await import("../src/geo.js");
  await geo.distanceFormatReady;
  assert.equal(geo.formatDistance(1500), "1.5 km", "with the package loaded, km output comes from the package");
  assert.equal(geo.formatDistance(1500, null), "1500 m", "without it, the fallback shows whole metres");
});

// covers FR-010
test("README names convert, keeps 'no build step', and says npm install before npm test (FR-010)", () => {
  const readme = read("README.md");
  assert.doesNotMatch(readme, /No build step or dependencies/);
  assert.match(readme, /convert/);
  assert.match(readme, /no build step/i);
  assert.match(readme, /npm install[\s\S]*npm test/);
});
