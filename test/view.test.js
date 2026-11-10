import test from "node:test";
import assert from "node:assert/strict";
import { createStartView } from "../src/view.js";

const DEFAULT = { lat: 48.8566, lng: 2.3522, zoom: 13 };
const FIX = { lat: 51.5, lng: -0.12, zoom: 15 };

// covers FR-004, FR-010, US1 scenario 1 (location unavailable -> default view)
test("get() returns the default view before any location fix", () => {
  const v = createStartView(DEFAULT);
  assert.deepEqual(v.get(), { lat: 48.8566, lng: 2.3522, zoom: 13 });
});

// covers FR-010, FR-004, US1 scenario 4
test("first settle() replaces the view and returns true", () => {
  const v = createStartView(DEFAULT);
  assert.equal(v.settle(FIX), true);
  assert.deepEqual(v.get(), FIX);
});

// covers FR-005, FR-010, US1 scenario 4 (later fixes never change it)
test("later settle() calls are ignored and return false", () => {
  const v = createStartView(DEFAULT);
  v.settle(FIX);
  assert.equal(v.settle({ lat: 1, lng: 2, zoom: 15 }), false);
  assert.deepEqual(v.get(), FIX);
});

// covers FR-005, US1 scenario 2 (repeated reads/presses are harmless)
test("repeated get() calls return equal values without changing state", () => {
  const v = createStartView(DEFAULT);
  assert.deepEqual(v.get(), v.get());
  assert.deepEqual(v.get(), DEFAULT);
});

// covers FR-005 (contract: get() returns a copy)
test("mutating the object returned by get() does not alter the start view", () => {
  const v = createStartView(DEFAULT);
  const copy = v.get();
  copy.lat = 0;
  copy.zoom = 1;
  assert.deepEqual(v.get(), DEFAULT);
  assert.notEqual(v.get(), v.get());
});

// covers FR-005 (the caller's default and settle objects are not aliased)
test("the default and settled inputs are copied, not aliased", () => {
  const def = { ...DEFAULT };
  const fix = { ...FIX };
  const v = createStartView(def);
  def.lat = 0;
  assert.equal(v.get().lat, DEFAULT.lat);
  v.settle(fix);
  fix.lat = 0;
  assert.equal(v.get().lat, FIX.lat);
});

// covers FR-010, data-model (session only: each instance starts fresh)
test("a new instance starts from the default again (not persisted)", () => {
  createStartView(DEFAULT).settle(FIX);
  assert.deepEqual(createStartView(DEFAULT).get(), DEFAULT);
});

// covers FR-010 (accuracy of the first fix is not filtered: any numbers are accepted)
test("the first settle() accepts the fix as given", () => {
  const v = createStartView(DEFAULT);
  assert.equal(v.settle({ lat: 0, lng: 0, zoom: 15 }), true);
  assert.deepEqual(v.get(), { lat: 0, lng: 0, zoom: 15 });
});
