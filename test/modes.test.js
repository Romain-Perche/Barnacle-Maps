import test from "node:test";
import assert from "node:assert/strict";
import { routeUrl, TRAVEL_MODES } from "../src/geo.js";

const from = { lat: 48.85, lng: 2.35 };
const to = { lat: 48.86, lng: 2.36 };
const COORDS = "2.35,48.85;2.36,48.86";
const FOOT = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${COORDS}?overview=full&geometries=geojson`;
const CAR = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${COORDS}?overview=full&geometries=geojson`;

test("TRAVEL_MODES offers walking and car", () => {
  assert.deepEqual(Object.keys(TRAVEL_MODES).sort(), ["car", "foot"]);
  for (const key of ["foot", "car"]) {
    const m = TRAVEL_MODES[key];
    assert.equal(typeof m.label, "string");
    assert.ok(m.label.length > 0);
  }
  assert.equal(TRAVEL_MODES.foot.base, "https://routing.openstreetmap.de/routed-foot");
  assert.equal(TRAVEL_MODES.foot.profile, "foot");
  assert.equal(TRAVEL_MODES.car.base, "https://routing.openstreetmap.de/routed-car");
  assert.equal(TRAVEL_MODES.car.profile, "driving");
});

test("routeUrl defaults to the walking server and profile", () => {
  assert.equal(routeUrl(from, to), FOOT);
  assert.equal(routeUrl(from, to, undefined, { mode: "foot" }), FOOT);
});

test("routeUrl car mode uses the OSRM car server and driving profile", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "car" }), CAR);
});

test("routeUrl car mode with alternatives", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "car", alternatives: 3 }), `${CAR}&alternatives=3`);
});

test("routeUrl car mode with a via waypoint", () => {
  const via = { lat: 48.855, lng: 2.37 };
  assert.equal(
    routeUrl(from, to, undefined, { mode: "car", via }),
    "https://routing.openstreetmap.de/routed-car/route/v1/driving/2.35,48.85;2.37,48.855;2.36,48.86?overview=full&geometries=geojson",
  );
});

test("routeUrl car mode with an explicit base keeps the base and uses the driving profile", () => {
  assert.equal(
    routeUrl(from, to, "https://example.test", { mode: "car" }),
    `https://example.test/route/v1/driving/${COORDS}?overview=full&geometries=geojson`,
  );
});

test("routeUrl unknown mode falls back to walking", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "spaceship" }), FOOT);
});
