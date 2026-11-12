// Integration tests for PILOT-97524 "Show the arrival time for each route".
// They run the real src/app.js against a fake DOM, fake Leaflet, fake geolocation and a scripted
// fetch (test/support/app-harness.js), with the clock mocked by node:test (Date only).
import test from "node:test";
import assert from "node:assert/strict";
import { bootApp, deferred, osrmJson, routesWith, settle } from "./support/app-harness.js";

// Local wall-clock instant on 2026-11-12 (or another day of November 2026): holds in any time zone.
const at = (h, min, s = 0, day = 12) => new Date(2026, 10, day, h, min, s).getTime();

function useClock(t, now) {
  t.mock.timers.enable({ apis: ["Date"], now });
  return (ms) => t.mock.timers.setTime(ms);
}

// Boots the app with a position, chooses the destination, and returns the app.
async function showRoutes(opts) {
  const app = await bootApp(opts);
  await app.setPosition();
  await app.chooseDestination();
  return app;
}

// ---------------------------------------------------------------- US1: see when I will arrive

test("US1 scenario 1: 14:07 + 25 min reads '25 min, arrive 14:32' (FR-001, FR-002, FR-003)", async (t) => {
  useClock(t, at(14, 7));
  const app = await showRoutes({ route: () => osrmJson(routesWith([1500])) });
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 25 min, arrive 14:32"]);
});

test("US1 scenario 2: each of several car routes shows its own arrival time (FR-001, FR-002, SC-001)", async (t) => {
  useClock(t, at(14, 7));
  const app = await bootApp({ route: () => osrmJson(routesWith([1500, 1800, 2100])) });
  await app.setPosition();
  await app.setMode("car");
  await app.chooseDestination();
  assert.deepEqual(app.routeTitles(), [
    "Route 1 · 2.10 km · 25 min, arrive 14:32",
    "Route 2 · 2.20 km · 30 min, arrive 14:37",
    "Route 3 · 2.30 km · 35 min, arrive 14:42",
  ]);
});

test("US1 scenario 2: walking routes show arrival times and keep the pleasure line (FR-006)", async (t) => {
  useClock(t, at(14, 7));
  const app = await showRoutes({ route: () => osrmJson(routesWith([1500, 1800])) });
  assert.deepEqual(app.routeTitles(), [
    "Route 1 · 2.10 km · 25 min, arrive 14:32",
    "Route 2 · 2.20 km · 30 min, arrive 14:37",
  ]);
  for (const b of app.routeButtons()) {
    const pleasure = b.elementChildren[1];
    assert.ok(pleasure && pleasure.className.includes("pleasure"), "pleasure span still present");
    assert.match(pleasure.textContent, /^Pleasure/);
    assert.ok(!pleasure.textContent.includes("arrive"), "arrival is not in the pleasure line");
  }
});

test("US1 scenario 2: a route with a stop shows its arrival time (FR-006)", async (t) => {
  useClock(t, at(14, 7));
  const app = await bootApp({ route: () => osrmJson(routesWith([2400])) });
  await app.setPosition();
  await app.search();
  await app.addStopFromResult(1);
  await app.search();
  await app.pickResult(0);
  assert.equal(app.world.routeCalls.at(-1).split(";").length, 3, "the request goes through the stop");
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 40 min, arrive 14:47"]);
});

test("US1 scenario 3: 09:55 + 1 h 10 min reads '1 h 10 min, arrive 11:05'", async (t) => {
  useClock(t, at(9, 55));
  const app = await showRoutes({ route: () => osrmJson(routesWith([4200])) });
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 1 h 10 min, arrive 11:05"]);
});

test("US1 scenario 4: 23:50 + 25 min reads '25 min, arrive 00:15 (+1 day)' (FR-004)", async (t) => {
  useClock(t, at(23, 50));
  const app = await showRoutes({ route: () => osrmJson(routesWith([1500])) });
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 25 min, arrive 00:15 (+1 day)"]);
});

test("Edge: exact duration is added, then rounded (14:07:40 + 24 min 50 s → 14:33) (FR-002)", async (t) => {
  useClock(t, at(14, 7, 40));
  const app = await showRoutes({ route: () => osrmJson(routesWith([1490])) });
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 25 min, arrive 14:33"]);
});

test("Edge: the departure is the moment the results arrive, not the request start (FR-002)", async (t) => {
  const setTime = useClock(t, at(14, 7));
  const slow = deferred();
  const app = await bootApp({ route: () => slow.promise });
  await app.setPosition();
  await app.chooseDestination();
  setTime(at(14, 9)); // routing took 2 minutes
  slow.resolve(osrmJson(routesWith([1500])));
  await settle();
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 25 min, arrive 14:34"]);
});

