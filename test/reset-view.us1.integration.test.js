// Integration tests, US1 "Return the map to its starting view": src/app.js driven through the
// fake browser and Leaflet in test/support/fake-browser.js.
import test from "node:test";
import assert from "node:assert/strict";
import {
  bootApp, flush, jsonResponse, pressReset, resultButtons, search, searchResponse,
} from "./support/fake-browser.js";

const DEFAULT = { lat: 48.8566, lng: 2.3522, zoom: 13 };
const TOL = 0.000001; // SC-002

function assertView(setViewCall, want, msg = "") {
  assert.ok(setViewCall, `${msg} expected a map.setView call`);
  const [center, zoom] = setViewCall.args;
  const c = Array.isArray(center) ? { lat: center[0], lng: center[1] } : { lat: center.lat, lng: center.lng };
  assert.ok(Math.abs(c.lat - want.lat) <= TOL, `${msg} lat ${c.lat} ≈ ${want.lat}`);
  assert.ok(Math.abs(c.lng - want.lng) <= TOL, `${msg} lng ${c.lng} ≈ ${want.lng}`);
  assert.equal(zoom, want.zoom, `${msg} zoom`);
}

function assertOnlyMapMoved(r) {
  const other = r.calls.filter((c) => !(c.target === "map" && ["setView", "stop"].includes(c.method)));
  assert.deepEqual(other.map((c) => `${c.target}.${c.method}`), [], "the reset makes no Leaflet call other than map.setView");
  assert.equal(r.mutations.length, 0, "the reset changes nothing in the DOM");
}

// covers FR-002, FR-003, SC-002, US1 scenario 1
test("US1-1: location denied, pan and zoom away, reset returns to central Paris at zoom 13", async () => {
  const ctx = await bootApp({ location: "deny" });
  ctx.userMoves(51.5, -0.12, 9);
  const r = pressReset(ctx);
  assert.equal(r.setViews.length, 1, "exactly one setView per press");
  assertView(r.setViews[0], DEFAULT);
  assert.deepEqual(ctx.view(), DEFAULT);
  assertOnlyMapMoved(r);
  assert.deepEqual(r.consoleErrors, []);
  assert.deepEqual(r.uncaught, []);
});

// covers FR-003, US1 scenario 1 (browser without geolocation)
test("US1-1b: no geolocation support, reset returns to the default view", async () => {
  const ctx = await bootApp({ location: "unsupported" });
  ctx.userMoves(0, 0, 3);
  assertView(pressReset(ctx).setViews[0], DEFAULT);
});

// covers FR-003, FR-004, SC-002, US1 scenario 2
test("US1-2: after auto-centering on the first fix, reset returns to that fix at zoom 15", async () => {
  const ctx = await bootApp();
  ctx.fix(48.8584, 2.2945);
  const auto = ctx.calls.filter((c) => c.target === "map" && c.method === "setView").at(-1);
  assertView(auto, { lat: 48.8584, lng: 2.2945, zoom: 15 }, "the app auto-centers on the first fix:");
  ctx.userMoves(48.80, 2.40, 11);
  const r = pressReset(ctx);
  assertView(r.setViews[0], { lat: 48.8584, lng: 2.2945, zoom: 15 });
  assertOnlyMapMoved(r);
});

// covers FR-004, Edge Cases (later position updates, revoked location)
test("US1-2b: later fixes and a later location error don't change the starting view", async () => {
  const ctx = await bootApp();
  ctx.fix(48.8584, 2.2945);
  const before = ctx.calls.length;
  ctx.fix(48.8530, 2.3499);
  ctx.fix(48.8600, 2.3400);
  assert.equal(ctx.calls.slice(before).filter((c) => c.method === "setView").length, 0,
    "later fixes don't auto-center again");
  ctx.locationError(1);
  ctx.userMoves(1, 1, 4);
  assertView(pressReset(ctx).setViews[0], { lat: 48.8584, lng: 2.2945, zoom: 15 });
});

