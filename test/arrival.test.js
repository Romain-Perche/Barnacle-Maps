// Contract tests for the arrival-time helpers of PILOT-97524 (contracts/arrival.md).
// Dates are built with the local Date constructor, so the expectations hold in any time zone.
import test from "node:test";
import assert from "node:assert/strict";
import * as geo from "../src/geo.js";

const { arrivalTime, formatArrival } = geo;
const d = (y, mo, day, h, mi, s = 0) => new Date(y, mo - 1, day, h, mi, s);

test("contract: geo.js exports arrivalTime and formatArrival", () => {
  assert.equal(typeof geo.arrivalTime, "function");
  assert.equal(typeof geo.formatArrival, "function");
});

// One row of contracts/arrival.md per case. The 22:00 rows use the corrected values (T001).
const ROWS = [
  [d(2026, 11, 12, 14, 7), 1500, "arrive 14:32", "US1 scenario 1, FR-001, FR-002"],
  [d(2026, 11, 12, 9, 55), 4200, "arrive 11:05", "US1 scenario 3"],
  [d(2026, 11, 12, 14, 7, 40), 1490, "arrive 14:33", "FR-002 half minute rounds up"],
  [d(2026, 11, 12, 8, 0), 300, "arrive 08:05", "FR-003 zero padding"],
  [d(2026, 11, 12, 23, 50), 1500, "arrive 00:15 (+1 day)", "US1 scenario 4, FR-004"],
  [d(2026, 11, 12, 23, 59, 40), 20, "arrive 00:00 (+1 day)", "FR-004 rounding past midnight"],
  [d(2026, 11, 12, 22, 0), 93600, "arrive 00:00 (+2 days)", "FR-004 +N days"],
  [d(2026, 11, 12, 22, 0), 180000, "arrive 00:00 (+3 days)", "FR-004 +N days"],
  [d(2026, 11, 12, 14, 7), 0, "arrive 14:07", "edge zero duration"],
  [d(2026, 11, 12, 14, 7, 10), 15, "arrive 14:07", "edge sub-minute duration"],
  [d(2026, 11, 12, 0, 0), 59, "arrive 00:01", "FR-003 00:MM"],
];

for (const [dep, secs, want, covers] of ROWS) {
  test(`contract: formatArrival(${dep.toTimeString().slice(0, 8)}, ${secs}) → "${want}" (${covers})`, () => {
    assert.equal(formatArrival(dep, secs), want);
  });
}

test("contract: invalid input gives '' and arrivalTime null (R8, edge missing/invalid duration)", () => {
  const ok = d(2026, 11, 12, 14, 7);
  const bad = [
    [new Date(NaN), 60],
    [ok, NaN],
    [ok, -5],
    [ok, Infinity],
    [ok, "60"],
    [ok, null],
    [ok, undefined],
    ["2026-11-12T14:07", 60],
    [ok.getTime(), 60],
    [null, 60],
  ];
  for (const [dep, secs] of bad) {
    assert.equal(formatArrival(dep, secs), "", `formatArrival(${String(dep)}, ${String(secs)})`);
    assert.equal(arrivalTime(dep, secs), null, `arrivalTime(${String(dep)}, ${String(secs)})`);
  }
});

test("contract: arrivalTime rounds departure + exact duration to the nearest minute (FR-002)", () => {
  const a = arrivalTime(d(2026, 11, 12, 14, 7, 40), 1490);
  assert.ok(a instanceof Date);
  assert.equal(a.getTime(), d(2026, 11, 12, 14, 33).getTime());
  assert.equal(a.getSeconds(), 0);
  assert.equal(a.getMilliseconds(), 0);
  // Just under half a minute rounds down.
  assert.equal(arrivalTime(d(2026, 11, 12, 14, 7, 29), 0).getTime(), d(2026, 11, 12, 14, 7).getTime());
});

test("contract: arrivalTime is pure (no mutation, same result twice, new Date object)", () => {
  const dep = d(2026, 11, 12, 14, 7, 40);
  const before = dep.getTime();
  const a1 = arrivalTime(dep, 1490);
  const a2 = arrivalTime(dep, 1490);
  assert.equal(dep.getTime(), before);
  assert.notEqual(a1, dep);
  assert.equal(a1.getTime(), a2.getTime());
});

test("contract: output does not depend on the locale (FR-003, research R2)", () => {
  const orig = Date.prototype.toLocaleTimeString;
  Date.prototype.toLocaleTimeString = () => "2:32 PM";
  try {
    assert.equal(formatArrival(d(2026, 11, 12, 14, 7), 1500), "arrive 14:32");
  } finally {
    Date.prototype.toLocaleTimeString = orig;
  }
});

// DST: day marker counts local calendar days, the clock shows the real local wall time (FR-004).
function inZone(tz, fn) {
  const prev = process.env.TZ;
  process.env.TZ = tz;
  try {
    fn();
  } finally {
    if (prev === undefined) delete process.env.TZ;
    else process.env.TZ = prev;
  }
}

test("contract: DST spring forward (New York) shows the real local arrival time (FR-003, FR-004)", () => {
  inZone("America/New_York", () => {
    // 2026-03-07 23:30 EST + 4 h = 2026-03-08 04:30 EDT (clocks jump 02:00 → 03:00).
    assert.equal(formatArrival(new Date(2026, 2, 7, 23, 30), 4 * 3600), "arrive 04:30 (+1 day)");
  });
});

test("contract: DST fall back (New York) counts calendar days, not 24 h periods (FR-004)", () => {
  inZone("America/New_York", () => {
    // 2026-11-01 00:30 EDT + 24 h = 2026-11-01 23:30 EST (a 25-hour day): same calendar day.
    assert.equal(formatArrival(new Date(2026, 10, 1, 0, 30), 24 * 3600), "arrive 23:30");
  });
});
