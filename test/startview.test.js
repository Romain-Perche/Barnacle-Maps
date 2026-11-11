// Contract + unit tests for createStartView (src/geo.js).
// Contract: specs/pilot-7912-add-a-reset-view-button/contracts/start-view-helper.md
import test from "node:test";
import assert from "node:assert/strict";
import { createStartView } from "../src/geo.js";

const DEFAULT_VIEW = { lat: 48.8566, lng: 2.3522, zoom: 13 };
const FIRST_FIX = { lat: 45.764, lng: 4.8357, zoom: 15 };
const LATER_FIX = { lat: 43.2965, lng: 5.3698, zoom: 15 };

// covers contract case 1, FR-003, US1 scenario 5 (no location → default view)
test("createStartView: get() returns the default view right after creation", () => {
  const sv = createStartView(DEFAULT_VIEW);
  assert.deepEqual(sv.get(), { lat: 48.8566, lng: 2.3522, zoom: 13 });
});

// covers contract case 2, FR-003, US1 scenario 4 (first fix becomes the starting view)
test("createStartView: first setOnce(v) returns true and get() returns v", () => {
  const sv = createStartView(DEFAULT_VIEW);
  assert.equal(sv.setOnce(FIRST_FIX), true);
  assert.deepEqual(sv.get(), FIRST_FIX);
});

// covers contract case 3, FR-004, Edge case "location found again later"
test("createStartView: later setOnce(w) returns false and keeps the first view", () => {
  const sv = createStartView(DEFAULT_VIEW);
  sv.setOnce(FIRST_FIX);
  assert.equal(sv.setOnce(LATER_FIX), false);
  assert.equal(sv.setOnce({ ...FIRST_FIX, zoom: 3 }), false);
  assert.deepEqual(sv.get(), FIRST_FIX);
});

// covers contract case 4, FR-004 (stored view cannot be changed from outside)
test("createStartView: mutating get() result or the arguments does not change the stored view", () => {
  const def = { ...DEFAULT_VIEW };
  const sv = createStartView(def);
  def.lat = 0;
  def.zoom = 2;
  assert.deepEqual(sv.get(), DEFAULT_VIEW);

  const got = sv.get();
  got.lng = 99;
  got.zoom = 1;
  assert.deepEqual(sv.get(), DEFAULT_VIEW);
  assert.notEqual(sv.get(), sv.get(), "get() returns a new object each call");

  const fix = { ...FIRST_FIX };
  sv.setOnce(fix);
  fix.lat = 1;
  fix.zoom = 4;
  assert.deepEqual(sv.get(), FIRST_FIX);
});

// covers contract case 5, FR-003 (an invalid fix must not use up the one-time set)
test("createStartView: invalid setOnce returns false and does not lock the holder", () => {
  const sv = createStartView(DEFAULT_VIEW);
  const invalid = [
    undefined,
    null,
    { lat: NaN, lng: 2, zoom: 15 },
    { lat: 1, lng: Infinity, zoom: 15 },
    { lat: 1, lng: 2 },
    { lat: "1", lng: 2, zoom: 15 },
  ];
  for (const v of invalid) {
    assert.equal(sv.setOnce(v), false, `setOnce(${JSON.stringify(v)})`);
    assert.deepEqual(sv.get(), DEFAULT_VIEW);
  }
  assert.equal(sv.setOnce(FIRST_FIX), true);
  assert.deepEqual(sv.get(), FIRST_FIX);
});

// covers contract case 6
test("createStartView: invalid default view throws TypeError", () => {
  assert.throws(() => createStartView(), TypeError);
  assert.throws(() => createStartView(null), TypeError);
  assert.throws(() => createStartView({ lat: NaN, lng: 2, zoom: 13 }), TypeError);
  assert.throws(() => createStartView({ lat: 1, lng: 2 }), TypeError);
  assert.throws(() => createStartView({ lat: 1, lng: "2", zoom: 13 }), TypeError);
});

// covers contract case 7
test("createStartView: two holders do not share state", () => {
  const a = createStartView(DEFAULT_VIEW);
  const b = createStartView(DEFAULT_VIEW);
  a.setOnce(FIRST_FIX);
  assert.deepEqual(b.get(), DEFAULT_VIEW);
  assert.equal(b.setOnce(LATER_FIX), true);
  assert.deepEqual(a.get(), FIRST_FIX);
});

// covers FR-002, US1 scenarios 1, 2 and Edge case "presses several times quickly":
// reading the starting view repeatedly (once per press) always gives the same view.
test("createStartView: repeated get() calls return the same starting view", () => {
  const sv = createStartView(DEFAULT_VIEW);
  sv.setOnce(FIRST_FIX);
  for (let i = 0; i < 5; i++) assert.deepEqual(sv.get(), FIRST_FIX);
});
