// SF-73 bicycle mode: integration tests that run the real src/app.js (fake DOM, fake Leaflet, fake
// geolocation) against the fake OSRM checked against the OSRM HTTP docs (test/fakes/).
import test from "node:test";
import assert from "node:assert/strict";
import { loadApp } from "./fakes/app-harness.js";
import { answerRoute } from "./fakes/osrm.js";

const BIKE = "https://routing.openstreetmap.de/routed-bike/route/v1/bike/";
const FOOT = "https://routing.openstreetmap.de/routed-foot/route/v1/foot/";
const CAR = "https://routing.openstreetmap.de/routed-car/route/v1/driving/";
const DEST = "2.3596,48.844"; // Jardin des Plantes in the fake Nominatim answer
const ROUTE_TITLE = /^Route \d · [\d.]+ k?m · \d+ (min|h)/;

function deferred() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

// --- US1: cycling routes -----------------------------------------------------------------------

// covers FR-002, SC-004: Walk stays the default
test("US1: without choosing a mode, routes are walking routes", async () => {
  const app = await loadApp();
  await app.search();
  assert.ok(app.osrmUrls()[0].startsWith(FOOT));
});

// covers FR-003, FR-004, US1 scenario 2
test("US1 s2: Bike + search asks the OSRM bike server and shows up to 3 routes with distance and duration", async () => {
  const app = await loadApp();
  await app.selectMode("bike");
  await app.search();
  const urls = app.osrmUrls();
  assert.equal(urls.length, 1, urls.join("\n"));
  assert.ok(urls[0].startsWith(BIKE), urls[0]);
  assert.ok(urls[0].includes(`;${DEST}?`), urls[0]);
  assert.match(urls[0], /alternatives=3/);
  assert.equal(app.routeButtons().length, 3);
  assert.equal(app.drawnLines().length, 3);
  for (const t of app.routeTitles()) assert.match(t, ROUTE_TITLE);
});

// covers FR-004, US1 scenario 3
test("US1 s3: clicking a cycling route in the panel or on the map selects it", async () => {
  const app = await loadApp();
  await app.selectMode("bike");
  await app.search();
  const pressed = () => app.routeButtons().map((b) => b.getAttribute("aria-pressed"));
  assert.ok(app.osrmUrls()[0].startsWith(BIKE));
  assert.deepEqual(pressed(), ["true", "false", "false"]);
  app.routeButtons()[1].click();
  assert.deepEqual(pressed(), ["false", "true", "false"]);
  const line = app.drawnLines()[2];
  for (const f of line.listeners.click) f({});
  assert.deepEqual(pressed(), ["false", "false", "true"]);
});

// covers FR-005, US1 scenario 4
test("US1 s4: status says cycling while computing and in the summary", async () => {
  const gate = deferred();
  const app = await loadApp({ osrm: async (url) => { await gate.promise; return answerRoute(url); } });
  await app.selectMode("bike");
  await app.search();
  assert.equal(app.status(), "Computing cycling routes…");
  gate.resolve();
  await app.flush();
  assert.match(app.status(), /^3 cycling routes · fastest [\d.]+ k?m · \d+ min$/);
});

// covers FR-005, US1 scenario 4, edge case "only one cycling route"
test("US1 s4: a single cycling route is summarised 'by bike'", async () => {
  const app = await loadApp({ routes: 1 });
  await app.selectMode("bike");
  await app.search();
  assert.equal(app.routeButtons().length, 1);
  assert.match(app.status(), /^[\d.]+ k?m · \d+ min by bike$/);
});

// covers FR-009, edge case "no artificial detours for cycling"
test("FR-009: bike with one OSRM route asks no detour routes", async () => {
  const app = await loadApp({ routes: 1 });
  await app.selectMode("bike");
  await app.search();
  assert.equal(app.osrmUrls().length, 1, app.osrmUrls().join("\n"));
  assert.ok(app.osrmUrls()[0].startsWith(BIKE));
  assert.equal(app.routeButtons().length, 1);
});

// covers FR-005, US1 scenario 5 (OSRM answers NoRoute with HTTP 400, per the OSRM docs)
test("US1 s5: no cycling route gives 'No cycling route found.'", async () => {
  const app = await loadApp({ noRoute: true });
  await app.selectMode("bike");
  await app.search();
  assert.ok(app.osrmUrls()[0].startsWith(BIKE));
  assert.equal(app.status(), "No cycling route found.");
  assert.equal(app.routeButtons().length, 0);
});

