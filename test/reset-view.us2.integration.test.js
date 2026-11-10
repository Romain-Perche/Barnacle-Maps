// Integration tests, US2 "Reset the view without losing work": src/app.js driven through the
// fake browser and Leaflet in test/support/fake-browser.js.
import test from "node:test";
import assert from "node:assert/strict";
import {
  bootApp, deferred, flush, jsonResponse, PARIS_FIX, pressReset, resultButtons, routeButtons,
  routeResponse, search, searchResponse,
} from "./support/fake-browser.js";

const START = { ...PARIS_FIX, zoom: 15 };

function stubFetch(routeGate = null) {
  return (url) => {
    if (url.includes("nominatim")) return jsonResponse(searchResponse());
    if (url.includes("routing.openstreetmap.de")) {
      return routeGate ? routeGate.promise.then(() => jsonResponse(routeResponse())) : jsonResponse(routeResponse());
    }
    return jsonResponse({}, 404); // tiles for the pleasure score: unavailable, as allowed
  };
}

function snapshot(ctx) {
  return {
    input: ctx.input.value,
    results: ctx.results.children.length,
    routes: routeButtons(ctx).map((b) => [b.textContent, b.getAttribute("aria-pressed"), b.classList.contains("selected")]),
    status: ctx.status.textContent,
    mode: ctx.radios.map((r) => [r.value, r.checked]),
  };
}

function setViewIsStart(call) {
  const [c, zoom] = call.args;
  const lat = Array.isArray(c) ? c[0] : c.lat;
  const lng = Array.isArray(c) ? c[1] : c.lng;
  return Math.abs(lat - START.lat) <= 1e-6 && Math.abs(lng - START.lng) <= 1e-6 && zoom === START.zoom;
}

// covers FR-005, SC-003, US2 scenario 1
test("US2-1: with routes shown and Route 2 selected, a reset changes only the map view", async () => {
  const ctx = await bootApp({ fetch: stubFetch() });
  ctx.fix(PARIS_FIX.lat, PARIS_FIX.lng);
  await search(ctx, "Louvre");
  resultButtons(ctx)[0].click();
  await flush(30);
  const buttons = routeButtons(ctx);
  assert.ok(buttons.length >= 2, `routes are shown (got ${buttons.length})`);
  buttons[1].click();
  assert.equal(buttons[1].getAttribute("aria-pressed"), "true", "Route 2 is selected");
  ctx.userMoves(48.861, 2.336, 18); // the user zooms in on details
  const before = snapshot(ctx);

  const r = pressReset(ctx);

  assert.equal(r.setViews.length, 1);
  assert.ok(setViewIsStart(r.setViews[0]), "the view goes back to the starting view, not to the routes");
  const other = r.calls.filter((c) => !(c.target === "map" && ["setView", "stop"].includes(c.method)));
  assert.deepEqual(other.map((c) => `${c.target}.${c.method}`), [],
    "no call on route lines, markers, popups or fitBounds");
  assert.equal(r.mutations.length, 0, "no DOM change: input, results, routes, mode and status untouched");
  assert.deepEqual(snapshot(ctx), before);
  assert.deepEqual(r.consoleErrors, []);
});

// covers FR-005, US2 scenario 2 (position marker, destination marker, open popup)
test("US2-2: the position marker stays at the user's current location; markers and popups are untouched", async () => {
  const ctx = await bootApp({ fetch: stubFetch() });
  ctx.fix(PARIS_FIX.lat, PARIS_FIX.lng);
  ctx.fix(48.8530, 2.3499); // the user has moved since the first fix
  await search(ctx, "Louvre");
  resultButtons(ctx)[0].click();
  await flush(30);
  const markerCalls = (name) => ctx.calls.filter((c) => c.target === name);
  const userMarker = ctx.calls.find((c) => c.kind === "circleMarker")?.target;
  const destMarker = ctx.calls.find((c) => c.kind === "marker")?.target;
  assert.ok(userMarker && destMarker, "both markers exist");
  const lastUserPos = markerCalls(userMarker).filter((c) => c.method === "setLatLng").at(-1)?.args[0];
  assert.deepEqual(lastUserPos, [48.8530, 2.3499], "the position marker follows the latest fix");
  ctx.userMoves(48.9, 2.5, 12);

  const r = pressReset(ctx);

  assert.ok(setViewIsStart(r.setViews[0]), "the view goes back to the first fix, not the current position");
  assert.deepEqual(r.calls.filter((c) => c.target === userMarker || c.target === destMarker), [],
    "no call on the position or destination marker (not moved, removed or rebound)");
  assert.deepEqual(r.calls.filter((c) => /popup/i.test(c.method)), [], "no popup is opened or closed");
});

// covers FR-014, Edge Cases (reset while routes are loading)
test("US2: a reset while routes are loading doesn't cancel them; the later fit-to-routes still runs", async () => {
  const gate = deferred();
  const ctx = await bootApp({ fetch: stubFetch(gate) });
  ctx.fix(PARIS_FIX.lat, PARIS_FIX.lng);
  await search(ctx, "Louvre");
  resultButtons(ctx)[0].click();
  await flush();
  assert.equal(routeButtons(ctx).length, 0, "routes are still loading");
  const routeFetch = ctx.fetchCalls.find((f) => f.url.includes("routing.openstreetmap.de"));
  assert.ok(routeFetch, "a route request is in flight");

  const r = pressReset(ctx);
  assert.ok(setViewIsStart(r.setViews[0]), "the reset happens immediately");
  assert.equal(routeFetch.init?.signal?.aborted ?? false, false, "the route request is not aborted");

  const fitIndex = ctx.calls.length;
  gate.resolve();
  await flush(30);
  assert.ok(routeButtons(ctx).length >= 2, "the routes still arrive and are listed");
  assert.ok(ctx.calls.slice(fitIndex).some((c) => c.target === "map" && c.method === "fitBounds"),
    "the app fits the view to the routes after the reset, as today");
  assert.match(ctx.status.textContent, /walking routes|on foot/);
});
