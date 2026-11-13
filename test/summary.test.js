// Contract tests for the pure summary helpers in src/geo.js (PILOT-73195).
// Contract: specs/pilot-73195-summary-card-for-the-selected-route/contracts/geo-summary-api.md
// A fixed time zone with DST keeps the calendar-day cases deterministic.
process.env.TZ = "Europe/Paris";

import test from "node:test";
import assert from "node:assert/strict";
import * as geo from "../src/geo.js";

const { formatDistance, formatDuration } = geo;
const at = (y, mo, d, h, mi, s = 0) => new Date(y, mo - 1, d, h, mi, s);
const norm = (s) => s.replace(/\s/g, " ");
const hm = (d) => [d.getHours(), d.getMinutes()];
const fn = (name) => {
  assert.equal(typeof geo[name], "function", `geo.${name} is exported`);
  return geo[name];
};

test("contract: arrivalInfo, formatArrival and routeSummary are exported", () => {
  for (const n of ["arrivalInfo", "formatArrival", "routeSummary"]) fn(n);
});

// --- arrivalInfo ---------------------------------------------------------------------------------

test("arrivalInfo: 14:10 + 25 min -> 14:35 same day", () => {
  // covers FR-004, US1 scenario 3
  const r = fn("arrivalInfo")(at(2026, 11, 13, 14, 10), 1500);
  assert.deepEqual(hm(r.time), [14, 35]);
  assert.equal(r.dayOffset, 0);
});

test("arrivalInfo: seconds of 'now' are kept (14:10:50 + 25 min -> 14:35:50)", () => {
  // covers FR-004, US1 scenario 3 (any time within the 14:10 minute reads 14:35)
  const r = fn("arrivalInfo")(at(2026, 11, 13, 14, 10, 50), 1500);
  assert.equal(r.time.getTime(), at(2026, 11, 13, 14, 35, 50).getTime());
});

test("arrivalInfo: uses the displayed (rounded) minutes, at least 1", () => {
  // covers edge case "very short routes", FR-003/FR-004 consistency
  const arrivalInfo = fn("arrivalInfo");
  assert.deepEqual(hm(arrivalInfo(at(2026, 11, 13, 14, 10), 10).time), [14, 11]); // "1 min"
  assert.deepEqual(hm(arrivalInfo(at(2026, 11, 13, 14, 10), 0).time), [14, 11]);
  assert.deepEqual(hm(arrivalInfo(at(2026, 11, 13, 14, 10), 1475).time), [14, 35]); // 24.6 min shows "25 min"
  assert.equal(formatDuration(1475), "25 min");
});

test("arrivalInfo: 23:50 + 30 min -> 00:20 next day", () => {
  // covers FR-005
  const r = fn("arrivalInfo")(at(2026, 11, 13, 23, 50), 1800);
  assert.equal(r.time.getTime(), at(2026, 11, 14, 0, 20).getTime());
  assert.equal(r.dayOffset, 1);
});

test("arrivalInfo: 22:00 + 50 h -> 00:00 three days later", () => {
  // covers FR-005 (several days)
  const r = fn("arrivalInfo")(at(2026, 11, 13, 22, 0), 180000);
  assert.equal(r.time.getTime(), at(2026, 11, 16, 0, 0).getTime());
  assert.equal(r.dayOffset, 3);
});

test("arrivalInfo: day offset counts calendar days across DST changes", () => {
  // covers FR-005 (DST-safe, research R3); Europe/Paris springs forward on 2026-03-29
  const arrivalInfo = fn("arrivalInfo");
  assert.equal(arrivalInfo(at(2026, 3, 29, 23, 30), 3600).dayOffset, 1); // 23 h day
  assert.equal(arrivalInfo(at(2026, 10, 25, 23, 30), 3600).dayOffset, 1); // 25 h day
  assert.equal(arrivalInfo(at(2026, 3, 29, 1, 0), 3600).dayOffset, 0);
});

// --- formatArrival -------------------------------------------------------------------------------

test("formatArrival: 24-hour locale -> 14:35", () => {
  // covers FR-004 (device clock setting, 24 h)
  assert.equal(norm(fn("formatArrival")(at(2026, 11, 13, 14, 10), 1500, "en-GB")), "14:35");
});

test("formatArrival: 12-hour locale -> 2:35 PM", () => {
  // covers FR-004 (device clock setting, 12 h)
  assert.equal(norm(fn("formatArrival")(at(2026, 11, 13, 14, 10), 1500, "en-US")), "2:35 PM");
});

test("formatArrival: 24-hour hours are two digits (00:20, not 0:20)", () => {
  // covers FR-004 (research R1)
  assert.match(norm(fn("formatArrival")(at(2026, 11, 13, 23, 50), 1800, "en-GB")), /^00:20/);
});

test("formatArrival: next day -> '00:20 +1 day'", () => {
  // covers FR-005, edge case "arrival on a later day"
  assert.equal(norm(fn("formatArrival")(at(2026, 11, 13, 23, 50), 1800, "en-GB")), "00:20 +1 day");
});

test("formatArrival: several days -> '00:00 +3 days'", () => {
  // covers FR-005
  assert.equal(norm(fn("formatArrival")(at(2026, 11, 13, 22, 0), 180000, "en-GB")), "00:00 +3 days");
});

test("formatArrival: same day has no day suffix", () => {
  // covers FR-005 (only when later)
  assert.doesNotMatch(fn("formatArrival")(at(2026, 11, 13, 14, 10), 1500, "en-GB"), /day/);
});

test("formatArrival: without a locale it uses the device default", () => {
  // covers FR-004 (app passes no locale)
  const now = at(2026, 11, 13, 14, 10);
  assert.equal(fn("formatArrival")(now, 1500), fn("formatArrival")(now, 1500, undefined));
  assert.match(norm(fn("formatArrival")(now, 1500)), /^(14:35|2:35 PM|\S*35\S*.*)$/);
});

// --- routeSummary --------------------------------------------------------------------------------

test("routeSummary: Design A example -> 29 min, 2.35 km, 14:39", () => {
  // covers FR-002, FR-004, FR-009 (design example "29 min | 2.35 km | Arrive 14:39")
  const s = fn("routeSummary")({ distance: 2350, duration: 1740 }, at(2026, 11, 13, 14, 10), "en-GB");
  assert.deepEqual({ ...s, arrival: norm(s.arrival) }, { duration: "29 min", distance: "2.35 km", arrival: "14:39" });
});

test("routeSummary: distance and duration are exactly the panel strings", () => {
  // covers FR-003, US1 scenario 2, SC-003
  const routeSummary = fn("routeSummary");
  const now = at(2026, 11, 13, 14, 10);
  for (const duration of [10, 600, 1740, 3600, 5400])
    for (const distance of [420.4, 1500, 12345]) {
      const s = routeSummary({ distance, duration }, now, "en-GB");
      assert.equal(s.duration, formatDuration(duration));
      assert.equal(s.distance, formatDistance(distance));
    }
});