// covers FR-008, US1 scenario 6
test("US1 s6: cycling routes show the pleasure indicator with one 'most pleasant'", async () => {
  const app = await loadApp();
  await app.selectMode("bike");
  await app.search();
  await app.flush();
  assert.ok(app.osrmUrls()[0].startsWith(BIKE));
  const texts = app.pleasures().map((p) => p?.textContent);
  assert.equal(texts.length, 3);
  for (const t of texts) assert.match(t ?? "", /^Pleasure: \d+ green px( · most pleasant)?$/);
  assert.equal(texts.filter((t) => t.endsWith("most pleasant")).length, 1);
  assert.equal(app.pleasures().filter((p) => p.classList.contains("best")).length, 1);
  assert.ok(app.fetchLog.some((u) => u.startsWith("https://tile.openstreetmap.org/16/")));
});

// covers FR-008, US1 scenario 6 (ride too long), edge case "too long for pleasure scoring"
test("US1 s6: a ride too long to score shows 'Pleasure unavailable'", async () => {
  const far = { display_name: "Versailles, France", lat: "48.8049", lon: "2.1204" }; // ~17 km
  const app = await loadApp({ place: far });
  await app.selectMode("bike");
  await app.search("Versailles");
  await app.flush();
  assert.ok(app.osrmUrls()[0].startsWith(BIKE));
  const texts = app.pleasures().map((p) => p?.textContent);
  assert.ok(texts.length > 0);
  for (const t of texts) assert.equal(t, "Pleasure unavailable");
});

// covers FR-008, edge case "map tiles cannot be loaded"
test("US1 s6: tiles failing for a ride shows 'Pleasure unavailable'", async () => {
  const app = await loadApp({ tiles: "fail" });
  await app.selectMode("bike");
  await app.search();
  await app.flush();
  assert.ok(app.osrmUrls()[0].startsWith(BIKE));
  const texts = app.pleasures().map((p) => p?.textContent);
  assert.ok(texts.length > 0);
  for (const t of texts) assert.equal(t, "Pleasure unavailable");
});

// covers FR-008 ("Car routes keep no pleasure indicator"), SC-004
test("FR-008: car routes have no pleasure indicator", async () => {
  const app = await loadApp();
  await app.selectMode("car");
  await app.search();
  await app.flush();
  assert.ok(app.osrmUrls()[0].startsWith(CAR));
  assert.deepEqual(app.pleasures(), [null, null, null]);
  assert.ok(!app.fetchLog.some((u) => u.startsWith("https://tile.openstreetmap.org/16/")));
});

// covers edge case "cycling routing service unreachable": error shown, other modes still work
test("edge: bike routing error shows an error, then Car still works", async () => {
  const app = await loadApp({
    osrm: (url) => (url.startsWith(BIKE) ? { status: 502, body: {} } : answerRoute(url)),
  });
  await app.selectMode("bike");
  await app.search();
  assert.ok(app.osrmUrls()[0].startsWith(BIKE));
  assert.match(app.status(), /^Routing failed: /);
  await app.selectMode("car");
  assert.match(app.status(), /^3 driving routes/);
});

// covers edge case "no position yet": same behaviour as the other modes
test("edge: Bike without a position waits, then computes cycling routes once the position is known", async () => {
  const app = await loadApp({ noPosition: true });
  await app.selectMode("bike");
  await app.search();
  assert.equal(app.status(), "Waiting for your location to compute a route…");
  assert.equal(app.osrmUrls().length, 0);
  await app.setPosition({ lat: 48.8566, lng: 2.3522 });
  assert.ok(app.osrmUrls()[0]?.startsWith(BIKE), app.osrmUrls()[0]);
  assert.match(app.status(), /^3 cycling routes/);
});

// --- US2: switch modes ---------------------------------------------------------------------------

