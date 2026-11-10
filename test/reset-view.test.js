// Integration tests for the Reset view control, driving the real src/app.js in a fake browser
// with a fake Leaflet (test/support/fake-browser.js). They follow
// specs/pilot-22089-add-a-reset-view-button/contracts/reset-view-control.md and spec.md.
import test from "node:test";
import assert from "node:assert/strict";
import { flush, loadApp, metres } from "./support/fake-browser.js";

const PARIS = { lat: 48.8566, lng: 2.3522 };
const BERLIN = { lat: 52.52, lng: 13.405 };
const TOKYO = { lat: 35.6762, lng: 139.6503 };
const HOME = { lat: 48.85, lng: 2.35 }; // simulated user position for route tests
const LOUVRE = { display_name: "Louvre Museum, Paris", lat: "48.8606", lon: "2.3376" };
const ORSAY = { display_name: "Musée d'Orsay, Paris", lat: "48.86", lon: "2.3266" };
const place = (r) => ({ lat: Number(r.lat), lng: Number(r.lon) });

// SC-002: center within 5 m, zoom exactly equal.
function assertView(map, expected, zoom, msg = "") {
  const d = metres(map.getCenter(), expected);
  assert.ok(d <= 5, `${msg} center ${JSON.stringify(map.getCenter())} is ${d.toFixed(1)} m from ${JSON.stringify(expected)}`);
  assert.equal(map.getZoom(), zoom, `${msg} zoom`);
}

const panAway = (env) => env.map.setView([40.4168, -3.7038], 6); // the user moves to Madrid, zoom 6

// Fix the position, search, pick a result and let its routes arrive.
async function withRoutes(env, result = LOUVRE) {
  env.searchResults = [result, ORSAY];
  await env.search("museum");
  env.resultButtons().find((b) => b.textContent === result.display_name).click();
  await flush();
  await env.answerRoutes(HOME, place(result));
}

// --- Control DOM and placement --------------------------------------------------------------

// covers FR-001, FR-006, FR-009, US2 scenario 3
test("contract DOM: exactly one native 'Reset view' button with ⌂ icon, tooltip and accessible name", async () => {
  const env = await loadApp();
  const btn = env.resetButton();
  assert.equal(btn.tagName, "BUTTON");
  assert.equal(btn.type || btn.getAttribute("type"), "button");
  assert.ok(btn.classList.contains("reset-view"), "class reset-view");
  assert.equal(btn.getAttribute("aria-label"), "Reset view");
  assert.equal(btn.title || btn.getAttribute("title"), "Reset view");
  assert.equal(btn.textContent.trim(), "⌂", "only the home glyph is shown, no visible text");
  const glyph = btn.querySelector("span");
  if (glyph) assert.equal(glyph.getAttribute("aria-hidden"), "true", "glyph hidden from screen readers");
  else assert.match(btn.innerHTML, /aria-hidden="true"/, "glyph hidden from screen readers");
  assert.equal(btn.disabled, false, "never disabled");
  const bar = btn.parentNode;
  assert.ok(bar.classList.contains("leaflet-bar") && bar.classList.contains("leaflet-control"), "inside div.leaflet-bar.leaflet-control");
});

// covers FR-007, US2 scenario 1 (bottom-right: Reset view, zoom, credits; zoom no longer top-left)
test("contract placement: zoom moved to bottom-right, Reset view above it, credits below", async () => {
  const env = await loadApp();
  assert.equal(env.map.options.zoomControl, false, "map created with zoomControl: false");
  assert.equal(env.map.corners.topleft.length, 0, "nothing left in the top-left corner under the panel");
  const stack = env.map.corners.bottomright;
  const resetIdx = stack.findIndex(({ el }) => el.contains(env.resetButton()));
  const zoomIdx = stack.findIndex(({ control }) => control?.kind === "zoom");
  const attrIdx = stack.findIndex(({ control }) => control?.kind === "attribution");
  assert.ok(resetIdx >= 0 && zoomIdx >= 0 && attrIdx >= 0, "all three in bottom-right");
  assert.deepEqual([resetIdx, zoomIdx, attrIdx], [0, 1, 2], "top to bottom: Reset view, zoom, credits");
});

// covers FR-006 (presses never reach the map: no double-click/tap zoom, no drag)
test("contract events: click and scroll propagation to the map are disabled", async () => {
  const env = await loadApp();
  const btn = env.resetButton();
  const disabled = (set) => [...set].some((el) => el === btn || el.contains(btn));
  assert.ok(disabled(env.leaflet.clickPropagationDisabled), "disableClickPropagation on the control");
  assert.ok(disabled(env.leaflet.scrollPropagationDisabled), "disableScrollPropagation on the control");
});

// --- Starting view ---------------------------------------------------------------------------

// covers FR-002, FR-003, US1 scenario 5 (geolocation unsupported)
test("US1-5: without geolocation, Reset view returns to central Paris at zoom 13", async () => {
  const env = await loadApp({ geolocation: false });
  panAway(env);
  env.pressReset();
  assertView(env.map, PARIS, 13);
});

