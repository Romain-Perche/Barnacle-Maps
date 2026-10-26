import test from "node:test";
import assert from "node:assert/strict";
import {
  formatDistance,
  formatDuration,
  haversine,
  parseRoute,
  parseSearchResults,
  routeUrl,
  searchUrl,
} from "../src/geo.js";

test("haversine: Paris to London is about 344 km", () => {
  const d = haversine({ lat: 48.8566, lng: 2.3522 }, { lat: 51.5074, lng: -0.1278 });
  assert.ok(Math.abs(d - 343500) < 3000);
});

test("haversine: same point is zero", () => {
  assert.equal(haversine({ lat: 1, lng: 1 }, { lat: 1, lng: 1 }), 0);
});

test("formatDistance", () => {
  assert.equal(formatDistance(420.4), "420 m");
  assert.equal(formatDistance(1500), "1.50 km");
  assert.equal(formatDistance(12345), "12.3 km");
});

test("formatDuration", () => {
  assert.equal(formatDuration(10), "1 min");
  assert.equal(formatDuration(600), "10 min");
  assert.equal(formatDuration(3600), "1 h");
  assert.equal(formatDuration(5400), "1 h 30 min");
});

test("searchUrl encodes the query", () => {
  assert.match(searchUrl("rue de Rivoli"), /q=rue\+de\+Rivoli/);
});

test("parseSearchResults converts and filters", () => {
  const out = parseSearchResults([
    { display_name: "A", lat: "1.5", lon: "2.5" },
    { display_name: "bad", lat: "x", lon: "2" },
  ]);
  assert.deepEqual(out, [{ name: "A", lat: 1.5, lng: 2.5 }]);
  assert.deepEqual(parseSearchResults(null), []);
});

test("routeUrl uses lng,lat order and foot profile", () => {
  const url = routeUrl({ lat: 1, lng: 2 }, { lat: 3, lng: 4 });
  assert.match(url, /\/foot\/2,1;4,3\?/);
});

test("parseRoute flips coordinates to lat,lng", () => {
  const r = parseRoute({
    code: "Ok",
    routes: [{ distance: 100, duration: 70, geometry: { coordinates: [[2, 1], [4, 3]] } }],
  });
  assert.deepEqual(r, { distance: 100, duration: 70, path: [[1, 2], [3, 4]] });
  assert.equal(parseRoute({ code: "NoRoute" }), null);
});
