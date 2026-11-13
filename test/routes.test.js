import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as geo from "../src/geo.js";

const {
  routeUrl, parseRoute, parseRoutes, detourWaypoints, routeOverlap, samplePath,
  pointToSegmentDistance, pickRoutes, routesBbox, haversine,
} = geo;

const near = (x, y, tol) => Math.abs(x - y) <= tol;
const dist = (p, q) => haversine(p, q);
const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const within = (x, c, tol) => assert.ok(near(x, c, tol), `${x} not within ${c} ± ${tol}`);

const from = { lat: 48.85, lng: 2.35 };
const to = { lat: 48.86, lng: 2.36 };
const COORDS = "2.35,48.85;2.36,48.86";

// A
test("A1 routeUrl_two_args_unchanged", () => {
  const u2 = routeUrl(from, to);
  assert.equal(routeUrl(from, to, undefined, {}), u2);
  assert.ok(u2.includes(COORDS));
  assert.ok(u2.includes("overview=full") && u2.includes("geometries=geojson"));
  assert.ok(!u2.includes("alternatives"));
});
test("A2 routeUrl_three_args_unchanged", () => {
  const base = "https://example.test/route/v1/foot";
  const u3 = routeUrl(from, to, base);
  assert.equal(u3, routeUrl(from, to, base, { alternatives: 0, via: null }));
  assert.ok(u3.startsWith(base));
  assert.ok(u3.includes(COORDS));
});
test("A3 routeUrl_alternatives", () => {
  const u = routeUrl(from, to, undefined, { alternatives: 3 });
  assert.ok(u.includes("alternatives=3") && u.includes("overview=full") && u.includes("geometries=geojson"));
  assert.ok(u.includes(COORDS));
  assert.notEqual(u, routeUrl(from, to));
});
test("A4 routeUrl_alternatives_zero_omitted", () => {
  const u = routeUrl(from, to, undefined, { alternatives: 0 });
  assert.equal(u, routeUrl(from, to));
  assert.ok(!u.includes("alternatives"));
});
const via = { lat: 48.855, lng: 2.37 };
const VIA_COORDS = "2.35,48.85;2.37,48.855;2.36,48.86";
test("A5 routeUrl_via", () => {
  const u = routeUrl(from, to, undefined, { via });
  assert.ok(u.includes(VIA_COORDS));
  assert.ok(!u.includes("alternatives"));
});
test("A6 routeUrl_via_and_alternatives", () => {
  const u = routeUrl(from, to, undefined, { via, alternatives: 3 });
  assert.ok(u.includes(VIA_COORDS) && u.includes("alternatives=3"));
});

// B
const OK2 = () => ({ code: "Ok", routes: [
  { distance: 1000, duration: 720, geometry: { coordinates: [[2.35, 48.85], [2.36, 48.86]] } },
  { distance: 1300, duration: 950, geometry: { coordinates: [[2.35, 48.85], [2.355, 48.857], [2.36, 48.86]] } },
] });
test("B1 parseRoutes_all_routes", () => {
  const r = parseRoutes(OK2());
  assert.equal(r.length, 2);
  assert.deepEqual(r[0], { distance: 1000, duration: 720, path: [[48.85, 2.35], [48.86, 2.36]] });
  assert.deepEqual(r[1], { distance: 1300, duration: 950, path: [[48.85, 2.35], [48.857, 2.355], [48.86, 2.36]] });
});
test("B2 parseRoutes_not_ok", () => {
  assert.deepEqual(parseRoutes({ code: "NoRoute", routes: OK2().routes }), []);
});
test("B3 parseRoutes_missing_routes", () => assert.deepEqual(parseRoutes({ code: "Ok" }), []));
test("B4 parseRoutes_empty_routes", () => assert.deepEqual(parseRoutes({ code: "Ok", routes: [] }), []));
test("B5 parseRoutes_null_input", () => {
  assert.deepEqual(parseRoutes(null), []);
  assert.deepEqual(parseRoutes(undefined), []);
});
test("B6 parseRoute_first_route", () => assert.deepEqual(parseRoute(OK2()), parseRoutes(OK2())[0]));
test("B7 parseRoute_no_route_null", () => {
  assert.equal(parseRoute({ code: "NoRoute" }), null);
  assert.equal(parseRoute({ code: "Ok", routes: [] }), null);
});

