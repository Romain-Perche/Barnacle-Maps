// Integration tests for the "Reset view" map control — contracts/reset-view.md §2.
// src/app.js is imported under a fake browser and a fake Leaflet (test/helpers/fake-browser.js),
// so these tests check the wiring: the control, the starting view, and that nothing else changes.
// Real layout, contrast, focus ring and keyboard/screen-reader behaviour are checked by the AI
// tests in tests/ai/.
import test from "node:test";
import assert from "node:assert/strict";
import { loadApp, findResetControl } from "./helpers/fake-browser.js";

const PARIS = { lat: 48.8566, lng: 2.3522, zoom: 13 };
const LYON = { lat: 45.764, lng: 4.8357 };
const EPS = 0.00001; // CHK021: "at the starting view" = same zoom, center within 0.00001°

function resetControl(app) {
  const found = findResetControl(app);
  assert.ok(found, 'a map control with a "Reset view" button must be added to the map');
  return found;
}

function press(app) {
  resetControl(app).button.click();
}

function assertAtView(call, view, msg = "") {
  assert.ok(call, `expected a map.setView call ${msg}`);
  const [center, zoom] = call;
  assert.equal(zoom, view.zoom, `zoom ${msg}`);
  assert.ok(Math.abs(center.lat - view.lat) <= EPS, `lat ${center.lat} vs ${view.lat} ${msg}`);
  assert.ok(Math.abs(center.lng - view.lng) <= EPS, `lng ${center.lng} vs ${view.lng} ${msg}`);
}

function lastMove(app) {
  // The last thing that moved the map (setView / flyTo / fitBounds ...).
  const moves = app.log.filter((e) => /^map\.(setView|flyTo|fitBounds|panTo|setZoom)$/.test(e.kind));
  return moves[moves.length - 1];
}

// --- FR-001, FR-005, FR-006: the control itself -------------------------------------------------

test("control: a native <button type=button> showing the text 'Reset view', tooltip 'Reset view' (FR-001, FR-005, CHK007)", async () => {
  const app = await loadApp();
  const { button } = resetControl(app);
  assert.equal(button.tagName, "BUTTON");
  assert.equal(button.type, "button");
  assert.equal(button.textContent.trim(), "Reset view", "visible text / accessible name");
  assert.equal(button.title, "Reset view", "tooltip");
  assert.equal(button.disabled, false, "never disabled (FR-001)");
  assert.equal(button.hidden, false, "never hidden (FR-001)");
  assert.equal(button.getAttribute("aria-hidden"), null);
});

test("control: no icon and no custom tabindex, so it stays in document tab order (FR-001, FR-004, CHK006)", async () => {
  const app = await loadApp();
  const { button, container } = resetControl(app);
  assert.equal(button.hasAttribute("tabindex"), false, "no custom tabindex");
  const nonText = button.children.filter((c) => c.tagName !== "#text");
  assert.deepEqual(nonText.map((c) => c.tagName), [], "button holds only the text, no icon element");
  assert.ok(container.classList.contains("reset-view"), "container has class reset-view (styles.css hook)");
});

test("control: placed in the bottom-right corner, above the attribution (FR-006, CHK008)", async () => {
  const app = await loadApp();
  assert.equal(resetControl(app).position, "bottomright");
});

test("control: click, double-click, wheel and drag do not reach the map (FR-003a, CHK024)", async () => {
  const app = await loadApp();
  const { container } = resetControl(app);
  assert.ok(app.domEvents.clickDisabled.includes(container), "L.DomEvent.disableClickPropagation(container)");
  assert.ok(app.domEvents.scrollDisabled.includes(container), "L.DomEvent.disableScrollPropagation(container)");
});

// --- US1: return the map to its starting view --------------------------------------------------

test("US1 scenario 4: location denied → Reset view goes to the fixed default view, Paris zoom 13 (FR-002)", async () => {
  const app = await loadApp({ geolocation: "denied" });
  app.map.setView([40, -3], 6); // the user pans and zooms away
  press(app);
  assertAtView(app.lastSetView(), PARIS, "after reset");
});

test("US1 scenario 4: geolocation unsupported → Reset view goes to the fixed default view (FR-002)", async () => {
  const app = await loadApp({ geolocation: "unsupported" });
  app.map.setView([40, -3], 6);
  press(app);
  assertAtView(app.lastSetView(), PARIS, "after reset");
});

test("US1 scenarios 1, 2, 3: location found → pan and zoom away, Reset view returns to the first fix at zoom 15 (FR-002)", async () => {
  const app = await loadApp();
  app.fix(LYON.lat, LYON.lng);
  for (const [center, zoom, label] of [
    [[LYON.lat + 0.2, LYON.lng - 0.3], 15, "panned"],
    [[LYON.lat, LYON.lng], 9, "zoomed"],
    [[51.5, -0.12], 11, "panned and zoomed"],
  ]) {
    app.map.setView(center, zoom);
    press(app);
    assertAtView(app.lastSetView(), { ...LYON, zoom: 15 }, `from ${label} (SC-001)`);
  }
});

test("FR-002a: later position updates do not change the starting view", async () => {
  const app = await loadApp();
  app.fix(LYON.lat, LYON.lng);
  app.fix(43.2965, 5.3698); // the person moves (Marseille)
  app.fix(43.3, 5.4);
  app.map.setView([10, 10], 5);
  press(app);
  assertAtView(app.lastSetView(), { ...LYON, zoom: 15 }, "first fix, not latest");
});