// covers FR-003, Edge Cases (late first fix after the user moved the map and pressed reset)
test("US1-2c: a late first fix still auto-centers and becomes the starting view", async () => {
  const ctx = await bootApp();
  ctx.userMoves(40, 3, 6);
  assertView(pressReset(ctx).setViews[0], DEFAULT, "before any fix:");
  ctx.userMoves(41, 4, 7);
  ctx.fix(45.764, 4.8357); // Lyon, far from Paris
  assert.deepEqual(ctx.view(), { lat: 45.764, lng: 4.8357, zoom: 15 }, "the first fix still auto-centers");
  ctx.userMoves(0, 0, 2);
  assertView(pressReset(ctx).setViews[0], { lat: 45.764, lng: 4.8357, zoom: 15 });
});

// covers FR-004, Edge Cases (searching / centering on a destination doesn't change the starting view)
test("US1-2d: centering on a destination before location is known doesn't change the starting view", async () => {
  const ctx = await bootApp({
    fetch: (url) => (url.includes("nominatim") ? jsonResponse(searchResponse()) : jsonResponse({}, 404)),
  });
  await search(ctx, "Louvre");
  resultButtons(ctx)[0].click();
  await flush();
  assert.deepEqual(ctx.view(), { lat: 48.8606, lng: 2.3376, zoom: 15 }, "the app centers on the destination");
  assertView(pressReset(ctx).setViews[0], DEFAULT);
});

// covers FR-010, US1 scenario 3, Edge Cases (repeated presses)
test("US1-3: at the starting view, repeated presses keep the view and change nothing else", async () => {
  const ctx = await bootApp({ location: "deny" });
  for (let i = 0; i < 5; i++) {
    const r = pressReset(ctx);
    assertView(r.setViews[0], DEFAULT, `press ${i + 1}:`);
    assertOnlyMapMoved(r);
    assert.deepEqual(r.consoleErrors, []);
    assert.deepEqual(r.uncaught, []);
    assert.equal(r.button.disabled, false, "always enabled");
  }
  assert.deepEqual(ctx.view(), DEFAULT);
});

// covers FR-015, SC-001 (no long fly-to; instant under reduced motion)
test("US1: under prefers-reduced-motion: reduce the reset is instant (animate: false)", async () => {
  const ctx = await bootApp({ location: "deny", reducedMotion: true });
  ctx.userMoves(1, 1, 4);
  const r = pressReset(ctx);
  assert.equal(r.setViews[0].args[2]?.animate, false);
});

test("US1: without reduced motion the reset is not forced instant, and never uses flyTo", async () => {
  const ctx = await bootApp({ location: "deny" });
  ctx.userMoves(1, 1, 4);
  const r = pressReset(ctx);
  assert.notEqual(r.setViews[0].args[2]?.animate, false);
  assert.equal(r.calls.filter((c) => /^fly/.test(c.method)).length, 0, "no flyTo / flyToBounds");
});

// covers FR-018 (an unexpected error is logged, the map stays put, nothing shown, focus kept)
test("US1: if setView throws, the error is logged to the console and nothing else happens", async () => {
  const ctx = await bootApp({ location: "deny" });
  ctx.status.textContent = "Location unavailable. Allow location access to get directions.";
  ctx.userMoves(1, 1, 4);
  const boom = new Error("boom");
  ctx.map.throwOnSetView = boom;
  const r = pressReset(ctx);
  ctx.map.throwOnSetView = null;
  assert.deepEqual(r.uncaught, [], "the error doesn't escape the click handler");
  assert.equal(r.consoleErrors.length, 1, "logged once with console.error");
  assert.ok(r.consoleErrors[0].includes(boom), "the thrown error is what is logged");
  assert.deepEqual(ctx.view(), { lat: 1, lng: 1, zoom: 4 }, "the map stays where it is");
  assert.equal(r.mutations.length, 0, "nothing is shown to the user; status untouched");
  assert.equal(ctx.doc.activeElement, r.button, "focus stays on the button");
});
