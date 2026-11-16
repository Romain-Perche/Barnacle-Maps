// Contract tests for phoneRouteUrl (contracts/phone-link.md §1) and TRAVEL_MODES[*].osmEngine.
// PILOT-28672: QR code of the selected route.
import test from "node:test";
import assert from "node:assert/strict";
import * as geo from "../src/geo.js";

const OSM = "https://www.openstreetmap.org/directions";
const start = { lat: 48.8566, lng: 2.3522 };
const dest = { lat: 48.860611, lng: 2.337644 };
const ROUTE = "route=48.85660%2C2.35220%3B48.86061%2C2.33764";

// covers FR-002: each travel mode maps to the OSM engine of the same OSRM service the app uses.
test("TRAVEL_MODES carry the OSM directions engine", () => {
  assert.equal(geo.TRAVEL_MODES.foot.osmEngine, "fossgis_osrm_foot");
  assert.equal(geo.TRAVEL_MODES.car.osmEngine, "fossgis_osrm_car");
});

// covers FR-002, FR-003, FR-011, US1 scenario 1 (walking: start, destination and mode in the link).
test("phoneRouteUrl builds the walking OSM directions link", () => {
  assert.equal(geo.phoneRouteUrl(start, dest, "foot"), `${OSM}?engine=fossgis_osrm_foot&${ROUTE}`);
});

// covers FR-002, FR-003, US1 scenario 2 (same mode on the phone): car mode.
test("phoneRouteUrl builds the car OSM directions link", () => {
  assert.equal(geo.phoneRouteUrl(start, dest, "car"), `${OSM}?engine=fossgis_osrm_car&${ROUTE}`);
});

// covers FR-002: an unknown or missing mode falls back to walking, like routeUrl.
test("phoneRouteUrl falls back to walking for an unknown or missing mode", () => {
  const foot = `${OSM}?engine=fossgis_osrm_foot&${ROUTE}`;
  assert.equal(geo.phoneRouteUrl(start, dest, "bike"), foot);
  assert.equal(geo.phoneRouteUrl(start, dest), foot);
});

// covers FR-003, FR-004: lat,lng order, exactly 5 decimals, negative coordinates kept.
test("phoneRouteUrl writes lat,lng with 5 decimals, negatives included", () => {
  const url = geo.phoneRouteUrl({ lat: -33.8688, lng: 151.2093 }, { lat: -33.85, lng: 151.2 }, "foot");
  assert.ok(url.endsWith("&route=-33.86880%2C151.20930%3B-33.85000%2C151.20000"), url);
});

// covers FR-004 (about 1 m): the decoded link gives back the positions within 0.000005 degrees.
test("phoneRouteUrl keeps the positions precise to about 1 m", () => {
  const a = { lat: 51.5007292, lng: -0.1246254 };
  const b = { lat: 51.5194133, lng: -0.1269566 };
  const route = new URL(geo.phoneRouteUrl(a, b, "car")).searchParams.get("route");
  const [p, q] = route.split(";").map((s) => s.split(",").map(Number));
  for (const [got, want] of [
    [p[0], a.lat],
    [p[1], a.lng],
    [q[0], b.lat],
    [q[1], b.lng],
  ]) {
    assert.ok(Math.abs(got - want) <= 0.000005, `${got} vs ${want}`);
  }
});

// covers FR-005 (no route to share), edge case "no destination or position not known": no link.
test("phoneRouteUrl returns null without a valid start or destination", () => {
  assert.equal(geo.phoneRouteUrl(null, dest, "foot"), null);
  assert.equal(geo.phoneRouteUrl(start, undefined, "foot"), null);
  assert.equal(geo.phoneRouteUrl({ lat: NaN, lng: 2 }, dest, "foot"), null);
  assert.equal(geo.phoneRouteUrl(start, { lat: 48.86, lng: Infinity }, "car"), null);
});

// covers FR-002, edge case "journey with stops": the link carries only start and destination.
test("phoneRouteUrl has only the engine and the two route points", () => {
  const u = new URL(geo.phoneRouteUrl(start, dest, "foot"));
  assert.equal(u.origin + u.pathname, OSM);
  assert.deepEqual([...u.searchParams.keys()], ["engine", "route"]);
  assert.equal(u.searchParams.get("route").split(";").length, 2);
});
