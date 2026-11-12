// Tests for PILOT-83386 "Show the arrival time for each route".
// Departures are built with the local Date constructor so the tests pass in any TZ.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as geo from "../src/geo.js";

const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
// Local date 2026-11-12 (month is 0-based).
const at = (h, min, s = 0) => new Date(2026, 10, 12, h, min, s);
const arrivalTime = (...a) => geo.arrivalTime(...a);
const formatArrival = (...a) => geo.formatArrival(...a);
const FORMAT = /^arrive \d{2}:\d{2}( \(\+1 day\)| \(\+([2-9]|\d{2,}) days\))?$/;

// ---------------------------------------------------------------------------------------------
// Contract: src/geo.js module API (contracts/route-entry.md §1)

test("contract: geo.js exports arrivalTime and formatArrival", () => {
  assert.equal(typeof geo.arrivalTime, "function");
  assert.equal(typeof geo.formatArrival, "function");
});

// covers FR-002, US1 scenario 1 (contract row 1)
test("arrivalTime: 14:07:00 + 25 min -> 14:32 same day", () => {
  assert.deepEqual(arrivalTime(at(14, 7), 1500), { hours: 14, minutes: 32, dayOffset: 0 });
});

// covers FR-002, FR-006, US2 scenario 1 (contract row 2)
test("arrivalTime: 14:12:00 + 25 min -> 14:37 same day", () => {
  assert.deepEqual(arrivalTime(at(14, 12), 1500), { hours: 14, minutes: 37, dayOffset: 0 });
});

// covers FR-002 rounding (contract rows 3 and 4)
test("arrivalTime: 29 s rounds down, exactly 30 s rounds up", () => {
  assert.deepEqual(arrivalTime(at(14, 7), 29), { hours: 14, minutes: 7, dayOffset: 0 });
  assert.deepEqual(arrivalTime(at(14, 7), 30), { hours: 14, minutes: 8, dayOffset: 0 });
});

// covers FR-002: the exact arrival instant is rounded, not "current minute + displayed duration"
test("arrivalTime: leave 14:07:40 + 25 min -> 14:33 (exact instant rounded)", () => {
  assert.deepEqual(arrivalTime(at(14, 7, 40), 1500), { hours: 14, minutes: 33, dayOffset: 0 });
  assert.equal(formatArrival(at(14, 7, 40), 1500), "arrive 14:33");
});

// covers FR-002 edge case "zero travel time"
test("arrivalTime: zero travel time equals the departure minute", () => {
  assert.deepEqual(arrivalTime(at(14, 7), 0), { hours: 14, minutes: 7, dayOffset: 0 });
});

// covers FR-004 (contract row 5), edge case "arrival on the next day"
test("arrivalTime: 23:50 + 25 min -> 00:15 next day", () => {
  assert.deepEqual(arrivalTime(at(23, 50), 1500), { hours: 0, minutes: 15, dayOffset: 1 });
});

// covers FR-004 (contract row 6), several days
test("arrivalTime: 22:00 + 2 days 2 h -> 00:00, three calendar days later", () => {
  assert.deepEqual(arrivalTime(at(22, 0), 2 * 86400 + 7200), { hours: 0, minutes: 0, dayOffset: 3 });
});

// covers FR-004 (contract row 7), edge case "rounding past midnight"
test("arrivalTime: 23:59:40 + 10 s rounds to 00:00 next day", () => {
  assert.deepEqual(arrivalTime(at(23, 59, 40), 10), { hours: 0, minutes: 0, dayOffset: 1 });
});

// covers FR-004: calendar dates, not elapsed 24 h periods (23 h later on the next date is +1 day)
test("arrivalTime: day offset compares calendar dates, not 24 h periods", () => {
  assert.equal(arrivalTime(at(0, 30), 23 * 3600).dayOffset, 0); // 23:30, same date
  assert.equal(arrivalTime(at(0, 30), 23 * 3600 + 1800).dayOffset, 1); // 00:00, next date
  assert.equal(arrivalTime(at(23, 0), 3600).dayOffset, 1);
});

// covers FR-002 local time, data-model "departure may be a Date or epoch milliseconds"
test("arrivalTime: accepts epoch ms and matches the local clock of the rounded instant", () => {
  const d = at(9, 3, 17);
  assert.deepEqual(arrivalTime(+d, 4321), arrivalTime(d, 4321));
  const exact = new Date(Math.round((+d + 4321 * 1000) / 60000) * 60000);
  const r = arrivalTime(d, 4321);
  assert.equal(r.hours, exact.getHours());
  assert.equal(r.minutes, exact.getMinutes());
});

