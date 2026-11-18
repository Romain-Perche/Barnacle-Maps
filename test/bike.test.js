// SF-72 Bicycle travel mode. Contract tests for TRAVEL_MODES / routeUrl
// (specs/sf-72-bycicle-track/contracts/travel-modes.md), requests checked against the OSRM docs through
// the fake in test/fakes/osrm.js, and source/markup checks for the selector, the app wiring and the README.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as geo from "../src/geo.js";
import { parseRoutes, pickRoutes, routeUrl, TRAVEL_MODES } from "../src/geo.js";
import { checkRouteRequest, loadOsrmSchema, routeResponse } from "./fakes/osrm.js";

const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

const from = { lat: 48.85, lng: 2.35 };
const to = { lat: 48.86, lng: 2.36 };
const COORDS = "2.35,48.85;2.36,48.86";
const Q = "?overview=full&geometries=geojson";
const BIKE_BASE = "https://routing.openstreetmap.de/routed-bike";
const BIKE = `${BIKE_BASE}/route/v1/bike/${COORDS}${Q}`;
const s1 = { name: "A", lat: 48.852, lng: 2.352 };
const s2 = { name: "B", lat: 48.855, lng: 2.355 };

const schema = loadOsrmSchema();
const NO_SCHEMA = schema ? false : "OSRM docs missing: .factory/schemas/osrm-http.md (see .factory/test-env.md)";

// --- §1 Contract: TRAVEL_MODES ---------------------------------------------------------------

// covers FR-002, FR-005, FR-006, US1 scenario 2, 6
test("§1 bike entry: label, icon, OSRM bike server and profile, pleasure on, no detours", () => {
  assert.deepEqual(TRAVEL_MODES.bike, {
    label: "Bike",
    icon: "🚲",
    base: BIKE_BASE,
    profile: "bike",
    pleasure: true,
    detours: false,
  });
});

// covers SC-004, FR-005 (car without pleasure), FR-006 (detours walking-only)
test("§1 foot and car keep their routing and get icon/pleasure/detours flags", () => {
  assert.deepEqual(TRAVEL_MODES.foot, {
    label: "Walk",
    icon: "🚶",
    base: "https://routing.openstreetmap.de/routed-foot",
    profile: "foot",
    pleasure: true,
    detours: true,
  });
  assert.deepEqual(TRAVEL_MODES.car, {
    label: "Car",
    icon: "🚗",
    base: "https://routing.openstreetmap.de/routed-car",
    profile: "driving",
    pleasure: false,
    detours: false,
  });
});

// covers FR-001 (Walk, Car, Bike in that order)
test("§1 TRAVEL_MODES key order is foot, car, bike", () => {
  assert.deepEqual(Object.keys(TRAVEL_MODES), ["foot", "car", "bike"]);
});

// covers FR-005, FR-006
test("§1 pleasure for foot and bike only; detours for foot only", () => {
  const keys = Object.keys(TRAVEL_MODES);
  assert.deepEqual(keys.filter((k) => TRAVEL_MODES[k].pleasure), ["foot", "bike"]);
  assert.deepEqual(keys.filter((k) => TRAVEL_MODES[k].detours), ["foot"]);
});

// --- §2 Contract: routeUrl for bike ----------------------------------------------------------

// covers FR-002, US1 scenario 2
test("§2 routeUrl bike mode uses the OSRM bike server and bike profile", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "bike" }), BIKE);
});

// covers FR-003 (up to 3 routes)
test("§2 routeUrl bike mode asks for alternatives", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "bike", alternatives: 3 }), `${BIKE}&alternatives=3`);
});

// covers FR-009, US3 scenario 1: through every stop, in list order
test("§2 routeUrl bike mode visits the stops in list order", () => {
  assert.equal(
    routeUrl(from, to, undefined, { mode: "bike", stops: [s1, s2] }),
    `${BIKE_BASE}/route/v1/bike/2.35,48.85;2.352,48.852;2.355,48.855;2.36,48.86${Q}`,
  );
  assert.equal(
    routeUrl(from, to, undefined, { mode: "bike", stops: [s2, s1], alternatives: 3 }),
    `${BIKE_BASE}/route/v1/bike/2.35,48.85;2.355,48.855;2.352,48.852;2.36,48.86${Q}&alternatives=3`,
  );
});

// covers FR-002 (explicit base keeps the bike profile)
test("§2 routeUrl bike mode with an explicit base keeps the base and uses the bike profile", () => {
  assert.equal(
    routeUrl(from, to, "https://example.test", { mode: "bike" }),
    `https://example.test/route/v1/bike/${COORDS}${Q}`,
  );
});

