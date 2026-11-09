import test from "node:test";
import assert from "node:assert/strict";
import {
  addStop,
  haversine,
  MAX_STOPS,
  mapPointStop,
  moveStop,
  removeStop,
  routeUrl,
  straightLineLength,
} from "../src/geo.js";

const from = { lat: 48.85, lng: 2.35 };
const to = { lat: 48.86, lng: 2.36 };
const s1 = { name: "Bakery", lat: 48.852, lng: 2.37 };
const s2 = { name: "Pharmacy", lat: 48.857, lng: 2.34 };
const s3 = { name: "Market", lat: 48.859, lng: 2.355 };
const FOOT = "https://routing.openstreetmap.de/routed-foot/route/v1/foot";
const CAR = "https://routing.openstreetmap.de/routed-car/route/v1/driving";
const Q = "?overview=full&geometries=geojson";

// FR-003, US1 scenario 1, US2 scenario 1: the route goes start -> stops in list order -> destination.
test("routeUrl passes through the stops in list order", () => {
  assert.equal(
    routeUrl(from, to, undefined, { stops: [s1, s2] }),
    `${FOOT}/2.35,48.85;2.37,48.852;2.34,48.857;2.36,48.86${Q}`,
  );
  assert.equal(
    routeUrl(from, to, undefined, { stops: [s2, s1], mode: "car", alternatives: 3 }),
    `${CAR}/2.35,48.85;2.34,48.857;2.37,48.852;2.36,48.86${Q}&alternatives=3`,
  );
});

// FR-014: an empty stop list gives exactly the URL of today.
test("routeUrl with no stops is unchanged", () => {
  assert.equal(routeUrl(from, to, undefined, { stops: [] }), routeUrl(from, to));
  assert.equal(
    routeUrl(from, to, undefined, { stops: [], mode: "car", alternatives: 3 }),
    routeUrl(from, to, undefined, { mode: "car", alternatives: 3 }),
  );
});

// FR-006: a new stop is appended at the end; the input list is not mutated.
test("addStop appends the stop at the end", () => {
  const before = [s1];
  const r = addStop(before, { name: "Pharmacy", lat: 48.857, lng: 2.34, extra: "ignored" });
  assert.equal(r.error, null);
  assert.deepEqual(r.stops, [s1, s2]);
  assert.deepEqual(before, [s1]);
});

// FR-002, FR-009, US2 scenario 3: at most 5 stops.
test("addStop refuses a stop beyond the maximum", () => {
  assert.equal(MAX_STOPS, 5);
  let stops = [];
  for (let i = 0; i < MAX_STOPS; i++) {
    const r = addStop(stops, { name: `S${i}`, lat: 48 + i * 0.01, lng: 2 });
    assert.equal(r.error, null);
    stops = r.stops;
  }
  assert.equal(stops.length, 5);
  const r = addStop(stops, { name: "Sixth", lat: 49, lng: 3 });
  assert.equal(r.error, "limit");
  assert.deepEqual(r.stops, stops);
});

// FR-009, edge case "same place added twice": a point within 20 m of an existing stop is refused.
test("addStop refuses a place already in the list (within 20 m)", () => {
  const close = { name: "Other name", lat: s1.lat + 0.0001, lng: s1.lng }; // about 11 m
  assert.ok(haversine(close, s1) < 20);
  const dup = addStop([s1, s2], close);
  assert.equal(dup.error, "duplicate");
  assert.deepEqual(dup.stops, [s1, s2]);

  const apart = { name: "Next door", lat: s1.lat + 0.0003, lng: s1.lng }; // about 33 m
  const ok = addStop([s1, s2], apart);
  assert.equal(ok.error, null);
  assert.deepEqual(ok.stops, [s1, s2, apart]);
});

// FR-008, US3 scenario 2: move a stop earlier or later; out-of-range moves change nothing.
test("moveStop moves a stop up or down without mutating the list", () => {
  const list = [s1, s2, s3];
  assert.deepEqual(moveStop(list, 2, -1), [s1, s3, s2]);
  assert.deepEqual(moveStop(list, 0, 1), [s2, s1, s3]);
  assert.deepEqual(moveStop(list, 0, -1), [s1, s2, s3]);
  assert.deepEqual(moveStop(list, 2, 1), [s1, s2, s3]);
  assert.deepEqual(list, [s1, s2, s3]);
});

// FR-007, US3 scenario 1: remove any stop.
test("removeStop removes the stop at the index without mutating the list", () => {
  const list = [s1, s2, s3];
  assert.deepEqual(removeStop(list, 1), [s1, s3]);
  assert.deepEqual(removeStop(list, 0), [s2, s3]);
  assert.deepEqual(removeStop(list, 5), [s1, s2, s3]);
  assert.deepEqual(list, [s1, s2, s3]);
});

// FR-001b: a stop added from the map is named "Point on map" followed by its coordinates.
test("mapPointStop names the stop after its coordinates", () => {
  assert.deepEqual(mapPointStop({ lat: 48.8566123, lng: 2.3522456 }), {
    name: "Point on map (48.85661, 2.35225)",
    lat: 48.8566123,
    lng: 2.3522456,
  });
});

// FR-012: the pleasure "long walk" rule uses the straight-line length of the whole journey.
test("straightLineLength sums the legs of the journey", () => {
  const a = { lat: 0, lng: 0 };
  const b = { lat: 0, lng: 0.01 };
  const c = { lat: 0.01, lng: 0.01 };
  const expected = haversine(a, b) + haversine(b, c);
  assert.ok(Math.abs(straightLineLength([a, b, c]) - expected) < 1e-6);
  assert.equal(straightLineLength([a]), 0);
  assert.equal(straightLineLength([]), 0);
});
