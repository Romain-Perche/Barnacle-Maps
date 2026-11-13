// Integration tests for the route summary bar (PILOT-73195): drive the real src/app.js and
// index.html through a fake browser (test/helpers/fake-browser.js) and check #route-card.
// Contract: specs/pilot-73195-summary-card-for-the-selected-route/contracts/route-card-ui.md
import test, { afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { boot, flush, osrm } from "./helpers/fake-browser.js";

const FROM = [48.85, 2.35];
const TO = [48.86, 2.36];
// Three distinct walking routes (fastest first once sorted). Panel: "2.35 km · 25 min", "2.60 km · 29 min", "3.00 km · 35 min".
const FOOT = [
  { distance: 2350, duration: 1500, path: [FROM, [48.86, 2.35], TO] },
  { distance: 2600, duration: 1740, path: [FROM, [48.85, 2.36], TO] },
  { distance: 3000, duration: 2100, path: [FROM, [48.855, 2.355], TO] },
];
const CAR = [{ distance: 4100, duration: 600, path: [FROM, [48.852, 2.37], TO] }]; // "4.10 km · 10 min"
const VIA_STOP = [{ distance: 3200, duration: 2400, path: [FROM, [48.855, 2.355], TO] }]; // "3.20 km · 40 min"

const pad = (n) => String(n).padStart(2, "0");
// "Arrive HH:MM" in either clock style (the app follows the device locale), with optional suffix.
function arriveRe(h, m, suffix = "") {
  const h12 = ((h + 11) % 12) + 1;
  const ap = h < 12 ? "AM" : "PM";
  const s = suffix ? `\\s${suffix.replace("+", "\\+")}` : "";
  return new RegExp(`^Arrive (${pad(h)}:${pad(m)}|${h}:${pad(m)}|${h12}:${pad(m)}\\s?${ap})${s}$`);
}

function card(app) {
  const el = app.$("route-card");
  assert.ok(el, "#route-card exists in index.html");
  const part = (c) => {
    const p = el.querySelector(c);
    assert.ok(p, `#route-card ${c} exists`);
    return p.textContent;
  };
  return {
    el,
    hidden: el.hidden,
    duration: () => part(".rc-duration"),
    distance: () => part(".rc-distance"),
    arrival: () => part(".rc-arrival"),
  };
}

// Boots the app at 14:10:00 local time (2026-11-13), with a position and the walking routes.
async function withRoutes({ now = new Date(2026, 10, 13, 14, 10, 0), routes = FOOT } = {}) {
  mock.timers.enable({ apis: ["setTimeout", "setInterval", "Date"], now: now.getTime() });
  const app = await boot();
  app.net.route = (u) => (u.includes("car") ? osrm(CAR) : osrm(routes));
  app.setPosition(...FROM);
  await app.searchAndPick();
  assert.equal(app.routeButtons().length, routes.length, "routes are drawn in the panel");
  return app;
}

afterEach(() => mock.timers.reset());

// --- Before any route --------------------------------------------------------------------------

test("FR-007: the bar is hidden before any search", async () => {
  // covers FR-007 (before any search), SC-005
  mock.timers.enable({ apis: ["setTimeout", "setInterval", "Date"], now: Date.UTC(2026, 10, 13, 13, 10) });
  const app = await boot();
  app.setPosition(...FROM);
  await flush();
  assert.equal(card(app).hidden, true);
});

// --- US1: see the selected route's key figures --------------------------------------------------

test("US1 scenario 1: routes displayed -> bar shows route 1's distance, duration and arrival", async () => {
  // covers FR-001, FR-002, US1 scenario 1, SC-001
  const app = await withRoutes();
  const c = card(app);
  assert.equal(c.hidden, false, "bar visible once routes are shown");
  assert.equal(c.duration(), "25 min");
  assert.equal(c.distance(), "2.35 km");
  assert.match(c.arrival(), /^Arrive \S/);
});

test("US1 scenario 2: bar distance and duration equal the panel entry of the selected route", async () => {
  // covers FR-003, US1 scenario 2, SC-003
  const app = await withRoutes();
  const c = card(app);
  const panel = app.panelFigures(0);
  assert.equal(c.distance(), panel.distance);
  assert.equal(c.duration(), panel.duration);
});

test("US1 scenario 3: 25 min route selected at 14:10 -> arrival reads 14:35", async () => {
  // covers FR-004, US1 scenario 3
  const app = await withRoutes();
  assert.match(card(app).arrival(), arriveRe(14, 35));
});

test("FR-005 edge case: arrival on the next day shows +1 day", async () => {
  // covers FR-005, edge case "arrival on a later day"
  const app = await withRoutes({ now: new Date(2026, 10, 13, 23, 50, 0) });
  assert.match(card(app).arrival(), arriveRe(0, 15, "+1 day"));
});

test("FR-009 edge case: fitting the map reserves room for the bar at the bottom", async () => {
  // covers FR-009, edge case "small screens: does not hide start or destination"
  const app = await withRoutes();
  const opts = app.map.fitCalls.at(-1) || {};
  const top = (opts.paddingTopLeft || opts.padding || [0, 0])[1];
  const bottom = (opts.paddingBottomRight || opts.padding || [0, 0])[1];
  assert.ok(bottom > top, `bottom padding ${bottom} should exceed top padding ${top}`);
});

// --- US2: bar follows the selected route ---------------------------------------------------------

test("US2 scenario 1: selecting route 2 in the panel updates the bar", async () => {
  // covers FR-006, US2 scenario 1, SC-002
  const app = await withRoutes();
  app.routeButtons()[1].click();
  const c = card(app);
  const panel = app.panelFigures(1);
  assert.equal(c.duration(), panel.duration);
  assert.equal(c.distance(), panel.distance);
  assert.equal(c.duration(), "29 min");
  assert.match(c.arrival(), arriveRe(14, 39));
});

test("US2 scenario 2: clicking route 3 on the map updates the bar", async () => {
  // covers FR-006, US2 scenario 2, SC-002
  const app = await withRoutes();
  const lines = app.drawnLines();
  assert.equal(lines.length, 3);
  // The third drawn line is route 3 (the panel order equals the drawing order).
  lines[2].fire("click");
  const c = card(app);
  assert.equal(c.duration(), "35 min");
  assert.equal(c.distance(), "3.00 km");
  assert.match(c.arrival(), arriveRe(14, 45));
});

test("US2 scenario 3: re-selecting the same route keeps the same content", async () => {
  // covers FR-006, US2 scenario 3
  const app = await withRoutes();
  app.routeButtons()[1].click();
  const before = [card(app).duration(), card(app).distance(), card(app).arrival()];
  app.routeButtons()[1].click();
  assert.deepEqual([card(app).duration(), card(app).distance(), card(app).arrival()], before);
  assert.equal(card(app).hidden, false);
});

test("FR-010: a selection change is announced politely; the minute refresh is not", async () => {
  // covers FR-010, US2 scenario 1 (announcement)
  const app = await withRoutes();
  const live = app.$("route-card-live");
  assert.ok(live, "#route-card-live exists");
  assert.equal(live.getAttribute("aria-live"), "polite");
  app.routeButtons()[1].click();
  assert.match(live.textContent, /Route 2/);
  assert.match(live.textContent, /29 min/);
  assert.match(live.textContent, /2\.60 km/);
  const writes = live.textWrites;
  mock.timers.tick(61_000);
  await flush();
  assert.equal(live.textWrites, writes, "minute tick must not write the live region");
});

// --- US3: accurate and out of the way -----------------------------------------------------------

test("US3 scenario 1: the bar hides while a new route request loads", async () => {
  // covers FR-007 (loading / cleared), US3 scenario 1, SC-005
  const app = await withRoutes();
  app.net.hold();
  await app.setMode("car");
  assert.equal(card(app).hidden, true, "hidden while loading");
  app.net.release();
  await flush();
  assert.equal(card(app).hidden, false, "shown again once new routes are displayed");
});

test("US3 scenario 2: routing fails -> no bar", async () => {
  // covers FR-007 (routing fails), US3 scenario 2, SC-005
  const app = await withRoutes();
  app.net.route = () => new Error("boom");
  await app.setMode("car");
  assert.equal(card(app).hidden, true);
  assert.match(app.$("status").textContent, /failed|No driving route/);
});

test("US3 scenario 2: routing returns no route -> no bar", async () => {
  // covers FR-007 (no route), US3 scenario 2, SC-005
  const app = await withRoutes();
  app.net.route = () => ({ code: "NoRoute" });
  await app.setMode("car");
  assert.equal(card(app).hidden, true);
  assert.match(app.$("status").textContent, /No driving route found/);
});

test("US3 scenario 3: after a minute passes, the arrival is recomputed", async () => {
  // covers FR-008, US3 scenario 3, SC-004
  const app = await withRoutes();
  assert.match(card(app).arrival(), arriveRe(14, 35));
  mock.timers.tick(61_000); // now 14:11:01
  await flush();
  assert.match(card(app).arrival(), arriveRe(14, 36));
  mock.timers.tick(60_000); // now 14:12:01
  await flush();
  assert.match(card(app).arrival(), arriveRe(14, 37));
});

test("US3 scenario 4: changing the travel mode shows the new selected route", async () => {
  // covers FR-011 (car), US3 scenario 4
  const app = await withRoutes();
  await app.setMode("car");
  const c = card(app);
  assert.equal(c.hidden, false);
  assert.equal(c.duration(), "10 min");
  assert.equal(c.distance(), "4.10 km");
  assert.match(c.arrival(), arriveRe(14, 20));
});

test("US3 scenario 4: adding a stop shows the whole-journey figures", async () => {
  // covers FR-011 (stops), US3 scenario 4, edge case "routes with stops"
  const app = await withRoutes();
  app.net.route = () => osrm(VIA_STOP);
  await app.clickMapAndAddStop(48.855, 2.355);
  const c = card(app);
  assert.equal(c.hidden, false);
  assert.equal(c.duration(), "40 min");
  assert.equal(c.distance(), "3.20 km");
  assert.equal(c.duration(), app.panelFigures(0).duration);
  assert.match(c.arrival(), arriveRe(14, 50));
});
