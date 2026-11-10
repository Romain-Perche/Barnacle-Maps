// Contract tests for startingView() — specs/pilot-23968-add-a-reset-view-button/contracts/reset-view.md §1
// covers FR-002, FR-002a, US1 scenarios 3 and 4
import test from "node:test";
import assert from "node:assert/strict";
import * as geo from "../src/geo.js";

const DEFAULT_VIEW = Object.freeze({ lat: 48.8566, lng: 2.3522, zoom: 13 });
const LOCATE_ZOOM = 15;

function startingView(...args) {
  assert.equal(typeof geo.startingView, "function", "src/geo.js must export startingView()");
  return geo.startingView(...args);
}

test("startingView: first fix found → that location at the close zoom (FR-002, US1 scenario 3)", () => {
  assert.deepEqual(startingView({ lat: 45.76, lng: 4.84 }, DEFAULT_VIEW, LOCATE_ZOOM), {
    lat: 45.76,
    lng: 4.84,
    zoom: 15,
  });
});

test("startingView: no fix (null) → fixed default view, Paris zoom 13 (FR-002, US1 scenario 4)", () => {
  assert.deepEqual(startingView(null, DEFAULT_VIEW, LOCATE_ZOOM), { lat: 48.8566, lng: 2.3522, zoom: 13 });
});

test("startingView: no fix (undefined) → fixed default view (FR-002, US1 scenario 4)", () => {
  assert.deepEqual(startingView(undefined, DEFAULT_VIEW, LOCATE_ZOOM), { lat: 48.8566, lng: 2.3522, zoom: 13 });
});

test("startingView: non-finite or missing coordinates → fixed default view (contract §1 rule 2)", () => {
  for (const bad of [{ lat: NaN, lng: 4.84 }, { lat: 45.76, lng: Infinity }, { lat: 45.76 }, {}]) {
    assert.deepEqual(startingView(bad, DEFAULT_VIEW, LOCATE_ZOOM), { lat: 48.8566, lng: 2.3522, zoom: 13 }, JSON.stringify(bad));
  }
});

test("startingView: any first fix is used whatever its accuracy; only lat, lng, zoom are returned (CHK029)", () => {
  const fix = { lat: 45.76, lng: 4.84, accuracy: 5000 };
  const view = startingView(fix, DEFAULT_VIEW, LOCATE_ZOOM);
  assert.deepEqual(view, { lat: 45.76, lng: 4.84, zoom: 15 });
  assert.deepEqual(Object.keys(view).sort(), ["lat", "lng", "zoom"]);
});

test("startingView: returns a new object and never mutates its inputs (contract §1 rule 3)", () => {
  const fix = Object.freeze({ lat: 45.76, lng: 4.84 });
  const located = startingView(fix, DEFAULT_VIEW, LOCATE_ZOOM);
  const fallback = startingView(null, DEFAULT_VIEW, LOCATE_ZOOM);
  assert.notStrictEqual(located, fix);
  assert.notStrictEqual(fallback, DEFAULT_VIEW);
  fallback.lat = 0; // changing the result must not change the default view
  assert.deepEqual(DEFAULT_VIEW, { lat: 48.8566, lng: 2.3522, zoom: 13 });
  assert.deepEqual(fix, { lat: 45.76, lng: 4.84 });
});