// covers FR-004 edge case "daylight-saving change": works in any TZ; the late-March and
// late-October nights include the DST change in many zones.
test("arrivalTime: +1 day across DST-change nights", () => {
  for (const [y, m, d] of [[2026, 2, 28], [2026, 2, 7], [2026, 9, 24], [2026, 9, 31]]) {
    const dep = new Date(y, m, d, 23, 50);
    const r = arrivalTime(dep, 6 * 3600);
    assert.equal(r.dayOffset, 1, `${y}-${m + 1}-${d}`);
    const exact = new Date(+dep + 6 * 3600 * 1000);
    assert.equal(r.hours, exact.getHours());
    assert.equal(r.minutes, exact.getMinutes());
  }
});

// ---------------------------------------------------------------------------------------------
// Contract: formatArrival text (contracts/route-entry.md §1 formatArrival table)

// covers FR-001, FR-003, US1 scenario 1
test("formatArrival: same day -> 'arrive 14:32'", () => {
  assert.equal(formatArrival(at(14, 7), 1500), "arrive 14:32");
});

// covers FR-004
test("formatArrival: next day -> 'arrive 00:15 (+1 day)'", () => {
  assert.equal(formatArrival(at(23, 50), 1500), "arrive 00:15 (+1 day)");
});

// covers FR-004
test("formatArrival: several days -> 'arrive 00:00 (+3 days)'", () => {
  assert.equal(formatArrival(at(22, 0), 2 * 86400 + 7200), "arrive 00:00 (+3 days)");
  assert.equal(formatArrival(at(22, 0), 86400 + 7200), "arrive 00:00 (+2 days)");
});

// covers FR-004 rounding past midnight
test("formatArrival: rounding past midnight -> 'arrive 00:00 (+1 day)'", () => {
  assert.equal(formatArrival(at(23, 59, 40), 10), "arrive 00:00 (+1 day)");
});

