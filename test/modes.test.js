import test from "node:test";
import assert from "node:assert/strict";
import { routeUrl, TRAVEL_MODES } from "../src/geo.js";

const from = { lat: 48.85, lng: 2.35 };
const to = { lat: 48.86, lng: 2.36 };
const COORDS = "2.35,48.85;2.36,48.86";
const FOOT = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${COORDS}?overview=full&geometries=geojson`;
const BIKE = `https://routing.openstreetmap.de/routed-bike/route/v1/bike/${COORDS}?overview=full&geometries=geojson`;
const CAR = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${COORDS}?overview=full&geometries=geojson`;

// covers FR-001, FR-002, FR-010, contracts/travel-modes.md (TRAVEL_MODES)
test("TRAVEL_MODES offers walking, car and bike", () => {
  assert.deepEqual(Object.keys(TRAVEL_MODES).sort(), ["bike", "car", "foot"]);
  for (const key of ["foot", "car", "bike"]) {
    const m = TRAVEL_MODES[key];
    for (const field of ["label", "base", "profile", "adjective", "by"]) {
      assert.equal(typeof m[field], "string", `${key}.${field}`);
      assert.ok(m[field].length > 0, `${key}.${field} is empty`);
    }
  }
  assert.equal(TRAVEL_MODES.foot.base, "https://routing.openstreetmap.de/routed-foot");
  assert.equal(TRAVEL_MODES.foot.profile, "foot");
  assert.equal(TRAVEL_MODES.car.base, "https://routing.openstreetmap.de/routed-car");
  assert.equal(TRAVEL_MODES.car.profile, "driving");
  assert.deepEqual(TRAVEL_MODES.bike, {
    label: "Bike",
    base: "https://routing.openstreetmap.de/routed-bike",
    profile: "bike",
    adjective: "cycling",
    by: "by bike",
  });
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

// covers FR-002, FR-004, US1 scenario 1, contracts/travel-modes.md (routeUrl bike)
test("routeUrl bike mode uses the OSRM bicycle server and bike profile", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "bike" }), BIKE);
});

// covers FR-003, US1 scenario 1, contracts/travel-modes.md (routeUrl bike, alternatives)
test("routeUrl bike mode with alternatives", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "bike", alternatives: 3 }), `${BIKE}&alternatives=3`);
});

// covers FR-002, US2 scenario 1, contracts/travel-modes.md (routeUrl bike, stops in order)
test("routeUrl bike mode visits the stops in order", () => {
  const s1 = { lat: 48.852, lng: 2.352 };
  const s2 = { lat: 48.855, lng: 2.355 };
  assert.equal(
    routeUrl(from, to, undefined, { mode: "bike", stops: [s1, s2] }),
    "https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.352,48.852;2.355,48.855;2.36,48.86?overview=full&geometries=geojson",
  );
});

// covers contracts/travel-modes.md (routeUrl bike, explicit base)
test("routeUrl bike mode with an explicit base keeps the base and uses the bike profile", () => {
  assert.equal(
    routeUrl(from, to, "https://example.test", { mode: "bike" }),
    `https://example.test/route/v1/bike/${COORDS}?overview=full&geometries=geojson`,
  );
});

// covers FR-006, FR-010, US1 scenario 1 and 5, contracts/ui.md (status texts per mode).
// app.js builds the texts as "Computing {adjective} routes…", "No {adjective} route found.",
// "{summary} {by}" and "{N} {adjective} routes · fastest …" (research.md R3).
test("TRAVEL_MODES wording gives the status texts of every mode", () => {
  const expected = {
    foot: ["Computing walking routes…", "No walking route found.", "on foot", "2 walking routes"],
    car: ["Computing driving routes…", "No driving route found.", "by car", "2 driving routes"],
    bike: ["Computing cycling routes…", "No cycling route found.", "by bike", "2 cycling routes"],
  };
  for (const [key, [computing, noRoute, by, several]] of Object.entries(expected)) {
    const m = TRAVEL_MODES[key];
    assert.equal(`Computing ${m.adjective} routes…`, computing, key);
    assert.equal(`No ${m.adjective} route found.`, noRoute, key);
    assert.equal(m.by, by, key);
    assert.equal(`2 ${m.adjective} routes`, several, key);
  }
});