// covers FR-006, US2 scenario 1
test("US2 s1: Walk -> Bike replaces walking routes with cycling routes to the same place, no new search", async () => {
  const app = await loadApp();
  await app.search();
  assert.match(app.status(), /walking routes/);
  const searches = app.fetchLog.filter((u) => u.includes("nominatim")).length;
  await app.selectMode("bike");
  const last = app.osrmUrls().at(-1);
  assert.ok(last.startsWith(BIKE), last);
  assert.ok(last.includes(`;${DEST}?`));
  assert.match(app.status(), /^3 cycling routes/);
  assert.equal(app.routeButtons().length, 3);
  assert.equal(app.drawnLines().length, 3, "walking lines removed");
  assert.equal(app.fetchLog.filter((u) => u.includes("nominatim")).length, searches);
});

// covers FR-006, US2 scenario 2
test("US2 s2: Bike -> Car and Bike -> Walk replace the cycling routes", async () => {
  const app = await loadApp();
  await app.selectMode("bike");
  await app.search();
  assert.match(app.status(), /cycling/);
  await app.selectMode("car");
  assert.ok(app.osrmUrls().at(-1).startsWith(CAR));
  assert.match(app.status(), /^3 driving routes/);
  await app.selectMode("bike");
  assert.match(app.status(), /^3 cycling routes/);
  await app.selectMode("foot");
  assert.ok(app.osrmUrls().at(-1).startsWith(FOOT));
  assert.match(app.status(), /^3 walking routes/);
});

// covers FR-006, US2 scenario 3
test("US2 s3: quick switches show only the last selected mode's routes", async () => {
  const gates = { bike: deferred(), car: deferred() };
  const app = await loadApp({
    osrm: async (url) => {
      const gate = url.startsWith(BIKE) ? gates.bike : url.startsWith(CAR) ? gates.car : null;
      if (gate) await gate.promise;
      return answerRoute(url);
    },
  });
  await app.search(); // walking
  await app.selectMode("bike"); // pending
  await app.selectMode("car"); // pending
  assert.ok(app.osrmUrls().some((u) => u.startsWith(BIKE)), "bike was requested");
  gates.car.resolve();
  await app.flush();
  gates.bike.resolve(); // late bike answer must be dropped
  await app.flush();
  assert.match(app.status(), /^3 driving routes/);
  assert.deepEqual(app.pleasures(), [null, null, null]);
  assert.equal(app.drawnLines().length, 3);
});

// --- US3: stops ----------------------------------------------------------------------------------

const S1 = { display_name: "Panthéon, Paris", lat: "48.8462", lon: "2.3464" };
const S2 = { display_name: "Gare d'Austerlitz, Paris", lat: "48.8424", lon: "2.3651" };

// covers FR-007, US3 scenario 1
test("US3 s1: cycling route goes through every stop in list order", async () => {
  const app = await loadApp();
  await app.addStop(S1);
  await app.addStop(S2);
  await app.selectMode("bike");
  await app.search();
  const last = app.osrmUrls().at(-1);
  assert.ok(last.startsWith(`${BIKE}2.3522,48.8566;2.3464,48.8462;2.3651,48.8424;${DEST}?`), last);
  assert.match(app.status(), / via 2 stops/);
  assert.match(app.status(), /cycling|by bike/);
});

// covers FR-005 with stops, US1 scenario 5
test("US3: no cycling route through the stops suggests removing a stop", async () => {
  const app = await loadApp({ noRoute: true });
  await app.addStop(S1);
  await app.selectMode("bike");
  await app.search();
  assert.ok(app.osrmUrls().at(-1).startsWith(BIKE));
  assert.equal(app.status(), "No cycling route found. Try removing a stop.");
});

// covers FR-007, US3 scenario 2
test("US3 s2: stops are kept when switching to and from Bike", async () => {
  const app = await loadApp();
  await app.addStop(S1);
  await app.addStop(S2);
  await app.search();
  const stopsPart = "2.3522,48.8566;2.3464,48.8462;2.3651,48.8424;";
  await app.selectMode("bike");
  assert.ok(app.osrmUrls().at(-1).startsWith(`${BIKE}${stopsPart}`), app.osrmUrls().at(-1));
  await app.selectMode("car");
  assert.ok(app.osrmUrls().at(-1).startsWith(`${CAR}${stopsPart}`), app.osrmUrls().at(-1));
  assert.equal(app.els.stops.children.length, 2);
  assert.equal(app.els["stops-box"].hidden, false);
});
