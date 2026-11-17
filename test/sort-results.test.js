import test from "node:test";
import assert from "node:assert/strict";
import * as geo from "../src/geo.js";

const PARIS = { lat: 48.8566, lng: 2.3522 };
const at = (name, lat, lng) => ({ name, lat, lng });

function box(url) {
  const raw = new URL(url).searchParams.get("viewbox");
  assert.ok(raw, "viewbox param expected");
  const [left, top, right, bottom] = raw.split(",").map(Number);
  return { left, top, right, bottom };
}

// covers FR-008, US1 scenario 4
test("searchUrl with a position adds a viewbox centred on it (lon,lat order)", () => {
  const b = box(geo.searchUrl("bakery", undefined, PARIS));
  assert.ok(Math.abs((b.left + b.right) / 2 - PARIS.lng) < 1e-3);
  assert.ok(Math.abs((b.top + b.bottom) / 2 - PARIS.lat) < 1e-3);
  assert.ok(b.top > b.bottom && b.right > b.left);
  assert.ok(Math.abs((b.top - b.bottom) / 2 - 0.25) < 1e-3); // NEAR_BOX_DEG
  const expectedLng = 0.25 / Math.cos((PARIS.lat * Math.PI) / 180);
  assert.ok(Math.abs((b.right - b.left) / 2 - expectedLng) < 1e-3);
});

// covers FR-008, US1 scenario 5 (far matches must stay possible)
test("searchUrl never restricts to the box and keeps limit 5", () => {
  const u = new URL(geo.searchUrl("bakery", undefined, PARIS));
  assert.notEqual(u.searchParams.get("bounded"), "1");
  assert.equal(u.searchParams.get("limit"), "5");
  assert.equal(u.searchParams.get("q"), "bakery");
});

// covers FR-009, US1 edge case (position unknown)
test("searchUrl without a position is identical to today's URL", () => {
  const today = "https://nominatim.openstreetmap.org/search?q=bakery&format=jsonv2&limit=5";
  assert.equal(geo.searchUrl("bakery"), today);
  assert.equal(geo.searchUrl("bakery", undefined, null), today);
});

// covers FR-008: box stays valid near the poles / date line
test("searchUrl viewbox is clamped to valid coordinates", () => {
  const b = box(geo.searchUrl("x", undefined, { lat: 89.9, lng: 179.9 }));
  assert.ok(b.top <= 90 && b.right <= 180 && b.left >= -180 && b.bottom >= -90);
});

// covers FR-001, SC-001, SC-002, US1 scenario 1, 2
test("sortByDistance lists nearest first with non-decreasing distances", () => {
  const far = at("Reims", 49.2583, 4.0317);
  const mid = at("Saint-Denis", 48.9362, 2.3574);
  const near = at("Vendome", 48.8675, 2.3294);
  const out = geo.sortByDistance([far, mid, near], PARIS);
  assert.deepEqual(out.map((r) => r.name), ["Vendome", "Saint-Denis", "Reims"]);
  for (let i = 1; i < out.length; i++) assert.ok(out[i].distance >= out[i - 1].distance);
  assert.ok(Math.abs(out[0].distance - geo.haversine(PARIS, near)) < 1e-6);
});

// covers FR-003, US1 scenario 3
test("sortByDistance keeps service order for equal distances", () => {
  const a = at("A", 48.9, 2.35);
  const b = at("B", 48.9, 2.35);
  const c = at("C", 48.86, 2.35);
  assert.deepEqual(geo.sortByDistance([a, b, c], PARIS).map((r) => r.name), ["C", "A", "B"]);
});

// covers FR-004, FR-006 (no distance without position), US2 scenario 2
test("sortByDistance without a position keeps order and adds no distance", () => {
  const list = [at("Far", 49.2, 4), at("Near", 48.86, 2.35)];
  for (const from of [null, undefined]) {
    const out = geo.sortByDistance(list, from);
    assert.deepEqual(out.map((r) => r.name), ["Far", "Near"]);
    assert.ok(out.every((r) => !("distance" in r)));
  }
});

// covers FR-007, FR-005 (results are not mutated or dropped)
test("sortByDistance returns a new array, same length, input untouched", () => {
  const list = [at("Far", 49.2, 4), at("Near", 48.86, 2.35)];
  const out = geo.sortByDistance(list, PARIS);
  assert.notEqual(out, list);
  assert.equal(out.length, 2);
  assert.equal(list[0].name, "Far");
  assert.ok(!("distance" in list[0]));
  assert.equal(out[0].lat, 48.86); // place coordinates kept for routing / stops
});