// covers FR-008, US2 scenario 1, 2, US3 scenario 2: same points and stops, only server/profile change
test("§2 switching mode keeps the same points and changes only the server and profile", () => {
  const urls = ["foot", "car", "bike"].map((mode) => routeUrl(from, to, undefined, { mode, stops: [s1], alternatives: 3 }));
  assert.equal(new Set(urls).size, 3);
  for (const u of urls) assert.ok(u.endsWith(`/2.35,48.85;2.352,48.852;2.36,48.86${Q}&alternatives=3`), u);
  assert.ok(urls[2].startsWith(`${BIKE_BASE}/route/v1/bike/`));
});

// --- OSRM docs: every bike request the app sends is a valid route request ----------------------

// covers FR-002, FR-003, FR-009: the requests are accepted by the documented OSRM route service
test("OSRM docs accept every bike request the app builds", { skip: NO_SCHEMA }, () => {
  const requests = [
    routeUrl(from, to, undefined, { mode: "bike" }),
    routeUrl(from, to, undefined, { mode: "bike", alternatives: 3 }),
    routeUrl(from, to, undefined, { mode: "bike", alternatives: 3, stops: [s1, s2] }),
  ];
  for (const url of requests) {
    const r = checkRouteRequest(url, schema);
    assert.equal(r.base, BIKE_BASE, url);
    assert.equal(r.profile, "bike", url);
    assert.deepEqual(r.coords[0], [2.35, 48.85], "coordinates are {longitude},{latitude}");
  }
});

// The fake must catch a wrong field name or value, or it proves nothing.
test("OSRM fake refuses an unknown option, a bad value and swapped coordinates", { skip: NO_SCHEMA }, () => {
  assert.throws(() => checkRouteRequest(`${BIKE_BASE}/route/v1/bike/${COORDS}?alternative=3`, schema), /alternative/);
  assert.throws(() => checkRouteRequest(`${BIKE_BASE}/route/v1/bike/${COORDS}?geometries=json`, schema), /geometries/);
  assert.throws(() => checkRouteRequest(`${BIKE_BASE}/route/v1/bike/48.85,182.35;2.36,48.86`, schema), /latitude/); // lat,lng order: 182.35 read as latitude
});

// covers FR-003, US1 scenario 2: a documented bike response gives up to 3 routes, fastest first
test("documented bike response: up to 3 routes, fastest first", { skip: NO_SCHEMA }, () => {
  const { coords, profile } = checkRouteRequest(routeUrl(from, to, undefined, { mode: "bike", alternatives: 3 }), schema);
  assert.equal(profile, "bike", "the request goes to the bike profile");
  const mid = (dLng, dLat) => [coords[0], [2.355 + dLng, 48.855 + dLat], coords[1]];
  const json = routeResponse(coords, [
    { distance: 1500, duration: 330, coordinates: mid(0.003, -0.003) },
    { distance: 1400, duration: 300, coordinates: mid(0, 0) },
    { distance: 1600, duration: 360, coordinates: mid(-0.003, 0.003) },
  ]);
  const routes = pickRoutes(parseRoutes(json));
  assert.ok(routes.length >= 1 && routes.length <= 3);
  assert.equal(routes[0].duration, 300);
  assert.deepEqual(parseRoutes(routeResponse(coords, [])), []); // NoRoute → "No cycling route found."
});

// covers FR-007, US1 scenario 5, edge case "roads closed to bicycles": OSRM answers "no route" with
// HTTP 400 and code NoRoute (or NoSegment when a point cannot snap to a bike road). The app must show
// "No cycling route found.", not "Routing failed".
test("isNoRouteResponse: NoRoute and NoSegment mean no route; other errors do not", { skip: NO_SCHEMA }, () => {
  assert.equal(typeof geo.isNoRouteResponse, "function", "src/geo.js exports isNoRouteResponse");
  const { coords } = checkRouteRequest(routeUrl(from, to, undefined, { mode: "bike" }), schema);
  assert.equal(geo.isNoRouteResponse(routeResponse(coords, [])), true);
  assert.equal(geo.isNoRouteResponse({ code: "NoSegment", message: "Could not find a matching segment" }), true);
  for (const code of ["InvalidQuery", "InvalidValue", "TooBig", "Ok"]) {
    assert.equal(geo.isNoRouteResponse({ code }), false, code);
  }
  for (const bad of [null, undefined, "NoRoute", {}]) assert.equal(geo.isNoRouteResponse(bad), false);
});

// covers FR-007, US1 scenario 5: the routing fetch reads the 400 body instead of failing
test("§5 app.js uses isNoRouteResponse for routing errors", () => {
  const a = read("src/app.js");
  assert.match(a, /\bisNoRouteResponse\b/);
});

// --- §3 Selector markup (design C) -----------------------------------------------------------

