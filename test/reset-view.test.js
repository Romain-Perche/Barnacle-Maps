// Tests for the "Reset view" button (specs/pilot-20861-add-a-reset-view-button).
// app.js is loaded with a fake DOM / Leaflet (test/helpers/app-harness.js). The control must be built
// with DOM APIs (L.DomUtil.create or document.createElement), not an innerHTML string.
import test from "node:test";
import assert from "node:assert/strict";
import { loadApp } from "./helpers/app-harness.js";

const PARIS = [48.8566, 2.3522];
const settle = () => new Promise((r) => setTimeout(r, 0));

function pressReset(app) {
  const b = app.resetButton();
  assert.ok(b, "a Reset view button must be added to the map");
  b.click();
}

test("contract: control is top-right with a native button named 'Reset view' (covers FR-001, FR-006, FR-007, FR-008)", async () => {
  const app = await loadApp();
  const c = app.resetControl();
  assert.ok(c, "a Leaflet control containing a <button> must be added");
  assert.equal(c.position, "topright");
  assert.match(c.container.className, /leaflet-bar/);
  const b = app.resetButton();
  assert.equal(b.getAttribute("type") ?? b.type, "button");
  assert.equal(b.getAttribute("aria-label"), "Reset view");
  assert.equal(b.getAttribute("title"), "Reset view");
});

test("contract: control events do not reach the map (covers ui-contract Events)", async () => {
  const app = await loadApp();
  const c = app.resetControl();
  assert.ok(c);
  const b = app.resetButton();
  assert.ok(app.stopped.includes(c.container) || app.stopped.includes(b), "disableClickPropagation must be applied to the control");
});

test("contract: control is always visible and enabled (covers FR-001, FR-008)", async () => {
  const app = await loadApp();
  const b = app.resetButton();
  assert.ok(b);
  assert.notEqual(b.disabled, true);
  assert.equal(b.getAttribute("disabled"), null);
  assert.notEqual(b.style.display, "none");
  assert.equal(b.getAttribute("tabindex"), null, "must stay in the natural tab order (US2 scenario 1)");
});

test("US1 scenario 2 / FR-003: no position yet -> reset goes to Paris zoom 13", async () => {
  const app = await loadApp();
  app.calls.length = 0;
  pressReset(app);
  assert.deepEqual(app.lastSetView(), [PARIS, 13]);
});

test("US1 scenario 2: location denied/unavailable -> reset goes to default view", async () => {
  const app = await loadApp({ geolocation: false });
  pressReset(app);
  assert.deepEqual(app.lastSetView(), [PARIS, 13]);
});

test("US1 scenario 1 / FR-003, FR-009: after first fix, reset goes to that position at zoom 15", async () => {
  const app = await loadApp();
  app.firstFix(10, 20, 5000); // accuracy is irrelevant
  app.calls.length = 0;
  pressReset(app);
  assert.deepEqual(app.lastSetView(), [[10, 20], 15]);
});

test("FR-004: later position updates do not move the starting view", async () => {
  const app = await loadApp();
  app.firstFix(10, 20);
  app.firstFix(11, 21);
  app.firstFix(12, 22);
  pressReset(app);
  assert.deepEqual(app.lastSetView(), [[10, 20], 15]);
});

test("edge case: late permission after the user moved the map -> reset goes to the first fix", async () => {
  const app = await loadApp();
  pressReset(app); // user interacts before any fix
  app.calls.push({ fn: "setView", args: [[0, 0], 5] }); // simulated user move
  app.firstFix(33, 44);
  app.calls.length = 0;
  pressReset(app);
  assert.deepEqual(app.lastSetView(), [[33, 44], 15]);
});

test("FR-009: selecting a search result never changes the starting view", async () => {
  const fetchImpl = async () => ({ ok: true, json: async () => [{ display_name: "Lyon", lat: "45.76", lon: "4.83" }] });
  const app = await loadApp({ fetchImpl });
  app.elements["search-input"].value = "Lyon";
  app.elements["search-form"].dispatch("submit");
  await settle();
  const li = app.elements["results"].children[0];
  assert.ok(li, "search results must render");
  li.children[0].click(); // no position yet: the app recenters on the place
  await settle();
  assert.ok(app.setViews().some(([c]) => c[0] === 45.76), "selecting a result recenters the map on it");
  pressReset(app);
  assert.deepEqual(app.lastSetView(), [PARIS, 13]);
});

test("FR-002 / FR-005: pressing reset only calls map.setView; no requests, no status change", async () => {
  const app = await loadApp();
  app.firstFix(10, 20);
  app.elements["status"].textContent = "hello";
  app.calls.length = 0;
  const fetchesBefore = app.fetches.length;
  pressReset(app);
  assert.deepEqual(app.calls.map((c) => c.fn), ["setView"]);
  assert.equal(app.fetches.length, fetchesBefore);
  assert.equal(app.elements["status"].textContent, "hello");
  assert.equal(app.elements["search-input"].value, "");
});

test("US1 scenario 4 / SC-001: repeated presses always end at the starting view without errors", async () => {
  const app = await loadApp();
  app.firstFix(10, 20);
  for (let i = 0; i < 5; i++) pressReset(app);
  assert.deepEqual(app.setViews().slice(-5), Array(5).fill([[10, 20], 15]));
});