// C
function opposite(w, axis) {
  assert.ok(w[0][axis] * w[1][axis] < 0 || (w[0][axis] - 0) * (w[1][axis] - 0) < 0);
}
test("C1 detour_long_equator", () => {
  const w = detourWaypoints({ lat: 0, lng: 0 }, { lat: 0, lng: 0.01 });
  assert.equal(w.length, 2);
  for (const p of w) {
    assert.equal(typeof p.lat, "number"); assert.equal(typeof p.lng, "number");
    within(dist(p, { lat: 0, lng: 0.005 }), 278, 5);
    within(p.lng, 0.005, 0.0001);
  }
  const lats = w.map((p) => p.lat).sort((a, b) => a - b);
  within(lats[0], -0.0025, 0.0001); within(lats[1], 0.0025, 0.0001);
  assert.ok(w[0].lat * w[1].lat < 0);
});
test("C2 detour_short_uses_minimum_150m", () => {
  const w = detourWaypoints({ lat: 0, lng: 0 }, { lat: 0, lng: 0.001 });
  for (const p of w) {
    within(dist(p, { lat: 0, lng: 0.0005 }), 150, 3);
    within(Math.abs(p.lat), 0.00135, 0.00005);
  }
  assert.ok(w[0].lat * w[1].lat < 0);
});
test("C3 detour_custom_factor", () => {
  const w = detourWaypoints({ lat: 0, lng: 0 }, { lat: 0, lng: 0.01 }, 0.5);
  for (const p of w) within(dist(p, { lat: 0, lng: 0.005 }), 556, 8);
  assert.ok(w[0].lat * w[1].lat < 0);
});
test("C4 detour_latitude_scaling", () => {
  const w = detourWaypoints({ lat: 60, lng: 0 }, { lat: 60, lng: 0.02 });
  for (const p of w) {
    within(dist(p, { lat: 60, lng: 0.01 }), 278, 6);
    within(p.lng, 0.01, 0.0002);
    within(Math.abs(p.lat - 60), 0.0025, 0.0001);
  }
  assert.ok((w[0].lat - 60) * (w[1].lat - 60) < 0);
});
test("C5 detour_north_south_line", () => {
  const w = detourWaypoints({ lat: 0, lng: 0 }, { lat: 0.01, lng: 0 });
  for (const p of w) {
    within(p.lat, 0.005, 0.0001);
    within(Math.abs(p.lng), 0.0025, 0.0001);
  }
  assert.ok(w[0].lng * w[1].lng < 0);
});
test("C6 detour_same_point", () => {
  const f = { lat: 51.5, lng: -0.12 };
  const w = detourWaypoints(f, f);
  assert.equal(w.length, 2);
  for (const p of w) {
    assert.ok(Number.isFinite(p.lat) && Number.isFinite(p.lng));
    within(dist(p, f), 150, 3);
  }
  within(dist(w[0], w[1]), 300, 6);
});

// D
test("D1 sample_includes_endpoints_and_spacing", () => {
  const s = samplePath([[0, 0], [0, 0.001]], 25);
  assert.deepEqual(s[0], [0, 0]);
  assert.deepEqual(s[s.length - 1], [0, 0.001]);
  assert.ok(s.length >= 5 && s.length <= 7);
  for (let i = 1; i < s.length; i++)
    assert.ok(dist({ lat: s[i - 1][0], lng: s[i - 1][1] }, { lat: s[i][0], lng: s[i][1] }) <= 26);
  for (const p of s) within(p[0], 0, 1e-9);
});
test("D2 sample_multi_segment", () => {
  const path = [[0, 0], [0, 0.001], [0.001, 0.001]];
  const s = samplePath(path, 25);
  assert.deepEqual(s[0], [0, 0]);
  assert.deepEqual(s[s.length - 1], [0.001, 0.001]);
  assert.ok(s.length >= 9 && s.length <= 13);
  for (let i = 1; i < s.length; i++)
    assert.ok(dist({ lat: s[i - 1][0], lng: s[i - 1][1] }, { lat: s[i][0], lng: s[i][1] }) <= 26);
  for (const p of s) {
    const d = Math.min(pointToSegmentDistance(p, path[0], path[1]), pointToSegmentDistance(p, path[1], path[2]));
    assert.ok(d <= 1);
  }
});
test("D3 sample_short_path_shorter_than_step", () => {
  const s = samplePath([[0, 0], [0, 0.0001]], 25);
  assert.ok(s.length >= 2);
  assert.deepEqual(s[0], [0, 0]);
  assert.deepEqual(s[s.length - 1], [0, 0.0001]);
});
test("D4 sample_single_point", () => assert.deepEqual(samplePath([[1, 2]], 25), [[1, 2]]));
test("D5 sample_empty", () => assert.deepEqual(samplePath([], 25), []));