// covers FR-001, US1 scenario 1
test("§3 index.html: one radiogroup with Walk, Car, Bike segments, Walk checked, emoji hidden from AT", () => {
  const h = read("index.html");
  const m = h.match(/<div id="mode" role="radiogroup" aria-label="Travel mode">([\s\S]*?)<\/div>/);
  assert.ok(m, "#mode radiogroup present");
  const group = m[1];
  const radios = [...group.matchAll(/<input type="radio" name="mode" value="(\w+)"( checked)?>/g)];
  assert.deepEqual(radios.map((r) => r[1]), ["foot", "car", "bike"]);
  assert.deepEqual(radios.map((r) => Boolean(r[2])), [true, false, false]);
  for (const [icon, label] of [["🚶", "Walk"], ["🚗", "Car"], ["🚲", "Bike"]]) {
    assert.ok(group.includes(`<span><span aria-hidden="true">${icon}</span> ${label}</span>`), `${icon} ${label}`);
  }
});

// --- §4 Selector styling ---------------------------------------------------------------------

// covers FR-001: segmented look, highlighted selection, visible focus, inputs still focusable
test("§4 styles.css: #mode is a segmented control with checked and focus styles", () => {
  const c = read("styles.css");
  assert.match(c, /#mode\s*\{[^}]*border:\s*1px solid #1a73e8/);
  assert.match(c, /#mode\s*\{[^}]*display:\s*flex/);
  assert.match(c, /#mode input:checked \+ span\s*\{[^}]*background:\s*#1a73e8/);
  assert.match(c, /#mode input:checked \+ span\s*\{[^}]*color:\s*#fff/);
  assert.match(c, /#mode input:focus-visible \+ span\s*\{[^}]*outline/);
  assert.doesNotMatch(c, /#mode input\s*\{[^}]*display:\s*none/);
});

// covers FR-001: "🚶 Walk" stays on one line. Display/padding must target only the outer span;
// a descendant `#mode span` rule also hits the nested icon span (the reverted SF-70 bug).
test("§4 styles.css: segment padding does not apply to the nested icon span", () => {
  const c = read("styles.css").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, sel, body] of c.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    for (const one of sel.split(",").map((x) => x.trim())) {
      if (!/^#mode\b/.test(one) || !/\bspan$/.test(one)) continue;
      const outerOnly = /(\+|>)\s*span$/.test(one);
      assert.ok(outerOnly || !/(display|padding)\s*:/.test(body),
        `"${one}" sets display/padding on every span inside #mode, including the icon; use "#mode input + span"`);
    }
  }
  assert.match(c, /#mode input \+ span\s*\{[^}]*padding/);
});

// --- §5 App wiring and texts (src/app.js has no DOM harness: source checks) --------------------

// covers FR-007, US1 scenario 4, 5: cycling texts
test("§5 app.js has the cycling texts in MODE_TEXT", () => {
  const a = read("src/app.js");
  assert.match(a, /\bMODE_TEXT\b/);
  for (const s of ["Computing cycling routes…", "No cycling route found.", '"by bike"', '"cycling"']) {
    assert.ok(a.includes(s), s);
  }
});

// covers SC-004: Walk and Car texts are unchanged
test("§5 app.js keeps today's Walk and Car texts", () => {
  const a = read("src/app.js");
  for (const s of ["Computing walking routes…", "No walking route found.", '"on foot"', '"walking"',
    "Computing driving routes…", "No driving route found.", '"by car"', '"driving"']) {
    assert.ok(a.includes(s), s);
  }
});

// covers FR-005, FR-006, FR-007: behaviour comes from TRAVEL_MODES flags, not from mode-name checks
test("§5 app.js reads the pleasure/detours flags instead of comparing mode names", () => {
  const a = read("src/app.js");
  assert.doesNotMatch(a, /\bm\s*[!=]==\s*"(foot|car|bike)"/);
  assert.match(a, /TRAVEL_MODES\[m\]\.detours/);
  assert.match(a, /TRAVEL_MODES\[m\]\.pleasure/);
});

// covers FR-005, US1 scenario 6: the explanation refers to the route, not only to a walk
test("§5 app.js pleasure tooltip refers to the route", () => {
  const a = read("src/app.js");
  assert.ok(a.includes("Green pixels (parks, grass, woods) on the map along this route; more is more pleasant"));
  assert.ok(!a.includes("along this walk"));
});

// --- Documentation ---------------------------------------------------------------------------

// covers FR-011
test("README mentions Bike mode, its routing source and pleasure for walking and bike", () => {
  const r = read("README.md");
  assert.match(r, /\bbike\b/i);
  assert.ok(r.includes("routed-bike"));
  assert.match(r, /walking and bike/i);
  assert.ok(!r.includes("(walking only)"));
});