test("Edge: a route with a missing duration has no arrival suffix; the others keep theirs", async (t) => {
  useClock(t, at(14, 7));
  const routes = routesWith([1500, 1800]);
  routes.push({ ...routesWith([0, 0, 0])[2], duration: null });
  const app = await showRoutes({ route: () => osrmJson(routes) });
  const titles = app.routeTitles();
  assert.equal(titles.length, 3);
  const withArrival = titles.filter((s) => s.includes(", arrive "));
  assert.deepEqual(withArrival.sort(), [
    "Route 2 · 2.10 km · 25 min, arrive 14:32",
    "Route 3 · 2.20 km · 30 min, arrive 14:37",
  ]);
  const without = titles.filter((s) => !s.includes("arrive"));
  assert.equal(without.length, 1);
  assert.ok(!/NaN|undefined|null/.test(without[0]), without[0]);
});

test("FR-006 / FR-011: status summary unchanged, no extra mark, arrival inside the title span", async (t) => {
  useClock(t, at(14, 7));
  const app = await bootApp({ route: () => osrmJson(routesWith([1500, 1800, 2100])) });
  await app.setPosition();
  await app.setMode("car");
  await app.chooseDestination();
  assert.equal(app.status(), "3 driving routes · fastest 2.10 km · 25 min");
  for (const [i, b] of app.routeButtons().entries()) {
    assert.equal(b.elementChildren.length, 1, "car route button holds only the title span");
    assert.match(b.elementChildren[0].textContent, /, arrive \d\d:\d\d$/);
    assert.ok(!/first|earliest|fastest/i.test(b.textContent), `no earliest-arrival mark on route ${i + 1}`);
    assert.ok(!b.className.includes("first") && !b.className.includes("earliest"));
  }
});

test("FR-008: the arrival text is part of the route button's accessible name", async (t) => {
  useClock(t, at(14, 7));
  const app = await showRoutes({ route: () => osrmJson(routesWith([1500])) });
  const [b] = app.routeButtons();
  assert.equal(b.getAttribute("aria-label"), null, "no aria-label overrides the button text");
  assert.ok(b.textContent.includes("25 min, arrive 14:32"), b.textContent);
});

test("FR-007: when the next computation finds no route, no arrival time is left", async (t) => {
  const setTime = useClock(t, at(14, 7));
  const app = await showRoutes({
    route: (url) => (url.includes("routed-car") ? { code: "NoRoute", routes: [] } : osrmJson(routesWith([1500]))),
  });
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 25 min, arrive 14:32"]);
  setTime(at(14, 10));
  await app.setMode("car");
  assert.equal(app.routeTitles().length, 0);
  assert.equal(app.status(), "No driving route found.");
  assert.ok(!app.panelText().includes("arrive"));
});

test("FR-007: when the next computation fails, no arrival time is left", async (t) => {
  const setTime = useClock(t, at(14, 7));
  const app = await showRoutes({
    route: (url) => {
      if (url.includes("routed-car")) throw new Error("offline");
      return osrmJson(routesWith([1500]));
    },
  });
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 25 min, arrive 14:32"]);
  setTime(at(14, 10));
  await app.setMode("car");
  assert.equal(app.routeTitles().length, 0);
  assert.match(app.status(), /^Routing failed/);
  assert.ok(!app.panelText().includes("arrive"));
});

// ------------------------------------------------- US2: arrival time refreshes on recomputation

test("US2 scenario 1: switching the travel mode at 14:12 uses 14:12 + the new durations (FR-005, SC-003)", async (t) => {
  const setTime = useClock(t, at(14, 7));
  const app = await showRoutes({
    route: (url) => osrmJson(routesWith(url.includes("routed-car") ? [600, 720] : [1500, 1800])),
  });
  assert.deepEqual(app.routeTitles(), [
    "Route 1 · 2.10 km · 25 min, arrive 14:32",
    "Route 2 · 2.20 km · 30 min, arrive 14:37",
  ]);
  setTime(at(14, 12));
  await app.setMode("car");
  assert.deepEqual(app.routeTitles(), [
    "Route 1 · 2.10 km · 10 min, arrive 14:22",
    "Route 2 · 2.20 km · 12 min, arrive 14:24",
  ]);
});