// E
const ea = [0, 0], eb = [0, 0.01];
test("E1 perpendicular_to_middle", () => within(pointToSegmentDistance([0.001, 0.005], ea, eb), 111.2, 1));
test("E2 beyond_end_uses_endpoint", () => within(pointToSegmentDistance([0, 0.011], ea, eb), 111.2, 1));
test("E3 before_start", () => within(pointToSegmentDistance([0, -0.002], ea, eb), 222.4, 2));
test("E4 on_segment", () => assert.ok(pointToSegmentDistance([0, 0.003], ea, eb) < 0.5));
test("E5 degenerate_segment", () => {
  const d = pointToSegmentDistance([0.001, 0], [0, 0], [0, 0]);
  assert.ok(!Number.isNaN(d));
  within(d, 111.2, 1);
});
test("E6 latitude_scaling", () => {
  within(pointToSegmentDistance([60.001, 0.01], [60, 0], [60, 0.02]), 111.2, 1.5);
  within(pointToSegmentDistance([60, 0.022], [60, 0], [60, 0.02]), 111.2, 1.5);
});

// F
const FA = { path: [[0, 0], [0, 0.01]] };
test("F1-F6 routeOverlap", () => {
  const results = [];
  results.push(routeOverlap(FA, FA)); assert.ok(results[0] >= 0.99);
  results.push(routeOverlap(FA, { path: [[0.001, 0], [0.001, 0.01]] })); assert.equal(results[1], 0);
  results.push(routeOverlap(FA, { path: [[0.0001, 0], [0.0001, 0.01]] })); assert.ok(results[2] >= 0.99);
  results.push(routeOverlap(FA, { path: [[0.0003, 0], [0.0003, 0.01]] })); assert.equal(results[3], 0);
  const L = { path: [[0, 0], [0, 0.002]] }, S = { path: [[0, 0], [0, 0.001]] };
  const ls = routeOverlap(L, S), sl = routeOverlap(S, L);
  results.push(ls, sl);
  assert.ok(ls >= 0.4 && ls <= 0.65);
  assert.ok(sl >= 0.99);
  for (const x of results) assert.ok(x >= 0 && x <= 1);
});

// G
const A = { distance: 1112, duration: 800, path: [[0, 0], [0, 0.01]] };
const B = { distance: 1500, duration: 1080, path: [[0, 0], [0.003, 0.002], [0.003, 0.008], [0, 0.01]] };
const E = { distance: 1500, duration: 1100, path: [[0, 0], [-0.003, 0.002], [-0.003, 0.008], [0, 0.01]] };
const C = { distance: 1120, duration: 820, path: [[0, 0], [0, 0.01]] };
const D = { distance: 2000, duration: 1200, path: [[0, 0], [-0.006, 0.005], [0, 0.01]] };
const same = (r, exp) => { assert.equal(r.length, exp.length); exp.forEach((x, i) => assert.equal(r[i], x)); };
test("G1 picks_distinct_sorted", () => same(pickRoutes([E, D, C, B, A]), [A, B, E]));
test("G2 max_limits", () => {
  same(pickRoutes([E, B, A], 2), [A, B]);
  same(pickRoutes([E, B, A], 1), [A]);
});
test("G3 default_max_3", () => {
  const F = { distance: 1700, duration: 1150, path: [[0, 0], [0.006, 0.002], [0.006, 0.008], [0, 0.01]] };
  const r = pickRoutes([A, B, E, F]);
  assert.equal(r.length, 3);
  same(r, [A, B, E]);
});
test("G4 does_not_mutate", () => {
  const input = [E, D, C, B, A];
  const copy = input.slice();
  const snaps = input.map((x) => JSON.stringify(x));
  pickRoutes(input);
  input.forEach((x, i) => { assert.equal(x, copy[i]); assert.equal(JSON.stringify(x), snaps[i]); });
});
test("G5 fastest_always_kept", () => assert.deepEqual(pickRoutes([C, A]), [A]));
test("G6 overlap_drops_near_duplicate_detour", () => {
  const B2 = { ...B, duration: 1090 };
  assert.deepEqual(pickRoutes([A, B, B2]), [A, B]);
});
test("G7 drops_too_long_even_if_distinct", () => assert.deepEqual(pickRoutes([A, D]), [A]));
test("G8 empty_and_single", () => {
  assert.deepEqual(pickRoutes([]), []);
  assert.deepEqual(pickRoutes([B]), [B]);
});

