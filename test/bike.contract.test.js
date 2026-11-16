// Contract tests for the Bicycle Travel Mode (PILOT-45168).
// specs/pilot-45168-bicycle-track/contracts/geo-api.md and contracts/ui.md, data-model.md.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { routeUrl, TRAVEL_MODES } from "../src/geo.js";

const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

const from = { lat: 48.85, lng: 2.35 };
const to = { lat: 48.86, lng: 2.36 };
const s1 = { name: "Bakery", lat: 48.852, lng: 2.37 };
const s2 = { name: "Pharmacy", lat: 48.857, lng: 2.34 };
const BIKE = "https://routing.openstreetmap.de/routed-bike/route/v1/bike";
const Q = "?overview=full&geometries=geojson";

// --- geo-api: TRAVEL_MODES ---------------------------------------------------------------------

// covers FR-003, FR-007, FR-008, FR-009, US1 scenarios 2, 4, 5 (data-model.md TravelMode table)
test("TRAVEL_MODES.bike has the cycling profile and metadata", () => {
  assert.deepEqual(TRAVEL_MODES.bike, {
    label: "Bike",
    icon: "🚲",
    base: "https://routing.openstreetmap.de/routed-bike",
    profile: "bike",
    noun: "cycling",
    by: "by bike",
    pleasure: true,
    detours: false,
  });
});

// covers FR-007, FR-008, FR-009 for walking and car (SC-005: their URLs stay the same)
test("TRAVEL_MODES.foot and .car keep their routing and gain mode metadata", () => {
  assert.deepEqual(TRAVEL_MODES.foot, {
    label: "Walk",
    icon: "🚶",
    base: "https://routing.openstreetmap.de/routed-foot",
    profile: "foot",
    noun: "walking",
    by: "on foot",
    pleasure: true,
    detours: true,
  });
  assert.deepEqual(TRAVEL_MODES.car, {
    label: "Car",
    icon: "🚗",
    base: "https://routing.openstreetmap.de/routed-car",
    profile: "driving",
    noun: "driving",
    by: "by car",
    pleasure: false,
    detours: false,
  });
});

// covers FR-009: the pleasure indicator is on for walk and bike only; FR-008: detours walk only
test("pleasure and detour flags per mode", () => {
  const on = (f) => Object.keys(TRAVEL_MODES).filter((k) => TRAVEL_MODES[k][f]).sort();
  assert.deepEqual(on("pleasure"), ["bike", "foot"]);
  assert.deepEqual(on("detours"), ["foot"]);
});

// --- geo-api: routeUrl -------------------------------------------------------------------------

// covers FR-003, US1 scenario 2
test("routeUrl bike mode uses the OSRM bike server and profile", () => {
  assert.equal(routeUrl(from, to, undefined, { mode: "bike" }), `${BIKE}/2.35,48.85;2.36,48.86${Q}`);
});

// covers FR-004, US1 scenario 2 (up to 3 routes)
test("routeUrl bike mode with alternatives", () => {
  assert.equal(
    routeUrl(from, to, undefined, { mode: "bike", alternatives: 3 }),
    `${BIKE}/2.35,48.85;2.36,48.86${Q}&alternatives=3`,
  );
});

// covers FR-003 (explicit base keeps the base, profile segment is "bike")
test("routeUrl bike mode with an explicit base", () => {
  assert.equal(
    routeUrl(from, to, "https://example.test", { mode: "bike" }),
    `https://example.test/route/v1/bike/2.35,48.85;2.36,48.86${Q}`,
  );
});

// covers FR-005, US2 scenario 2: start -> stops in list order -> destination
test("routeUrl bike mode passes through the stops in list order", () => {
  assert.equal(
    routeUrl(from, to, undefined, { mode: "bike", stops: [s1, s2], alternatives: 3 }),
    `${BIKE}/2.35,48.85;2.37,48.852;2.34,48.857;2.36,48.86${Q}&alternatives=3`,
  );
  assert.equal(
    routeUrl(from, to, undefined, { mode: "bike", stops: [s2, s1] }),
    `${BIKE}/2.35,48.85;2.34,48.857;2.37,48.852;2.36,48.86${Q}`,
  );
});

// --- ui: mode selector (index.html, styles.css) ------------------------------------------------

function modeBlock() {
  const h = read("index.html");
  const m = h.match(/<div[^>]*id="mode"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(m, "index.html has a #mode element");
  return { open: m[0].slice(0, m[0].indexOf(">") + 1), body: m[1] };
}

// covers FR-001, FR-002, US1 scenario 1: three segments in the order Walk, Car, Bike, with icons
test("mode selector has Walk, Car, Bike radios in that order with icons", () => {
  const { open, body } = modeBlock();
  assert.match(open, /role="radiogroup"/);
  assert.match(open, /aria-label="Travel mode"/);
  const labels = [...body.matchAll(/<label>([\s\S]*?)<\/label>/g)].map((x) => x[1]);
  assert.equal(labels.length, 3);
  const expected = [
    ["foot", "🚶", "Walk"],
    ["car", "🚗", "Car"],
    ["bike", "🚲", "Bike"],
  ];
  labels.forEach((l, i) => {
    const [value, icon, text] = expected[i];
    assert.match(l, new RegExp(`<input type="radio" name="mode" value="${value}"`));
    // The icon is decorative: the accessible name stays "Walk" / "Car" / "Bike".
    assert.match(l, new RegExp(`<span aria-hidden="true">${icon}</span>\\s*${text}\\s*$`));
  });
  // FR-002 regression guard on the new markup: Walk is the default and the only checked mode.
  const checked = labels.filter((l) => /<input[^>]*\bchecked\b/.test(l));
  assert.equal(checked.length, 1);
  assert.match(checked[0], /value="foot"/);
});

// covers FR-001: segmented look, selected segment highlighted, keyboard focus visible,
// radios stay focusable (not display:none)
test("mode selector is styled as a segmented control", () => {
  const c = read("styles.css");
  assert.match(c, /#mode\s+label:has\(input:checked\)\s*\{[^}]*background:\s*#e8f0fe/);
  assert.match(c, /#mode\s+label:has\(input:checked\)\s*\{[^}]*color:\s*#1a73e8/);
  assert.match(c, /#mode\s+label:has\(input:focus-visible\)\s*\{[^}]*outline/);
  assert.match(c, /#mode\s*\{[^}]*border:\s*1px solid/);
  assert.match(c, /#mode\s*\{[^}]*border-radius:\s*6px/);
  assert.doesNotMatch(c, /#mode[^{]*input[^{]*\{[^}]*display:\s*none/);
  assert.doesNotMatch(c, /#mode[^{]*input[^{]*\{[^}]*visibility:\s*hidden/);
});
