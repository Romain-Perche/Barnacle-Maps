// Unit / contract tests for the view helpers in src/geo.js
// (specs/pilot-22089-add-a-reset-view-button/contracts/view-helpers.md).
// Namespace import so each test fails on its own while the exports are missing.
import test from "node:test";
import assert from "node:assert/strict";
import * as geo from "../src/geo.js";

// covers FR-003 (default area is central Paris at zoom 13), US1 scenario 5
test("view-helpers contract: DEFAULT_VIEW is central Paris at zoom 13", () => {
  assert.deepEqual(geo.DEFAULT_VIEW, { lat: 48.8566, lng: 2.3522, zoom: 13 });
});

// covers FR-003 (first location fix shown at zoom 15), US1 scenario 4
test("view-helpers contract: LOCATED_ZOOM is 15", () => {
  assert.equal(geo.LOCATED_ZOOM, 15);
});

// covers FR-003, US1 scenario 4
test("view-helpers contract: locatedView builds the located starting view", () => {
  assert.equal(typeof geo.locatedView, "function");
  assert.deepEqual(geo.locatedView({ lat: 48.86, lng: 2.34 }), { lat: 48.86, lng: 2.34, zoom: 15 });
});

// covers FR-004 (later position updates must not move the recorded starting view)
test("view-helpers contract: locatedView returns a new object unaffected by later input changes", () => {
  assert.equal(typeof geo.locatedView, "function");
  const pos = { lat: 52.52, lng: 13.405 };
  const view = geo.locatedView(pos);
  assert.notEqual(view, pos);
  pos.lat = 35.68;
  pos.lng = 139.69;
  assert.deepEqual(view, { lat: 52.52, lng: 13.405, zoom: 15 });
});

// covers contracts/view-helpers.md "Copies only lat and lng"
test("view-helpers contract: locatedView ignores extra input fields", () => {
  assert.equal(typeof geo.locatedView, "function");
  const view = geo.locatedView({ lat: 1, lng: 2, accuracy: 30, zoom: 3 });
  assert.deepEqual(Object.keys(view).sort(), ["lat", "lng", "zoom"]);
  assert.deepEqual(view, { lat: 1, lng: 2, zoom: 15 });
});

// covers data-model.md View rules: lat −90..90, lng −180..180, integer zoom 0..19
test("view-helpers contract: DEFAULT_VIEW and LOCATED_ZOOM respect the View field rules", () => {
  const v = geo.DEFAULT_VIEW;
  assert.ok(v, "DEFAULT_VIEW is exported");
  assert.ok(Number.isFinite(v.lat) && v.lat >= -90 && v.lat <= 90);
  assert.ok(Number.isFinite(v.lng) && v.lng >= -180 && v.lng <= 180);
  for (const z of [v.zoom, geo.LOCATED_ZOOM]) assert.ok(Number.isInteger(z) && z >= 0 && z <= 19, `zoom ${z}`);
});