// covers FR-003, US1 scenario 5, edge case "permission denied"
test("US1-5: with location denied, Reset view returns to central Paris at zoom 13", async () => {
  const env = await loadApp();
  env.geoError(1);
  panAway(env);
  env.pressReset();
  assertView(env.map, PARIS, 13);
});

// covers FR-002, FR-003, US1 scenario 1 and 4
test("US1-1/US1-4: after the first location fix, Reset view returns to that fix at zoom 15", async () => {
  const env = await loadApp();
  env.fix(BERLIN.lat, BERLIN.lng);
  assertView(env.map, BERLIN, 15, "app centers on the first fix");
  panAway(env);
  env.pressReset();
  assertView(env.map, BERLIN, 15);
});

// covers FR-003, FR-004, quickstart scenario 3 (later live updates don't move the target)
test("FR-004: later position updates do not change the starting view", async () => {
  const env = await loadApp();
  env.fix(BERLIN.lat, BERLIN.lng);
  env.fix(TOKYO.lat, TOKYO.lng);
  panAway(env);
  env.pressReset();
  assertView(env.map, BERLIN, 15);
  assert.ok(metres(env.userMarker().getLatLng(), TOKYO) < 1, "the position marker still follows the live position");
});

// covers FR-003 (first successful fix even after an earlier error, no time limit)
test("FR-003: the first successful fix after an earlier location error sets the starting view", async () => {
  const env = await loadApp();
  env.geoError(3);
  env.fix(BERLIN.lat, BERLIN.lng);
  panAway(env);
  env.pressReset();
  assertView(env.map, BERLIN, 15);
});

// covers FR-004 (showing a destination before the location is known does not set the start)
test("FR-004: a destination shown before the location is known does not set the starting view", async () => {
  const env = await loadApp();
  env.searchResults = [LOUVRE];
  await env.search("Louvre");
  env.resultButtons()[0].click();
  await flush();
  assert.match(env.status.textContent, /Waiting for your location/);
  env.pressReset();
  assertView(env.map, PARIS, 13);
});

// covers edge case "pressed before the first location fix", FR-003
test("edge: a press before the first fix goes to Paris; the later fix still recenters and becomes the target", async () => {
  const env = await loadApp();
  panAway(env);
  env.pressReset();
  assertView(env.map, PARIS, 13, "before the fix");
  env.fix(BERLIN.lat, BERLIN.lng);
  assertView(env.map, BERLIN, 15, "app centers on the late first fix");
  panAway(env);
  env.pressReset();
  assertView(env.map, BERLIN, 15, "after the fix");
});

// covers FR-004 (never stored between page loads)
test("FR-004: the starting view is not written to localStorage or sessionStorage", async () => {
  const env = await loadApp();
  env.fix(BERLIN.lat, BERLIN.lng);
  env.pressReset();
  assertView(env.map, BERLIN, 15);
  assert.deepEqual(env.storageWrites, []);
});

// --- Reset behaviour -------------------------------------------------------------------------

// covers FR-008, US1 scenario 2, edge case "pressed repeatedly"
test("US1-2: pressing at the starting view (repeatedly) keeps the same view and throws nothing", async () => {
  const env = await loadApp();
  env.fix(BERLIN.lat, BERLIN.lng);
  for (let i = 0; i < 3; i++) {
    assert.doesNotThrow(() => env.pressReset());
    assertView(env.map, BERLIN, 15, `press ${i + 1}`);
  }
  const resets = env.map.moves.slice(-3);
  assert.ok(
    resets.every((m) => m.method === "setView" && metres(m.center, BERLIN) <= 5 && m.zoom === 15),
    "every press moves straight to the same view (no fit, no bounce)",
  );
});

// covers FR-005, SC-004, US1 scenario 3
test("US1-3: a reset with routes shown changes only the map center and zoom", async () => {
  const env = await loadApp();
  env.fix(HOME.lat, HOME.lng);
  await withRoutes(env);
  env.routeButtons()[1].click(); // select Route 2
  env.results.scrollTop = 40;
  env.routesList.scrollTop = 25;
  panAway(env);
  const snap = () => ({
    input: env.input.value,
    results: env.results.textContent,
    routes: env.routesList.textContent,
    pressed: env.routeButtons().map((b) => b.getAttribute("aria-pressed")),
    styles: env.polylinesOnMap().map((l) => l.options.color),
    lines: env.polylinesOnMap().length,
    mode: env.radios.map((r) => r.checked),
    status: env.status.textContent,
    dest: env.destMarker() && env.destMarker().getLatLng(),
    user: env.userMarker() && env.userMarker().getLatLng(),
    scroll: [env.results.scrollTop, env.routesList.scrollTop],
    fetches: env.fetches.length,
  });
  const before = snap();
  assert.equal(before.lines, 2, "routes displayed");
  assert.deepEqual(before.pressed, ["false", "true"], "Route 2 selected");
  env.pressReset();
  assertView(env.map, HOME, 15);
  assert.deepEqual(snap(), before);
});

