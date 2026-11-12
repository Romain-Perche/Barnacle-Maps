// Contract tests for the arrival helpers in src/geo.js (contracts/arrival-helpers.md).
// PILOT-4590: show the arrival time for each route.
// Rule (spec FR-002): arrival = departure truncated to the minute + displayed minutes,
// displayed minutes = max(1, round(seconds / 60)), invalid durations count as 0.
// Departures use the local-time Date constructor so results hold in any TZ (spec FR-003).
// The namespace import keeps one failing test per missing export instead of one link error.
import test from "node:test";
import assert from "node:assert/strict";
import * as geo from "../src/geo.js";

const at = (h, m, s = 0) => new Date(2026, 10, 12, h, m, s); // 2026-11-12, local time
const fn = (name) => {
  assert.equal(typeof geo[name], "function", `src/geo.js must export ${name}()`);
  return geo[name];
};
const floorToMinute = (d) => {
  const c = new Date(d.getTime());
  c.setSeconds(0, 0);
  return c.getTime();
};

// covers FR-001, FR-002, FR-003, FR-004, US1 scenario 1, US2 scenario 1, every row of contracts/arrival-helpers.md
const ROWS = [
  [at(14, 7, 40), 1500, "arrive 14:32", "US1 sc.1: clock 14:07 (14:07:40) + 25 min"],
  [at(14, 10), 1500, "arrive 14:35", "US2 sc.1: recomputed at 14:10"],
  [at(14, 7), 1529, "arrive 14:32", "25.48 min rounds to 25"],
  [at(14, 7), 1531, "arrive 14:33", "25.52 min rounds to 26"],
  [at(14, 7), 1530, "arrive 14:33", "half minute rounds up (1530 s = 26 min)"],
  [at(14, 7), 2400, "arrive 14:47", "US1 sc.5: 40 min with a stop"],
  [at(14, 7), 3600, "arrive 15:07", "whole hour (1 h)"],
  [at(14, 7), 20, "arrive 14:08", "very short route uses the displayed 1 min"],
  [at(14, 7), 0, "arrive 14:08", "zero duration counts as 1 min"],
  [at(14, 7), NaN, "arrive 14:08", "NaN is invalid: counts as 0"],
  [at(14, 7), -5, "arrive 14:08", "negative is invalid: counts as 0"],
  [at(14, 7), undefined, "arrive 14:08", "missing is invalid: counts as 0"],
  [at(14, 7), "abc", "arrive 14:08", "non-numeric is invalid: counts as 0"],
  [at(14, 7), Infinity, "arrive 14:08", "non-finite is invalid: counts as 0"],
  [at(8, 55), 600, "arrive 09:05", "two-digit padding"],
  [at(14, 7), 4800, "arrive 15:27", "1 h 20 min"],
  [at(23, 50), 1500, "arrive 00:15 (+1 day)", "after midnight"],
  [at(23, 0), 180000, "arrive 01:00 (+3 days)", "several days later"],
  [at(23, 59, 59), 1, "arrive 00:00 (+1 day)", "day boundary: rounding first, then calendar dates"],
];

for (const [departure, seconds, expected, why] of ROWS) {
  test(`contract formatArrival: ${why} -> "${expected}" (FR-002, FR-003, FR-004)`, () => {
    assert.equal(fn("formatArrival")(departure, seconds), expected);
  });
}

// covers FR-003
test("contract formatClock: local 24-hour HH:MM, zero-padded (FR-003)", () => {
  const formatClock = fn("formatClock");
  assert.equal(formatClock(at(9, 5)), "09:05");
  assert.equal(formatClock(at(14, 32, 59)), "14:32");
  assert.equal(formatClock(at(0, 15)), "00:15");
  assert.equal(formatClock(at(0, 0)), "00:00");
  assert.equal(formatClock(at(23, 59)), "23:59");
});

// covers FR-002, FR-004
test("contract arrivalTime: returns { at, dayOffset } with the displayed-minute rule (FR-002, FR-004)", () => {
  const arrivalTime = fn("arrivalTime");
  const r = arrivalTime(at(14, 7, 40), 1500);
  assert.ok(r.at instanceof Date, "at must be a Date");
  assert.equal(r.at.getTime(), at(14, 32).getTime());
  assert.equal(r.dayOffset, 0);
  assert.equal(arrivalTime(at(23, 50), 1500).dayOffset, 1);
  assert.equal(arrivalTime(at(23, 0), 180000).dayOffset, 3);
  // 00:10 + 23 h stays on the same calendar day: calendar dates, not 24 h periods
  assert.equal(arrivalTime(at(0, 10), 23 * 3600).dayOffset, 0);
  assert.equal(arrivalTime(at(0, 10), 23 * 3600).at.getTime(), at(23, 10).getTime());
});

// covers FR-002 (departure is a parameter, the helpers never read the current time)
test("contract arrival helpers do not mutate or depend on the current time (FR-002)", () => {
  const formatArrival = fn("formatArrival");
  const departure = at(14, 7, 40);
  const before = departure.getTime();
  assert.equal(formatArrival(departure, 1500), "arrive 14:32");
  assert.equal(departure.getTime(), before, "departure must not be mutated");
  const realNow = Date.now;
  Date.now = () => { throw new Error("helpers must not call Date.now()"); };
  try {
    assert.equal(formatArrival(departure, 1500), "arrive 14:32");
    assert.equal(fn("arrivalTime")(departure, 1500).at.getTime(), at(14, 32).getTime());
  } finally {
    Date.now = realNow;
  }
});