test("Edge case + FR-003b (CHK016): press before the first fix → default view; the fix still moves the map and becomes the target", async () => {
  const app = await loadApp();
  app.map.setView([10, 10], 5);
  press(app);
  assertAtView(app.lastSetView(), PARIS, "before any fix");
  app.fix(LYON.lat, LYON.lng);
  assertAtView(app.lastSetView(), { ...LYON, zoom: 15 }, "the first fix still re-centers the map (today's behaviour)");
  app.map.setView([10, 10], 5);
  press(app);
  assertAtView(app.lastSetView(), { ...LYON, zoom: 15 }, "the first fix is now the Reset view target");
});

test("Edge case (CHK023): location granted later in the session — its first fix counts", async () => {
  const app = await loadApp();
  press(app);
  assertAtView(app.lastSetView(), PARIS);
  app.fix(LYON.lat, LYON.lng); // arrives much later
  app.map.setView([0, 0], 3);
  press(app);
  assertAtView(app.lastSetView(), { ...LYON, zoom: 15 });
});

test("US1 scenario 5, FR-007: already at the starting view → same view, no error", async () => {
  const app = await loadApp({ geolocation: "denied" });
  assert.doesNotThrow(() => press(app));
  assert.doesNotThrow(() => press(app));
  const move = lastMove(app);
  assert.equal(move.kind, "map.setView");
  assertAtView(move.args, PARIS, "after pressing at the starting view");
});

test("Edge case (CHK027): five quick presses all end at the starting view, no error", async () => {
  const app = await loadApp();
  app.fix(LYON.lat, LYON.lng);
  app.map.setView([0, 0], 3);
  for (let i = 0; i < 5; i++) assert.doesNotThrow(() => press(app));
  assertAtView(lastMove(app).args, { ...LYON, zoom: 15 }, "after 5 presses");
});

test("Edge case (SC-001 mid-animation): pressed during a zoom animation → ends at the starting view once it settles", async () => {
  for (const reducedMotion of [false, true]) {
    const app = await loadApp({ reducedMotion });
    app.fix(LYON.lat, LYON.lng);
    app.map.setView([0, 0], 3);
    app.map.startZoomAnimation([0, 0], 5); // e.g. the user scroll-zooms; Leaflet is animating
    press(app);
    app.map.endZoomAnimation();
    app.map.fire("moveend");
    const settled = [app.map.getCenter(), app.map.getZoom()];
    assertAtView(settled, { ...LYON, zoom: 15 }, `map settled after the animation (reducedMotion=${reducedMotion})`);
  }
});

test("Reduced motion (CHK030): the map jumps without animation", async () => {
  const app = await loadApp({ geolocation: "denied", reducedMotion: true });
  app.map.setView([0, 0], 3);
  press(app);
  const [, , options] = app.lastSetView();
  assert.ok(options && options.animate === false, `setView options must include animate: false, got ${JSON.stringify(options)}`);
  assert.ok(app.mediaQueries.some((q) => /prefers-reduced-motion:\s*reduce/.test(q)), "checks prefers-reduced-motion");
});

test("No reduced-motion preference: Reset view still lands on the starting view (animation allowed)", async () => {
  const app = await loadApp({ geolocation: "denied", reducedMotion: false });
  app.map.setView([0, 0], 3);
  press(app);
  assertAtView(app.lastSetView(), PARIS);
});

// --- US1 scenario 6, FR-003, SC-004: nothing else changes --------------------------------------

test("US1 scenario 6, FR-003, SC-004: Reset view only moves the map — markers, layers, popups, panel and status stay", async () => {
  const app = await loadApp({ geolocation: "denied" });
  const statusBefore = app.byId.status.textContent;
  assert.match(statusBefore, /Location unavailable/, "precondition: status message shown");
  app.byId["search-input"].value = "Lyon";
  const layersBefore = [...app.map._layers];
  app.map.setView([0, 0], 3);
  const logStart = app.log.length;
  const fetchesBefore = app.fetchCalls.length;
  const focused = app.document.activeElement;

  press(app);

  const calls = app.log.slice(logStart).map((e) => e.kind);
  assert.ok(calls.includes("map.setView"), "the view changes");
  const allowed = new Set(["map.setView", "map.stop"]);
  assert.deepEqual(calls.filter((k) => !allowed.has(k)), [], "no other map or layer call (no layer removal, no popup close, no fitBounds)");
  assert.deepEqual(app.map._layers, layersBefore, "same layers on the map");
  assert.equal(app.byId.status.textContent, statusBefore, "status unchanged, no announcement (FR-005)");
  assert.equal(app.byId["search-input"].value, "Lyon", "search input unchanged");
  assert.equal(app.fetchCalls.length, fetchesBefore, "no network request");
  assert.equal(app.document.activeElement, focused, "focus not moved (FR-004)");
  assert.equal(resetControl(app).button.blurred, false, "button not blurred: focus stays on it (FR-004, CHK004)");
});

test("FR-003: with location found, Reset view does not move or recreate the user's position marker", async () => {
  const app = await loadApp();
  app.fix(LYON.lat, LYON.lng);
  app.map.setView([0, 0], 3);
  const logStart = app.log.length;
  press(app);
  const calls = app.log.slice(logStart).map((e) => e.kind);
  assert.equal(calls.filter((k) => k.startsWith("circleMarker")).length, 0, "position marker untouched");
  assert.equal(calls.filter((k) => k === "map.setView").length, 1, "exactly one view change");
});