// covers FR-003: two-digit 24-hour, never AM/PM, whatever the locale
test("formatArrival: always HH:MM 24-hour, zero-padded, no AM/PM", () => {
  assert.equal(formatArrival(at(9, 0), 300), "arrive 09:05");
  assert.equal(formatArrival(at(0, 0), 0), "arrive 00:00");
  assert.equal(formatArrival(at(12, 0), 0), "arrive 12:00");
  assert.equal(formatArrival(at(13, 0), 0), "arrive 13:00");
  assert.equal(formatArrival(at(23, 59), 0), "arrive 23:59");
  for (let h = 0; h < 24; h++) {
    for (const min of [0, 5, 30, 59]) {
      const s = formatArrival(at(h, min), 0);
      assert.match(s, FORMAT);
      assert.doesNotMatch(s, /AM|PM|am|pm|a\.m\.|p\.m\./);
      assert.equal(s, `arrive ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
  }
});

// covers FR-003: fixed lowercase English word "arrive"
test("formatArrival: starts with the fixed word 'arrive '", () => {
  assert.ok(formatArrival(at(14, 7), 1500).startsWith("arrive "));
});

// covers FR-001, edge cases "long trips" and "very short trips"
test("formatArrival: long trips in hours and very short trips both get a time", () => {
  assert.equal(geo.formatDuration(7500), "2 h 5 min");
  assert.equal(formatArrival(at(14, 7), 7500), "arrive 16:12");
  assert.equal(geo.formatDuration(20), "1 min");
  assert.equal(formatArrival(at(14, 7), 20), "arrive 14:07");
});

// ---------------------------------------------------------------------------------------------
// Acceptance scenarios

// covers FR-002, US1 scenario 2: longer exact travel time never gives an earlier arrival
test("US1 scenario 2: arrivals are monotonic in exact travel time", () => {
  const durations = [0, 29, 30, 89, 90, 1499, 1500, 1501, 1529, 1530, 7500, 90000, 200000];
  for (const dep of [at(14, 7, 40), at(23, 59, 40), at(0, 0, 0), at(11, 59, 30)]) {
    const mins = durations.map((s) => {
      const r = arrivalTime(dep, s);
      return r.dayOffset * 1440 + r.hours * 60 + r.minutes;
    });
    for (let i = 1; i < mins.length; i++) assert.ok(mins[i] >= mins[i - 1], `${durations[i]} s at ${dep}`);
  }
});

// covers FR-002, US1 scenario 2: routes with the same displayed duration differ by at most 1 min
test("US1 scenario 2: same displayed duration -> same or one-minute-later arrival", () => {
  const dep = at(14, 7, 40);
  assert.equal(geo.formatDuration(1471), geo.formatDuration(1529)); // both "25 min"
  assert.equal(formatArrival(dep, 1471), "arrive 14:32");
  assert.equal(formatArrival(dep, 1529), "arrive 14:33");
});

// covers SC-002: shown time is within 30 s of departure + travel time
test("SC-002: displayed arrival within 30 s of the exact arrival", () => {
  const dep = at(14, 7, 13);
  for (let s = 0; s < 4000; s += 37) {
    const r = arrivalTime(dep, s);
    const shown = new Date(2026, 10, 12 + r.dayOffset, r.hours, r.minutes);
    assert.ok(Math.abs(+shown - (+dep + s * 1000)) <= 30000, `${s} s`);
  }
});

// covers FR-006, FR-007, US2 scenario 1: new computation -> new departure -> new time
test("US2 scenario 1: recomputing at 14:12 moves 'arrive 14:32' to 'arrive 14:37'", () => {
  assert.equal(formatArrival(at(14, 7), 1500), "arrive 14:32");
  assert.equal(formatArrival(at(14, 12), 1500), "arrive 14:37");
  // Same departure always gives the same text (no ticking between computations).
  assert.equal(formatArrival(at(14, 7), 1500), formatArrival(at(14, 7), 1500));
});

// ---------------------------------------------------------------------------------------------
// Integration: route panel wiring in src/app.js (contracts/route-entry.md §2).
// app.js needs a browser (Leaflet, DOM), so these check its source like test/routes.test.js L4–L6.

const app = () => read("src/app.js");
const fnBody = (src, name) => {
  const i = src.indexOf(`function ${name}(`);
  assert.ok(i >= 0, `function ${name} not found`);
  const j = src.indexOf("\nfunction ", i + 1);
  const k = src.indexOf("\nasync function ", i + 1);
  const end = Math.min(...[j, k, src.length].filter((x) => x > 0));
  return src.slice(i, end);
};

// covers FR-001, FR-005, FR-008, FR-009, US1 scenarios 1, 3, 4, SC-001, SC-004, SC-005
test("integration: route title text includes formatArrival after the duration; rest of the entry unchanged", () => {
  const a = app();
  assert.match(a, /import\s*\{[^}]*\bformatArrival\b[^}]*\}\s*from\s*"\.\/geo\.js"/);
  const draw = fnBody(a, "drawRoutes");
  assert.match(draw, /function drawRoutes\(\s*routes\s*,\s*m\s*,\s*departure\s*\)/);
  assert.match(
    draw,
    /title\.textContent\s*=\s*`Route \$\{i \+ 1\} · \$\{formatDistance\(route\.distance\)\} · \$\{formatDuration\(route\.duration\)\}, \$\{formatArrival\(departure, route\.duration\)\}`/,
  );
  // The arrival is part of the title text, not gated by mode (walk and car) nor by stops.
  assert.doesNotMatch(draw, /if\s*\([^)]*(m|mode|st|stops)[^)]*\)\s*[^;]*formatArrival/);
  // FR-008: pleasure span, title span and selection stay as they are.
  assert.ok(draw.includes('pleasure.className = "pleasure";'));
  assert.ok(draw.includes("button.append(title);"));
  assert.ok(draw.includes("selectRoute(i)"));
});

// covers FR-002, FR-006, FR-007, FR-010, US2 scenarios 1, 2, SC-003, edge case "superseded computation"
test("integration: one departure per non-superseded computation; no ticking; status line unchanged", () => {
  const a = app();
  const body = fnBody(a, "updateRoutes");
  const sup = body.indexOf("if (seq !== routeSeq) return;");
  const empty = body.indexOf("if (!routes.length)");
  const dep = body.search(/const departure = new Date\(\);/);
  const draw = body.indexOf("drawRoutes(routes, m, departure)");
  assert.ok(sup >= 0 && empty >= 0, "supersede/empty checks still present");
  assert.ok(dep > sup && dep > empty, "departure taken after the supersede and empty checks");
  assert.ok(draw > dep, "drawRoutes receives that departure");
  assert.equal((body.match(/new Date\(/g) || []).length, 1, "a single departure per computation");
  assert.ok(body.indexOf("await fetchRoutes") < dep, "departure taken after the routes are received");
  // FR-007: no timer updates the route entries between computations.
  assert.doesNotMatch(a, /setInterval\s*\(/);
  for (const m of a.matchAll(/setTimeout\s*\(([^;]*)/g)) assert.doesNotMatch(m[1], /formatArrival|drawRoutes|arrive/);
  // FR-010: the status summary is unchanged and has no arrival time.
  assert.ok(body.includes("const summary = `${formatDistance(fastest.distance)} · ${formatDuration(fastest.duration)}`;"));
  for (const m of a.matchAll(/setStatus\(([^;]*)\)/g)) assert.doesNotMatch(m[1], /formatArrival|arrive |departure/);
});

// covers FR-005/FR-008 constraint: helpers stay pure in geo.js; README documents the feature
test("integration: geo.js stays DOM-free and README mentions the arrival time", () => {
  const s = read("src/geo.js");
  for (const w of ["document", "fetch(", "window", "toLocaleTimeString", "Intl."]) assert.ok(!s.includes(w), w);
  assert.match(read("README.md"), /arrive/i);
});
