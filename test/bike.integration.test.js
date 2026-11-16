// Integration checks for the Bicycle Travel Mode (PILOT-45168): how src/app.js and README.md use the
// mode table. There is no DOM harness, so these read the sources (same approach as routes.test.js L*).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");

// covers FR-007, FR-008, FR-009, US1 scenarios 2, 4, 5: behavior and wording come from TRAVEL_MODES,
// so bike is never treated as walking or car by a two-way check.
test("app.js has no hard-coded travel mode comparisons", () => {
  const a = read("src/app.js");
  // Equality/inequality only: `let mode = "foot"` (the default) is an assignment and is allowed.
  assert.doesNotMatch(a, /(?:===?|!==?)\s*["'](foot|car|bike)["']/);
  assert.doesNotMatch(a, /["'](foot|car|bike)["']\s*(?:===?|!==?)/);
  assert.match(a, /\.detours\b/, "detour routes are gated by the mode's detours flag");
  assert.match(a, /\.noun\b/, "status wording uses the mode's noun");
});

// covers FR-007, FR-010, edge case "No cycling route found."; keeps routes.test.js L5 passing
test("app.js has a no-route message for each mode", () => {
  const a = read("src/app.js");
  for (const s of ["No walking route found.", "No driving route found.", "No cycling route found."]) {
    assert.ok(a.includes(s), s);
  }
});

// covers FR-009: the pleasure tooltip no longer says "walk" only
test("pleasure tooltip talks about the route, not the walk", () => {
  const a = read("src/app.js");
  assert.ok(!a.includes("along this walk"));
  assert.ok(a.includes("along this route"));
});

// covers FR-012
test("README documents the bike mode, its routing source and pleasure on bike routes", () => {
  const r = read("README.md");
  assert.match(r, /\bbike\b/i);
  assert.ok(r.includes("routing.openstreetmap.de/routed-bike"));
  assert.doesNotMatch(r, /walking only/i);
});
