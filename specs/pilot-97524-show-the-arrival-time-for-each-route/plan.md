# Implementation Plan: Show the arrival time for each route

**Branch**: `factory/pilot-97524-show-the-arrival-time-for-each-route` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/pilot-97524-show-the-arrival-time-for-each-route/spec.md`

## Summary

Next to each route's duration in the panel, show the clock time of arrival if the user leaves now, for example `Route 1 · 2.10 km · 25 min, arrive 14:32`. Arrivals after midnight get a `(+N day[s])` marker. Two pure helpers in `src/geo.js` do the work: `arrivalTime` rounds departure + duration to the nearest minute, and `formatArrival` produces 24-hour local `HH:MM` plus a DST-safe day offset. In `src/app.js`, `updateRoutes()` captures one `departure = new Date()` after the routes resolve and passes it to `drawRoutes`, which appends the text to each route's title. All recomputation already goes through `updateRoutes()`, so arrival times refresh on mode, destination and stop changes and never tick on their own.

## Technical Context

**Language/Version**: JavaScript (ES modules), browser and Node ≥ 18 for tests

**Primary Dependencies**: Leaflet 1.9.4 (CDN, existing). No new dependencies.

**Storage**: N/A

**Testing**: `node --test test/` (`node:test` + `node:assert/strict`)

**Target Platform**: Modern browsers (served statically by `python3 -m http.server`)

**Project Type**: Single-page static web app, no build step

**Performance Goals**: Negligible: O(1) per route, at most 3 routes per computation

**Constraints**: `src/geo.js` stays pure (no `document`, `window`, or `fetch(`, guard test L6). No new dependencies (guard test L8). The output must not depend on the locale (research R2).

**Scale/Scope**: About 25 lines in `src/geo.js`, about 5 changed lines in `src/app.js`, one new test file, and one README line

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template (only placeholders), so there are no ratified principles to enforce. The plan follows the conventions the repo already shows instead:

| Implicit gate (from the repo) | Status |
|-------------------------------|--------|
| Testable logic as pure helpers in `src/geo.js`, unit tested in Node | ✅ `arrivalTime` and `formatArrival` are pure and take the departure as an argument |
| No dependencies or build step (`L8`) | ✅ none added |
| `geo.js` has no DOM or fetch (`L6`) | ✅ only `Date` |
| Existing panel information unchanged (FR-006) | ✅ the text is appended; the spans and status line are untouched |

**Result**: PASS (pre-research). **Post-design re-check**: PASS. The design artifacts introduce no violations.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-97524-show-the-arrival-time-for-each-route/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R8
├── data-model.md        # Phase 1: route option + derived arrival
├── quickstart.md        # Phase 1: validation guide
├── contracts/
│   └── arrival.md       # Phase 1: helper signatures, examples, panel text
└── tasks.md             # Phase 2 (/speckit-tasks, not created here)
```

### Source Code (repository root)

```text
src/
├── geo.js        # + arrivalTime(), formatArrival() (pure, exported)
└── app.js        # updateRoutes: capture departure after fetch; drawRoutes(routes, m, departure) appends ", arrive …"
test/
└── arrival.test.js   # new: contract examples, rounding, +1/+2 days, invalid input, app.js wiring check
README.md          # + one line: each route shows its arrival time if you leave now
```

**Structure Decision**: Keep the existing single-project layout (`src/`, `test/`). No new modules.

## Implementation Approach

1. **`src/geo.js`**: Add `arrivalTime(departure, durationSeconds)` (research R3, R8) and `formatArrival(departure, durationSeconds)` (R2, R4), next to `formatDuration`. Update the module header comment to mention arrival times.
2. **`src/app.js`**:
   - Import `formatArrival`.
   - In `updateRoutes()`, after `if (seq !== routeSeq) return;` and the empty-routes check, add `const departure = new Date();` and call `drawRoutes(routes, m, departure)` (R5).
   - In `drawRoutes`, build the title as `` `${…formatDuration(route.duration)}${arrival ? `, ${arrival}` : ""}` `` with `arrival = formatArrival(departure, route.duration)` (R6).
   - Change nothing else. `clearRoutes()` and the error and no-route paths already cover FR-005 and FR-007 (R7).
3. **Tests** (`test/arrival.test.js`): Use every row of [contracts/arrival.md](contracts/arrival.md), with dates built through the local `Date` constructor so they don't depend on the time zone. Check that `arrivalTime` doesn't mutate its input. Add a source check that `app.js` imports `formatArrival` and that `new Date()` appears in `updateRoutes`, following the style of the L4 and L5 guards. Keep all existing tests green.
4. **README**: Add one sentence about the arrival time.

## Requirement Traceability

| Requirement | Covered by |
|-------------|------------|
| FR-001 | `drawRoutes` title suffix (R6); test on the panel text format |
| FR-002 | `arrivalTime` rounding (R3); rounding test row |
| FR-003 | manual `HH:MM` padding (R2); 08:05 and 00:00 test rows |
| FR-004 | calendar-day offset (R4); +1 and +2 day rows |
| FR-005 | single `updateRoutes()` entry, departure captured per computation (R5, R7); quickstart steps 4–5 |
| FR-006 | append-only change; existing tests unchanged; quickstart step 7 |
| FR-007 | arrival only inside `drawRoutes`; quickstart step 6 |

## Decisions Made Without Interaction

- The departure is captured when the routes **arrive**, not when the request starts (R5).
- The text goes in the same title span, not a separate element, so no CSS change is needed (R6).
- 24-hour format is built by hand rather than with `toLocaleTimeString`, so the output doesn't depend on the locale (R2).

## Complexity Tracking

No violations, so nothing to justify.