test("US2 scenario 2: adding a stop uses the new longer duration and the recomputation time (FR-005)", async (t) => {
  const setTime = useClock(t, at(14, 7));
  const app = await showRoutes({
    route: (url) => osrmJson(routesWith(url.split(";").length > 2 ? [2400] : [1500])),
  });
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 25 min, arrive 14:32"]);
  setTime(at(14, 15));
  await app.search();
  await app.addStopFromResult(1);
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 40 min, arrive 14:55"]);
});

test("US2: reordering, removing and clearing stops refresh the arrival times (FR-005)", async (t) => {
  const setTime = useClock(t, at(14, 0));
  // Duration grows with the number of points; reordering changes the first stop.
  const app = await showRoutes({
    route: (url) => {
      const pts = url.split("?")[0].split("/").pop().split(";");
      const extra = pts[1]?.startsWith("2.352") ? 60 : 0;
      return osrmJson(routesWith([600 * pts.length + extra]));
    },
  });
  await app.search();
  await app.addStopFromResult(1);
  await app.search();
  await app.addStopFromResult(2);
  setTime(at(15, 0));
  app.stopButtons(1)[0].click(); // move stop 2 up
  await settle();
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 41 min, arrive 15:41"]);
  setTime(at(16, 0));
  app.stopButtons(0)[2].click(); // remove stop 1
  await settle();
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 30 min, arrive 16:30"]);
  setTime(at(17, 0));
  await app.clearStops();
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 20 min, arrive 17:20"]);
});

test("US2: choosing a new destination refreshes the arrival times (FR-005)", async (t) => {
  const setTime = useClock(t, at(14, 7));
  const app = await showRoutes({ route: () => osrmJson(routesWith([1500])) });
  setTime(at(14, 30));
  await app.chooseDestination(2);
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 25 min, arrive 14:55"]);
});

test("US2: the location becoming available for a waiting route uses that moment (FR-005)", async (t) => {
  const setTime = useClock(t, at(14, 7));
  const app = await bootApp({ route: () => osrmJson(routesWith([1500])) });
  await app.chooseDestination(); // no position yet: the route waits
  assert.equal(app.routeTitles().length, 0);
  setTime(at(14, 20));
  await app.setPosition();
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 25 min, arrive 14:45"]);
});

test("US2 / FR-010: later position changes do not recompute or change the arrival times", async (t) => {
  const setTime = useClock(t, at(14, 7));
  const app = await showRoutes({ route: () => osrmJson(routesWith([1500])) });
  const calls = app.world.routeCalls.length;
  setTime(at(14, 20));
  await app.setPosition({ lat: 48.851, lng: 2.351 });
  assert.equal(app.world.routeCalls.length, calls, "no new routing request");
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 25 min, arrive 14:32"]);
});

test("US2 / edge: the passage of time alone does not change the arrival times", async (t) => {
  const setTime = useClock(t, at(14, 7));
  const app = await showRoutes({ route: () => osrmJson(routesWith([1500])) });
  setTime(at(14, 40));
  await settle(50);
  assert.deepEqual(app.routeTitles(), ["Route 1 · 2.10 km · 25 min, arrive 14:32"]);
});

test("US2 / SC-003: old arrivals vanish when a recomputation starts; a superseded result shows none", async (t) => {
  const setTime = useClock(t, at(14, 7));
  const pending = [];
  const app = await bootApp({
    route: () => {
      const d = deferred();
      pending.push(d);
      return d.promise;
    },
  });
  await app.setPosition();
  await app.chooseDestination();
  pending[0].resolve(osrmJson(routesWith([1500, 1800]))); // 2 walking routes: no detour requests
  await settle();
  assert.deepEqual(app.routeTitles(), [
    "Route 1 · 2.10 km · 25 min, arrive 14:32",
    "Route 2 · 2.20 km · 30 min, arrive 14:37",
  ]);

  setTime(at(14, 10));
  await app.setMode("car"); // request 2 (will be superseded)
  assert.equal(app.routeTitles().length, 0, "previous arrivals removed at once");
  setTime(at(14, 11));
  await app.setMode("foot"); // request 3 (latest)
  setTime(at(14, 12));
  pending[2].resolve(osrmJson(routesWith([1800, 2100])));
  await settle();
  setTime(at(14, 13));
  pending[1].resolve(osrmJson(routesWith([600]))); // late, superseded answer
  await settle();
  assert.deepEqual(app.routeTitles(), [
    "Route 1 · 2.10 km · 30 min, arrive 14:42",
    "Route 2 · 2.20 km · 35 min, arrive 14:47",
  ]);
});