// H
const HP = () => [[[0, 0], [0.01, 0.02]], [[-0.005, 0.01]]];
test("H1 covers_all_paths_padded", () => {
  const b = routesBbox(HP(), 100);
  assert.deepEqual(Object.keys(b).sort(), ["east", "north", "south", "west"]);
  within(b.south, -0.0059, 0.0002); within(b.north, 0.0109, 0.0002);
  within(b.west, -0.0009, 0.0002); within(b.east, 0.0209, 0.0002);
});
test("H2 default_pad_is_100", () => assert.deepEqual(routesBbox(HP()), routesBbox(HP(), 100)));
test("H3 zero_pad_exact", () => {
  const b = routesBbox(HP(), 0);
  within(b.south, -0.005, 1e-9); within(b.west, 0, 1e-9); within(b.north, 0.01, 1e-9); within(b.east, 0.02, 1e-9);
});
test("H4 high_latitude_lng_pad_wider", () => {
  const b = routesBbox([[[60, 10], [60.01, 10.01]]], 100);
  within(b.south, 59.9991, 0.0002);
  within(b.west, 10 - 0.0018, 0.0003);
});
test("H5 invariants", () => {
  const b = routesBbox(HP(), 100);
  assert.ok(b.south < b.north && b.west < b.east);
});

// L
test("L1 index_html_routes_list", () => {
  const h = read("index.html");
  assert.match(h, /<ul[^>]*id="routes"[^>]*aria-label="Route options"|<ul[^>]*aria-label="Route options"[^>]*id="routes"/);
  const i = h.indexOf('id="routes"');
  assert.ok(h.indexOf('id="results"') < i && i < h.indexOf('id="status"'));
});
test("L2 styles_routes_empty_hidden", () => {
  const c = read("styles.css");
  assert.match(c, /#routes:empty\s*\{[^}]*display:\s*none/);
  assert.ok(c.includes("#routes"));
  assert.ok(c.includes(".selected") || c.includes('aria-pressed="true"'));
});
test("L3 readme_mentions_routes_and_pleasure", () => {
  const r = read("README.md");
  assert.match(r, /up to 3|3 routes|several routes|three routes/i);
  assert.match(r, /pleasure/i);
});
test("L4 app_js_imports_and_state", () => {
  const a = read("src/app.js");
  for (const s of ["parseRoutes", "pickRoutes", "detourWaypoints", "routeSeq", "clearRoutes", "Promise.allSettled"])
    assert.ok(a.includes(s), s);
  assert.ok(!a.includes("routeLine"));
});
test("L5 app_js_strings", () => {
  const a = read("src/app.js");
  for (const s of ["Pleasure unavailable", "No walking route found.", "aria-pressed"])
    assert.ok(a.includes(s), s);
});
test("L6 geo_module_pure", () => {
  const s = read("src/geo.js");
  for (const w of ["document", "fetch(", "window"]) assert.ok(!s.includes(w), w);
});
test("L7 geo_exports", () => {
  for (const n of ["routeUrl", "parseRoute", "parseRoutes", "detourWaypoints", "routeOverlap", "samplePath",
    "pointToSegmentDistance", "pickRoutes", "routesBbox", "haversine", "lngLatToPixel", "pathPixels",
    "pathTiles", "isGreenPixel", "countGreenPixels", "bestPleasure"]) assert.equal(typeof geo[n], "function", n);
});
test("L8 only_convert_dependency", () => {
  const p = JSON.parse(read("package.json"));
  assert.deepEqual(p.dependencies, { convert: "8.0.2" });
  assert.equal(p.devDependencies, undefined);
  assert.equal(p.scripts.test, "node --test test/");
});
