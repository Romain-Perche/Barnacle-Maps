// Unit / contract tests for src/view.js (contracts/start-view.md §Required test cases).
// covers FR-003, FR-004, FR-019, US1 scenarios 1 and 2
import test from "node:test";
import assert from "node:assert/strict";
import { createStartView } from "../src/view.js";

const DEFAULT = { lat: 48.8566, lng: 2.3522, zoom: 13 };
const BAD = [NaN, undefined, Infinity, -Infinity, null, "13"];
const OUT_OF_RANGE = [
  ["lat", 90.1], ["lat", -90.1],
  ["lng", 180.1], ["lng", -180.1],
  ["zoom", -1], ["zoom", 20],
];

// Case 1 - covers FR-003 (default starting view), US1 scenario 1
test("view: a new StartView reports the default view and is not settled", () => {
  const sv = createStartView(DEFAULT);
  assert.deepEqual(sv.current, DEFAULT);
  assert.equal(sv.settled, false);
});

// Case 2 - covers FR-003 (first location fix at zoom 15), US1 scenario 2
test("view: the first settle stores the location view and returns true", () => {
  const sv = createStartView(DEFAULT);
  assert.equal(sv.settle(48.9, 2.3, 15), true);
  assert.deepEqual(sv.current, { lat: 48.9, lng: 2.3, zoom: 15 });
  assert.equal(sv.settled, true);
});

// Case 3 - covers FR-004 (later position updates never change the starting view)
test("view: a second settle returns false and keeps the first location", () => {
  const sv = createStartView(DEFAULT);
  sv.settle(48.9, 2.3, 15);
  assert.equal(sv.settle(10, 20, 12), false);
  assert.equal(sv.settle(48.9, 2.3, 15), false);
  assert.deepEqual(sv.current, { lat: 48.9, lng: 2.3, zoom: 15 });
  assert.equal(sv.settled, true);
});

// Case 4 - covers FR-004 (callers can't change the stored view)
test("view: current returns a fresh copy every time", () => {
  const sv = createStartView(DEFAULT);
  const a = sv.current;
  a.lat = 0; a.lng = 0; a.zoom = 1;
  assert.deepEqual(sv.current, DEFAULT);
  assert.notEqual(sv.current, sv.current);
  sv.settle(48.9, 2.3, 15);
  const b = sv.current;
  b.zoom = 3;
  assert.deepEqual(sv.current, { lat: 48.9, lng: 2.3, zoom: 15 });
});

// Case 5 - covers FR-019 (non-finite values rejected)
test("view: non-finite values throw TypeError in createStartView", () => {
  for (const key of ["lat", "lng", "zoom"]) {
    for (const v of BAD) {
      assert.throws(() => createStartView({ ...DEFAULT, [key]: v }), TypeError, `${key}=${String(v)}`);
    }
  }
  assert.throws(() => createStartView(undefined), TypeError);
});

test("view: non-finite values throw TypeError in settle and leave it unsettled", () => {
  const sv = createStartView(DEFAULT);
  for (const [i, key] of ["lat", "lng", "zoom"].entries()) {
    for (const v of BAD) {
      const args = [48.9, 2.3, 15];
      args[i] = v;
      assert.throws(() => sv.settle(...args), TypeError, `${key}=${String(v)}`);
      assert.equal(sv.settled, false);
      assert.deepEqual(sv.current, DEFAULT);
    }
  }
  // A valid settle still works after the rejected ones.
  assert.equal(sv.settle(48.9, 2.3, 15), true);
});

// Case 6 - covers FR-019 (out-of-range values rejected, bounds accepted)
test("view: out-of-range values throw TypeError in createStartView", () => {
  for (const [key, v] of OUT_OF_RANGE) {
    assert.throws(() => createStartView({ ...DEFAULT, [key]: v }), TypeError, `${key}=${v}`);
  }
});

test("view: out-of-range values throw TypeError in settle and leave the state unchanged", () => {
  const idx = { lat: 0, lng: 1, zoom: 2 };
  const fresh = createStartView(DEFAULT);
  const settled = createStartView(DEFAULT);
  settled.settle(48.9, 2.3, 15);
  for (const [key, v] of OUT_OF_RANGE) {
    const args = [48.9, 2.3, 15];
    args[idx[key]] = v;
    assert.throws(() => fresh.settle(...args), TypeError, `${key}=${v}`);
    assert.equal(fresh.settled, false);
    assert.deepEqual(fresh.current, DEFAULT);
    assert.throws(() => settled.settle(...args), TypeError, `${key}=${v} (settled)`);
    assert.equal(settled.settled, true);
    assert.deepEqual(settled.current, { lat: 48.9, lng: 2.3, zoom: 15 });
  }
});

test("view: the bounds themselves are accepted", () => {
  for (const v of [
    { lat: 90, lng: 180, zoom: 19 },
    { lat: -90, lng: -180, zoom: 0 },
  ]) {
    assert.deepEqual(createStartView(v).current, v);
    const sv = createStartView(DEFAULT);
    assert.equal(sv.settle(v.lat, v.lng, v.zoom), true);
    assert.deepEqual(sv.current, v);
  }
});
