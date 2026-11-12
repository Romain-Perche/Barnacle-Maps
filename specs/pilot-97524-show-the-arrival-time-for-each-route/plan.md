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

**Scale/Scope**: About 25 lines in `src/geo.js`, about 5 changed lines in `src/app.js`, and one README line. The tests already exist (written by the write-tests gate, commit 6890210): two test files, one harness, and two AI scenario files

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
├── arrival.test.js        # exists: contract examples (+1/+2/+3 days, 00:01, zero/sub-minute), rounding, purity, invalid input, locale, DST
├── arrival-panel.test.js  # exists: runs the real app.js; panel text, refresh triggers, no leftovers, FR-005..FR-011
└── support/
    └── app-harness.js     # exists: fake DOM, fake Leaflet, fake geolocation, scripted fetch
tests/ai/
├── us1-arrival-time.md    # exists: AI scenarios for US1 (incl. FR-009 narrow panel, SC-004)
└── us2-arrival-refresh.md # exists: AI scenarios for US2
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
3. **Tests**: They already exist and fail until steps 1–2 are done; they are the red phase. Do not rewrite them. `test/arrival.test.js` covers every row of [contracts/arrival.md](contracts/arrival.md) (dates built through the local `Date` constructor so they don't depend on the time zone), purity, invalid input, locale and DST. `test/arrival-panel.test.js` checks the behaviour by running the real `src/app.js` through `test/support/app-harness.js` with a mocked clock; this replaces source-text checks on `app.js`, so the implementation is free in its internal names as long as the panel text is right. Make them pass in local time, `TZ=Pacific/Kiritimati` and `TZ=America/New_York`, and keep all existing tests green.
4. **README**: Add one sentence about the arrival time.

## Requirement Traceability

| Requirement | Covered by |
|-------------|------------|
| FR-001 | `drawRoutes` title suffix (R6); contract rows; panel-title tests |
| FR-002 | `arrivalTime` rounding (R3); departure taken after the fetch (R5); rounding row; "departure when results arrive" panel test |
| FR-003 | manual `HH:MM` padding (R2); 08:05, 00:01 and 00:00 rows; locale and DST tests |
| FR-004 | calendar-day offset (R4); +1, +2 and +3 day rows; DST tests |
| FR-005 | single `updateRoutes()` entry, departure captured per computation (R5, R7); panel tests for mode, stops, destination, location; quickstart steps 4–5 |
| FR-006 | append-only change; existing tests unchanged; panel tests for pleasure line and status line; quickstart step 7 |
| FR-007 | arrival only inside `drawRoutes`; no-route and failed-recomputation panel tests; quickstart step 6 |
| FR-008 | text inside the title span of the route button (R6); accessible-name panel test |
| FR-009 | no CSS change, text wraps in the button (R6); AI scenario (narrow panel) only, since Node cannot measure layout |
| FR-010 | no position-change recomputation, no timer (R7); later-position and passage-of-time panel tests |
| FR-011 | no extra element or class (R6); "no extra mark" panel test |
| SC-001 | several-routes panel tests; AI scenarios |
| SC-002 | `arrivalTime` (R3, R5); rounding row and departure panel test |
| SC-003 | `clearRoutes()` first, superseded check before `departure` (R5, R7); "no leftovers" panel test |
| SC-004 | existing fastest-first order, no mark (FR-011); AI scenario (earliest arrival readable at a glance) |

## Decisions Made Without Interaction

- The departure is captured when the routes **arrive**, not when the request starts (R5).
- The text goes in the same title span, not a separate element, so no CSS change is needed (R6).
- 24-hour format is built by hand rather than with `toLocaleTimeString`, so the output doesn't depend on the locale (R2).
- The behavioural panel tests (real `app.js` in a Node harness) replace the source-text checks on `app.js` that an earlier plan version described. The contract rows were corrected: 22:00 + 50 h is `(+3 days)`, and a 26 h row gives `(+2 days)`.

## Complexity Tracking

No violations, so nothing to justify.
