import test from "node:test";
import assert from "node:assert/strict";
import { routeUrl, TRAVEL_MODES } from "../src/geo.js";

const from = { lat: 48.85, lng: 2.35 };
const to = { lat: 48.86, lng: 2.36 };
const COORDS = "2.35,48.85;2.36,48.86";
const FOOT = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${COORDS}?overview=full&geometries=geojson`;
const BIKE = `https://routing.openstreetmap.de/routed-bike/route/v1/bike/${COORDS}?overview=full&geometries=geojson`;
const CAR = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${COORDS}?overview=full&geometries=geojson`;

// covers FR-001, FR-003, SC-005: three modes in UI order, walk and car unchanged.
test("TRAVEL_MODES offers walking, car and bike", () => {
  assert.deepEqual(Object.keys(TRAVEL_MODES), ["foot", "car", "bike"]);
  for (const key of ["foot", "car", "bike"]) {
    const m = TRAVEL_MODES[key];
    assert.equal(typeof m.label, "string");
    assert.ok(m.label.length > 0);
  }
  assert.equal(TRAVEL_MODES.foot.base, "https://routing.openstreetmap.de/routed-foot");
  assert.equal(TRAVEL_MODES.foot.profile, "foot");
  assert.equal(TRAVEL_MODES.car.base, "https://routing.openstreetmap.de/routed-car");
  assert.equal(TRAVEL_MODES.car.profile, "driving");
  // covers FR-003, FR-004, FR-007, FR-008, contracts/travel-modes.md
  assert.deepEqual(TRAVEL_MODES.bike, {
    label: "Bike",
    icon: "\u{1F6B2}",
    base: "https://routing.openstreetmap.de/routed-bike",
    profile: "bike",
    noun: "cycling",
    adverb: "by bike",
    pleasure: true,
    detours: false,
  });
});

// covers data-model.md, FR-008, FR-009: walk and car metadata drive wording, pleasure and detours.
test("TRAVEL_MODES foot and car carry their per-mode metadata", () => {
  assert.deepEqual(TRAVEL_MODES.foot, {
    label: "Walk",
    icon: "\u{1F6B6}",
    base: "https://routing.openstreetmap.de/routed-foot",
    profile: "foot",
    noun: "walking",
    adverb: "on foot",
    pleasure: true,
    detours: true,
  });
  assert.deepEqual(TRAVEL_MODES.car, {
    label: "Car",
    icon: "\u{1F697}",
    base: "https://routing.openstreetmap.de/routed-car",
    profile: "driving",
    noun: "driving",
    adverb: "by car",
    pleasure: false,
    detours: false,
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

// covers FR-003, US1 scenario 1, contracts/travel-modes.md
test("routeUrl bike mode uses the OSRM bike server and bike profile", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "bike" }), BIKE);
});

// covers FR-004, contracts/osrm-bike.md
test("routeUrl bike mode with alternatives", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "bike", alternatives: 3 }), `${BIKE}&alternatives=3`);
});

// covers contracts/travel-modes.md
test("routeUrl bike mode with an explicit base keeps the base and uses the bike profile", () => {
  assert.equal(
    routeUrl(from, to, "https://example.test", { mode: "bike" }),
    `https://example.test/route/v1/bike/${COORDS}?overview=full&geometries=geojson`,
  );
});
