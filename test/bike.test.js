// SF-70 Bicycle travel mode. Contract tests for TRAVEL_MODES / routeUrl (specs/sf-70-bicycle-track/contracts/travel-modes.md)
// and markup/source checks for the selector, the app wiring and the README.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { routeUrl, TRAVEL_MODES } from "../src/geo.js";

const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

const from = { lat: 48.85, lng: 2.35 };
const to = { lat: 48.86, lng: 2.36 };
const COORDS = "2.35,48.85;2.36,48.86";
const Q = "?overview=full&geometries=geojson";
const BIKE = `https://routing.openstreetmap.de/routed-bike/route/v1/bike/${COORDS}${Q}`;
const s1 = { lat: 48.852, lng: 2.352 };
const s2 = { lat: 48.855, lng: 2.355 };

// --- Contract: TRAVEL_MODES -------------------------------------------------------------------

// covers FR-002, FR-005, FR-006, FR-007, US1 scenario 4, 5, 6
test("bike mode entry: label, icon, OSRM bike server, pleasure on, no detours, cycling texts", () => {
  assert.deepEqual(TRAVEL_MODES.bike, {
    label: "Bike",
    icon: "🚲",
    base: "https://routing.openstreetmap.de/routed-bike",
    profile: "bike",
    pleasure: true,
    detours: false,
    computing: "Computing cycling routes…",
    noRoute: "No cycling route found.",
    single: "by bike",
    plural: "cycling",
  });
});

// covers SC-004, FR-005 (car without pleasure), FR-006 (detours walking-only): today's texts unchanged
test("foot and car entries keep their routing and reproduce today's texts", () => {
  assert.deepEqual(TRAVEL_MODES.foot, {
    label: "Walk",
    icon: "🚶",
    base: "https://routing.openstreetmap.de/routed-foot",
    profile: "foot",
    pleasure: true,
    detours: true,
    computing: "Computing walking routes…",
    noRoute: "No walking route found.",
    single: "on foot",
    plural: "walking",
  });
  assert.deepEqual(TRAVEL_MODES.car, {
    label: "Car",
    icon: "🚗",
    base: "https://routing.openstreetmap.de/routed-car",
    profile: "driving",
    pleasure: false,
    detours: false,
    computing: "Computing driving routes…",
    noRoute: "No driving route found.",
    single: "by car",
    plural: "driving",
  });
});

// covers FR-001 (Walk, Car, Bike in that order)
test("TRAVEL_MODES order is foot, car, bike", () => {
  assert.deepEqual(Object.keys(TRAVEL_MODES), ["foot", "car", "bike"]);
});

// covers FR-006: only walking forces detours
test("only walking forces detours", () => {
  const withDetours = Object.keys(TRAVEL_MODES).filter((k) => TRAVEL_MODES[k].detours);
  assert.deepEqual(withDetours, ["foot"]);
});

// covers FR-005: pleasure indicator for walking and bike, not car
test("pleasure indicator applies to foot and bike only", () => {
  const withPleasure = Object.keys(TRAVEL_MODES).filter((k) => TRAVEL_MODES[k].pleasure).sort();
  assert.deepEqual(withPleasure, ["bike", "foot"]);
});

// --- Contract: routeUrl for bike --------------------------------------------------------------

// covers FR-002, US1 scenario 2
test("routeUrl bike mode uses the OSRM bike server and bike profile", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "bike" }), BIKE);
});

// covers FR-003, US1 scenario 2 (up to 3 routes)
test("routeUrl bike mode asks for alternatives", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "bike", alternatives: 3 }), `${BIKE}&alternatives=3`);
});

// covers FR-002 (explicit base keeps the bike profile)
test("routeUrl bike mode with an explicit base keeps the base and uses the bike profile", () => {
  assert.equal(
    routeUrl(from, to, "https://example.test", { mode: "bike" }),
    `https://example.test/route/v1/bike/${COORDS}${Q}`,
  );
});