// covers FR-002, FR-007: one shared minute count for duration text and arrival
test("contract durationMinutes: shared minute count, invalid counts as 0 (FR-002, FR-007)", () => {
  const durationMinutes = fn("durationMinutes");
  assert.equal(durationMinutes(1529), 25);
  assert.equal(durationMinutes(1530), 26);
  assert.equal(durationMinutes(1500), 25);
  assert.equal(durationMinutes(20), 1);
  assert.equal(durationMinutes(0), 1);
  for (const bad of [undefined, null, NaN, Infinity, -Infinity, -5, "abc"])
    assert.equal(durationMinutes(bad), 1, String(bad));
});

// covers FR-002, FR-007: invalid durations read "1 min", valid ones unchanged
test("contract formatDuration: invalid durations read 1 min, valid ones unchanged (FR-002, FR-007)", () => {
  for (const bad of [undefined, NaN, "abc", Infinity, -5])
    assert.equal(geo.formatDuration(bad), "1 min", String(bad));
  assert.equal(geo.formatDuration(10), "1 min");
  assert.equal(geo.formatDuration(600), "10 min");
  assert.equal(geo.formatDuration(1530), "26 min");
  assert.equal(geo.formatDuration(3600), "1 h");
  assert.equal(geo.formatDuration(4800), "1 h 20 min");
});

// covers US1 scenario 2: each route its own arrival; a longer route never arrives earlier
test("contract three routes: each its own arrival, monotonic in duration (US1 scenario 2)", () => {
  const formatArrival = fn("formatArrival");
  const arrivalTime = fn("arrivalTime");
  const departure = at(14, 7, 40);
  assert.deepEqual(
    [1500, 1740, 2100].map((s) => formatArrival(departure, s)),
    ["arrive 14:32", "arrive 14:36", "arrive 14:42"],
  );
  const durations = [0, 20, 29, 30, 89, 90, 1499, 1500, 1530, 3600, 86400, 180000];
  let prev = -Infinity;
  for (const s of durations) {
    const t = arrivalTime(departure, s).at.getTime();
    assert.ok(t >= prev, `${s} s arrives earlier than a shorter route`);
    prev = t;
  }
  // equal displayed durations give equal arrivals
  assert.equal(formatArrival(departure, 1490), formatArrival(departure, 1510));
});

// covers FR-002, SC-002: arrival = shown clock + shown minutes, within 90 s of the exact time
test("contract property: at = floor(departure) + shown minutes, |error| < 90 s (FR-002, SC-002)", () => {
  const arrivalTime = fn("arrivalTime");
  const durationMinutes = fn("durationMinutes");
  let seed = 4590;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const start = new Date(2026, 0, 1).getTime();
  const span = new Date(2027, 0, 1).getTime() - start;
  for (let i = 0; i < 1000; i++) {
    const departure = new Date(start + Math.floor(rand() * span));
    const seconds = Math.floor(rand() * 200000) + (i % 2 ? 0.5 : 0);
    const r = arrivalTime(departure, seconds).at.getTime();
    assert.equal(r, floorToMinute(departure) + durationMinutes(seconds) * 60000, `${departure} + ${seconds}`);
    assert.ok(Math.abs(r - (departure.getTime() + seconds * 1000)) < 90000, `${departure} + ${seconds}`);
    const shown = geo.formatDuration(seconds);
    const m = shown.match(/^(?:(\d+) h)? ?(?:(\d+) min)?$/);
    assert.ok(m, shown);
    assert.equal(Number(m[1] || 0) * 60 + Number(m[2] || 0), durationMinutes(seconds), shown);
  }
});

// covers FR-004 daylight-saving rule. Runs only under TZ=Europe/Paris (quickstart.md).
const PARIS = Intl.DateTimeFormat().resolvedOptions().timeZone === "Europe/Paris";
test("contract DST spring forward: 01:50 + 25 min -> arrive 03:15 (FR-004)", { skip: !PARIS && "needs TZ=Europe/Paris" }, () => {
  // 2026-03-29 01:50 CET = 00:50 UTC; clocks jump 02:00 -> 03:00
  assert.equal(fn("formatArrival")(new Date(Date.UTC(2026, 2, 29, 0, 50)), 1500), "arrive 03:15");
});
test("contract DST fall back: 02:50 (first) + 25 min -> arrive 02:15, no suffix (FR-004)", { skip: !PARIS && "needs TZ=Europe/Paris" }, () => {
  // 2026-10-25 02:50 CEST = 00:50 UTC; clocks go back 03:00 -> 02:00
  const departure = new Date(Date.UTC(2026, 9, 25, 0, 50));
  assert.equal(fn("formatArrival")(departure, 1500), "arrive 02:15");
  assert.equal(fn("arrivalTime")(departure, 1500).dayOffset, 0);
});