// covers FR-005 ("Waiting for your location…" status and destination marker stay)
test("FR-005: a reset keeps the 'Waiting for your location…' status and the destination marker", async () => {
  const env = await loadApp();
  env.searchResults = [LOUVRE];
  await env.search("Louvre");
  env.resultButtons()[0].click();
  await flush();
  const status = env.status.textContent;
  const dest = env.destMarker().getLatLng();
  env.pressReset();
  assert.equal(env.status.textContent, status);
  assert.deepEqual(env.destMarker().getLatLng(), dest);
});

// covers FR-011, edge case "pressed while routes are loading", quickstart scenario 6
test("FR-011: a reset while routes load wins; those routes are drawn without zooming to them", async () => {
  const env = await loadApp();
  env.fix(HOME.lat, HOME.lng);
  env.searchResults = [LOUVRE, ORSAY];
  await env.search("museum");
  env.resultButtons()[0].click();
  await flush();
  assert.match(env.status.textContent, /Computing/);
  panAway(env);
  env.pressReset();
  const fitsBefore = env.map.moves.filter((m) => m.method === "fitBounds").length;
  await env.answerRoutes(HOME, place(LOUVRE));
  assert.equal(env.polylinesOnMap().length, 2, "routes drawn");
  assert.equal(env.routeButtons().length, 2, "routes listed");
  assert.equal(env.map.moves.filter((m) => m.method === "fitBounds").length, fitsBefore, "no fit to those routes");
  assertView(env.map, HOME, 15, "map stays on the starting view");
});

// covers FR-011 (any later route search zooms to its routes as usual)
test("FR-011: after a reset during loading, a later destination fits its routes as usual", async () => {
  const env = await loadApp();
  env.fix(HOME.lat, HOME.lng);
  env.searchResults = [LOUVRE, ORSAY];
  await env.search("museum");
  env.resultButtons()[0].click();
  await flush();
  env.pressReset();
  await env.answerRoutes(HOME, place(LOUVRE));
  await withRoutes(env, ORSAY);
  assert.equal(env.map.moves.at(-1).method, "fitBounds", "the new search's routes are fitted");
});

// covers FR-011 (a travel-mode change is a new route search and fits)
test("FR-011: after a reset during loading, a travel-mode change fits its routes as usual", async () => {
  const env = await loadApp();
  env.fix(HOME.lat, HOME.lng);
  env.searchResults = [LOUVRE];
  await env.search("Louvre");
  env.resultButtons()[0].click();
  await flush();
  env.pressReset();
  await env.answerRoutes(HOME, place(LOUVRE));
  await env.setMode("car");
  await env.answerRoutes(HOME, place(LOUVRE));
  assert.equal(env.map.moves.at(-1).method, "fitBounds", "car routes are fitted");
});

// covers FR-011 (a reset after the routes are drawn does not block the next search's fit)
test("FR-011: a reset after routes are drawn does not stop the next search from fitting", async () => {
  const env = await loadApp();
  env.fix(HOME.lat, HOME.lng);
  await withRoutes(env);
  env.pressReset();
  assertView(env.map, HOME, 15);
  await withRoutes(env, ORSAY);
  assert.equal(env.map.moves.at(-1).method, "fitBounds");
});

// covers FR-010 (instant jump with reduced motion, preference read at each press), SC-003
test("FR-010: reduced motion makes the reset instant; the preference is read at each press", async () => {
  const env = await loadApp({ reducedMotion: true });
  panAway(env);
  env.pressReset();
  let last = env.map.moves.at(-1);
  assert.equal(last.method, "setView", "reset uses setView (no flyTo, whose duration grows with distance)");
  assert.equal(last.options.animate, false, "no animation when reduced motion is preferred");
  env.reducedMotion = false;
  panAway(env);
  env.pressReset();
  last = env.map.moves.at(-1);
  assert.equal(last.method, "setView");
  assert.notEqual(last.options.animate, false, "animation allowed again once the preference is off");
  assertView(env.map, PARIS, 13);
});

// covers FR-006, SC-005 (focus stays on the button after activation)
test("FR-006: keyboard focus stays on the button after a press", async () => {
  const env = await loadApp();
  const btn = env.resetButton();
  btn.focus();
  panAway(env);
  btn.click();
  assert.equal(env.document.activeElement, btn);
  assertView(env.map, PARIS, 13);
});

// --- Panel lists (FR-007 clarification: replaced lists start at the top) ---------------------

// covers FR-007 ("A list whose content is replaced starts scrolled to the top")
test("FR-007: new search results start scrolled to the top", async () => {
  const env = await loadApp();
  env.searchResults = [LOUVRE, ORSAY];
  await env.search("museum");
  env.results.scrollTop = 80;
  env.searchResults = [ORSAY, LOUVRE];
  await env.search("musee");
  assert.equal(env.results.scrollTop, 0);
});

// covers FR-007 ("routes of a new search or travel-mode change" start at the top)
test("FR-007: routes replaced by a travel-mode change start scrolled to the top", async () => {
  const env = await loadApp();
  env.fix(HOME.lat, HOME.lng);
  await withRoutes(env);
  env.routesList.scrollTop = 60;
  await env.setMode("car");
  await env.answerRoutes(HOME, place(LOUVRE));
  assert.equal(env.routesList.scrollTop, 0);
});
