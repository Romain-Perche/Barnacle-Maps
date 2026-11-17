// SF-73 bicycle mode: contract tests for TRAVEL_MODES (data-model.md) and routeUrl
// (contracts/travel-modes.md). Requests are also checked by the fake OSRM (OSRM HTTP docs).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { routeUrl, TRAVEL_MODES } from "../src/geo.js";
import { checkRouteUrl } from "./fakes/osrm.js";

const from = { lat: 48.85, lng: 2.35 };
const to = { lat: 48.86, lng: 2.36 };
const COORDS = "2.35,48.85;2.36,48.86";
const BIKE = `https://routing.openstreetmap.de/routed-bike/route/v1/bike/${COORDS}?overview=full&geometries=geojson`;

// data-model.md table, verbatim.
const EXPECTED = {
  foot: {
    label: "Walk", icon: "🚶", base: "https://routing.openstreetmap.de/routed-foot", profile: "foot",
    pleasure: true, detours: true, computing: "Computing walking routes…", noRoute: "No walking route found.",
    single: "on foot", plural: "walking",
  },
  car: {
    label: "Car", icon: "🚗", base: "https://routing.openstreetmap.de/routed-car", profile: "driving",
    pleasure: false, detours: false, computing: "Computing driving routes…", noRoute: "No driving route found.",
    single: "by car", plural: "driving",
  },
  bike: {
    label: "Bike", icon: "🚲", base: "https://routing.openstreetmap.de/routed-bike", profile: "bike",
    pleasure: true, detours: false, computing: "Computing cycling routes…", noRoute: "No cycling route found.",
    single: "by bike", plural: "cycling",
  },
};

// covers FR-001 (order Walk, Car, Bike), FR-002 (walk first/default)
test("TRAVEL_MODES keys are foot, car, bike in that order", () => {
  assert.deepEqual(Object.keys(TRAVEL_MODES), ["foot", "car", "bike"]);
});

// covers data-model.md: "Every entry has every field. Strings are non-empty."
test("every travel mode has the 10 data-model fields with the documented values", () => {
  for (const [key, want] of Object.entries(EXPECTED)) {
    const got = TRAVEL_MODES[key];
    assert.ok(got, key);
    for (const [field, value] of Object.entries(want)) {
      assert.equal(got[field], value, `${key}.${field}`);
      if (typeof value === "string") assert.ok(got[field].length > 0);
    }
  }
});

// covers FR-008 (pleasure walk + bike, not car), FR-009 (detours walk only)
test("pleasure is false only for car; detours is true only for foot", () => {
  assert.deepEqual(Object.keys(TRAVEL_MODES).filter((k) => !TRAVEL_MODES[k].pleasure), ["car"]);
  assert.deepEqual(Object.keys(TRAVEL_MODES).filter((k) => TRAVEL_MODES[k].detours), ["foot"]);
});

// covers FR-005, US1 scenario 4/5 (cycling texts)
test("bike texts refer to cycling", () => {
  const b = TRAVEL_MODES.bike;
  assert.equal(b.computing, "Computing cycling routes…");
  assert.equal(b.noRoute, "No cycling route found.");
  assert.equal(b.single, "by bike");
  assert.equal(b.plural, "cycling");
});

// covers FR-003 (cycling routing), contract row 1
test("routeUrl bike mode uses the OSRM bike server and bike profile", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "bike" }), BIKE);
});

// covers FR-004 (up to 3 routes), contract row 2
test("routeUrl bike mode with alternatives", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "bike", alternatives: 3 }), `${BIKE}&alternatives=3`);
});

// covers FR-007, US3 scenario 1, contract row 3
test("routeUrl bike mode visits the stops in list order", () => {
  const s1 = { lat: 48.851, lng: 2.351 };
  const s2 = { lat: 48.852, lng: 2.352 };
  assert.equal(
    routeUrl(from, to, undefined, { mode: "bike", alternatives: 3, stops: [s1, s2] }),
    "https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.351,48.851;2.352,48.852;2.36,48.86?overview=full&geometries=geojson&alternatives=3",
  );
});

// contract row 4
test("routeUrl bike mode with an explicit base keeps the base and uses the bike profile", () => {
  assert.equal(
    routeUrl(from, to, "https://example.test", { mode: "bike" }),
    `https://example.test/route/v1/bike/${COORDS}?overview=full&geometries=geojson`,
  );
});

// covers FR-003: every bike request is one the real OSRM server accepts (fake checked against the docs)
test("bike requests are valid OSRM route requests on the bike server", () => {
  const stops = [{ lat: 48.851, lng: 2.351 }];
  for (const opts of [{}, { alternatives: 3 }, { alternatives: 3, stops }]) {
    const url = routeUrl(from, to, undefined, { mode: "bike", ...opts });
    assert.ok(url.startsWith("https://routing.openstreetmap.de/routed-bike/"), url);
    assert.equal(checkRouteUrl(url), null, url);
  }
});

// covers FR-010: README mentions the bicycle mode alongside walking and car
test("README mentions the bike mode and its OSRM server", () => {
  const r = readFileSync(new URL("../README.md", import.meta.url), "utf8");
  assert.match(r, /walking, bike and car/i);
  assert.ok(r.includes("routing.openstreetmap.de/routed-bike"));
});
