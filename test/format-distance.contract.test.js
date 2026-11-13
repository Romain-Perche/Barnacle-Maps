// Contract tests for formatDistance (specs/pilot-68528-format-distances-with-a-small-library/contracts/format-distance.md).
// Namespace import so a missing export fails one test, not the whole file.
import test, { before } from "node:test";
import assert from "node:assert/strict";
import * as geo from "../src/geo.js";

const { formatDistance } = geo;

before(async () => {
  await geo.distanceFormatReady;
});

// covers FR-002, FR-003, US1 scenarios 1-4 and the boundary edge cases
const LOADED = [
  [0, "0 m"],
  [0.4, "0 m"],
  [0.5, "1 m"],
  [420.4, "420 m"], // US1 scenario 1
  [999.4, "999 m"],
  [999.5, "1 km"],
  [999.6, "1 km"],
  [1000, "1 km"],
  [1500, "1.5 km"], // US1 scenario 2
  [2000, "2 km"], // US1 scenario 4
  [12345, "12.3 km"], // US1 scenario 3
  [9999.96, "10 km"],
  [1234567, "1234.6 km"],
];

for (const [input, expected] of LOADED) {
  test(`formatDistance(${input}) is "${expected}" (FR-002/FR-003, US1)`, () => {
    assert.equal(formatDistance(input), expected);
  });
}

// covers FR-004, SC-002: one normal space, dot decimal, at most one decimal, no thousands separator, m or km only
test("formatDistance output shape (FR-004, SC-002)", () => {
  for (const [input] of LOADED) {
    assert.match(formatDistance(input), /^\d+(\.\d)? (m|km)$/, `input ${input}`);
  }
});

// covers FR-008: anything not a finite number >= 0 shows the em dash and never throws
for (const input of [NaN, undefined, null, "abc", "5", Infinity, -Infinity, -5]) {
  test(`formatDistance(${typeof input === "string" ? JSON.stringify(input) : String(input)}) is "—" (FR-008)`, () => {
    assert.equal(formatDistance(input), "—");
  });
}

// covers FR-006 fallback, FR-009: package not loaded -> whole metres only, no km conversion
test("formatDistance fallback without the package, conv=null (FR-006, FR-009)", () => {
  assert.equal(formatDistance(1500, null), "1500 m");
  assert.equal(formatDistance(420.4, null), "420 m");
  assert.equal(formatDistance(412700, null), "412700 m");
  assert.equal(formatDistance(NaN, null), "—");
  assert.equal(formatDistance(-5, null), "—");
});

// covers contract "Readiness": distanceFormatReady is a promise that resolves (never rejects)
test("distanceFormatReady is exported and resolves (FR-006, contract Readiness)", async () => {
  assert.ok(geo.distanceFormatReady instanceof Promise, "distanceFormatReady must be an exported Promise");
  await assert.doesNotReject(geo.distanceFormatReady);
});

// covers SC-005: no hand-written unit selection or km rounding left in formatDistance
test("formatDistance has no division by or comparison against 1000 (SC-005)", () => {
  const src = formatDistance.toString();
  assert.doesNotMatch(src, /1000|1e3/);
  assert.doesNotMatch(src, /toFixed\(2\)/);
});