// covers FR-009, US3 scenario 1: through every stop, in list order
test("routeUrl bike mode visits the stops in list order", () => {
  assert.equal(
    routeUrl(from, to, undefined, { mode: "bike", stops: [s1, s2] }),
    `https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.352,48.852;2.355,48.855;2.36,48.86${Q}`,
  );
  assert.equal(
    routeUrl(from, to, undefined, { mode: "bike", stops: [s2, s1], alternatives: 3 }),
    `https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.355,48.855;2.352,48.852;2.36,48.86${Q}&alternatives=3`,
  );
});

// covers FR-008, US2 scenario 1, 2, US3 scenario 2: same destination and stops, one distinct server per mode
test("switching mode keeps the same points and changes only the server and profile", () => {
  const urls = ["foot", "car", "bike"].map((mode) => routeUrl(from, to, undefined, { mode, stops: [s1], alternatives: 3 }));
  assert.equal(new Set(urls).size, 3);
  const pts = "2.35,48.85;2.352,48.852;2.36,48.86";
  for (const u of urls) assert.ok(u.endsWith(`/${pts}${Q}&alternatives=3`), u);
  assert.ok(urls[2].startsWith("https://routing.openstreetmap.de/routed-bike/route/v1/bike/"));
});

// --- Selector markup (design C) ---------------------------------------------------------------

// covers FR-001, US1 scenario 1
test("index.html: one radiogroup with Walk, Car, Bike segments, Walk checked, emoji hidden from AT", () => {
  const h = read("index.html");
  const m = h.match(/<div id="mode" role="radiogroup" aria-label="Travel mode">([\s\S]*?)<\/div>/);
  assert.ok(m, "#mode radiogroup present");
  const group = m[1];
  const radios = [...group.matchAll(/<input type="radio" name="mode" value="(\w+)"( checked)?>/g)];
  assert.deepEqual(radios.map((r) => r[1]), ["foot", "car", "bike"]);
  assert.deepEqual(radios.map((r) => Boolean(r[2])), [true, false, false]);
  for (const [icon, label] of [["🚶", "Walk"], ["🚗", "Car"], ["🚲", "Bike"]]) {
    assert.ok(group.includes(`<span aria-hidden="true">${icon}</span> ${label}</span>`), `${icon} ${label}`);
  }
});

// covers FR-001: segmented look, highlighted selection, focus visible, inputs still focusable
test("styles.css: #mode is a segmented control with checked and focus styles", () => {
  const c = read("styles.css");
  assert.match(c, /#mode\s*\{[^}]*border:\s*1px solid #dadce0/);
  assert.match(c, /#mode input:checked \+ span\s*\{[^}]*background:\s*#e8f0fe/);
  assert.match(c, /#mode input:checked \+ span\s*\{[^}]*color:\s*#1a73e8/);
  assert.match(c, /#mode input:focus-visible \+ span\s*\{[^}]*outline/);
  assert.doesNotMatch(c, /#mode input\s*\{[^}]*display:\s*none/);
});

// --- App wiring (src/app.js has no DOM test harness: source checks) ---------------------------

// covers FR-005, FR-006, FR-007, US1 scenario 4: behaviour comes from TRAVEL_MODES, not from hard-coded mode names
test("app.js reads mode behaviour from TRAVEL_MODES instead of comparing mode names", () => {
  const a = read("src/app.js");
  assert.doesNotMatch(a, /\bm\s*[!=]==\s*"(foot|car|bike)"/);
  for (const s of [".detours", ".pleasure", ".computing", ".noRoute", ".single", ".plural"]) {
    assert.ok(a.includes(s), s);
  }
});

// covers FR-005, US1 scenario 6: the explanation refers to the route, not only to a walk
test("app.js pleasure tooltip refers to the route", () => {
  const a = read("src/app.js");
  assert.ok(a.includes("Green pixels (parks, grass, woods) on the map along this route; more is more pleasant"));
  assert.ok(!a.includes("along this walk"));
});

// --- Documentation ----------------------------------------------------------------------------

// covers FR-011
test("README mentions Bike mode, its routing source and pleasure for walking and bike", () => {
  const r = read("README.md");
  assert.match(r, /\bbike\b/i);
  assert.ok(r.includes("routed-bike"));
  assert.match(r, /walking (and|or) bike/i);
  assert.ok(!r.includes("(walking only)"));
});
