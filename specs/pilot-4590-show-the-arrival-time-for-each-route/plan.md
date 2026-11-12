# Implementation Plan: Show the Arrival Time for Each Route

**Branch**: `factory/pilot-4590-show-the-arrival-time-for-each-route` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/pilot-4590-show-the-arrival-time-for-each-route/spec.md`

## Summary

Each route entry in the panel gains an estimated arrival clock time right after its duration:
`Route 1 · 1.20 km · 25 min, arrive 14:32` (plus `(+1 day)` / `(+N days)` when the arrival is on a
later calendar day). The departure time is captured once per route computation, at the moment the
routes are returned and before they are drawn, so every recomputation (destination, mode, stops)
refreshes the times, and superseded requests never draw anything.

Technical approach: add pure, unit-testable helpers to `src/geo.js`
(`arrivalTime`, `formatClock`, `formatArrival`) that take the departure `Date` as a parameter (no
hidden `Date.now()`), and call them from `drawRoutes` in `src/app.js`. Nothing else changes: no
new DOM structure, no CSS change, no timers.

## Technical Context

**Language/Version**: JavaScript (ES modules), browser + Node.js ≥ 20 for tests (developed on Node.js 26)

**Primary Dependencies**: None added. Leaflet 1.9.4 (CDN) for the map; OSRM/Nominatim remain the routing/search sources

**Storage**: N/A

**Testing**: `node --test test/` (built-in `node:test` + `node:assert/strict`); new files `test/arrival.test.js` (helper contracts) and `test/route-entry.test.js` (source checks of the `src/app.js` wiring, the README line and helper purity); AI scenarios for the running app in `tests/ai/`. These test files were written before implementation (write-tests gate) and are already committed: implementation extends them only if a case is missing, never recreates them

**Target Platform**: Modern browsers (served statically via `python3 -m http.server`)

**Project Type**: Static single-page web app, no build step

**Performance Goals**: Negligible: one `Date` computation per route (≤ 3 per computation)

**Constraints**: No dependencies, no build step; helpers in `src/geo.js` must stay DOM-free and fetch-free; the device clock/time zone is the source of truth

**Scale/Scope**: ~4 small exported functions in `src/geo.js` (`durationMinutes` + 3 arrival helpers), a few lines changed in `src/app.js`, two test files and three AI scenario files (already written), one README line

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template (only placeholder principles), so it
defines no enforceable gates. The plan is checked against the project's established conventions instead
(README, `src/geo.js` header, existing tests):

| Convention | Status |
|------------|--------|
| No build step, no dependencies | PASS: uses `Date` only |
| Pure logic in `src/geo.js` (no DOM, no fetch), unit tested in Node | PASS: helpers take `departure` as an argument; tested in `test/arrival.test.js`, purity checked in `test/route-entry.test.js` |
| Superseded requests must not draw (`routeSeq` guard) | PASS: departure captured after the existing `seq !== routeSeq` check |
| Existing panel info and accessibility unchanged (FR-007/FR-008) | PASS: text appended to the existing title `<span>` inside the route `<button>`, which is already its accessible name |
| Simplicity / YAGNI | PASS: no live ticking clock (explicitly out of scope), no locale formatting |

**Post-design re-check**: PASS, no violations; Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-4590-show-the-arrival-time-for-each-route/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── arrival-helpers.md   # API of the new pure helpers in src/geo.js
│   └── route-entry-ui.md    # Text contract of a route entry in the panel
└── tasks.md             # Phase 2 output (/speckit-tasks, NOT created here)
```

### Source Code (repository root)

```text
src/
├── geo.js        # + arrivalTime(), formatClock(), formatArrival() (pure)
└── app.js        # updateRoutes(): capture departure; drawRoutes(): append ", arrive …"
test/
├── arrival.test.js       # new (committed): contract tests for durationMinutes, formatDuration (invalid input),
│                         #   arrivalTime, formatClock, formatArrival; properties; DST cases (TZ=Europe/Paris)
└── route-entry.test.js   # new (committed): source checks of app.js wiring, status line, README line, geo.js purity
tests/ai/
├── fixtures.md                  # new (committed): shared setup (fixed clock, mocked search/routing)
├── us1-arrival-time.md          # new (committed): AI scenarios for US1
└── us2-recomputed-arrival.md    # new (committed): AI scenarios for US2
README.md         # one line mentioning the arrival time
```

**Structure Decision**: Keep the existing single static project layout (`src/`, `test/`). Logic goes
in `src/geo.js` (pure, testable), wiring in `src/app.js`, mirroring how `formatDuration` is used today.

## Implementation Outline

1. `src/geo.js`: add `arrivalTime(departure, seconds)`, `formatClock(date)`, `formatArrival(departure, seconds)` per [contracts/arrival-helpers.md](./contracts/arrival-helpers.md). The minute count is `Math.max(1, Math.round(seconds / 60))`, the same as `formatDuration`; share it through one small helper so the two can never disagree. The helper treats missing, non-finite or negative durations as 0, so `formatDuration` then reads `1 min` (spec FR-002/FR-007).
2. `src/app.js`:
   - in `updateRoutes()`, right after the `if (seq !== routeSeq) return;` guard and the empty-result check, capture `const departure = new Date();` and call `drawRoutes(routes, m, departure)`;
   - in `drawRoutes(routes, m, departure)`, build the title as `` `Route ${i + 1} · ${formatDistance(route.distance)} · ${formatDuration(route.duration)}, ${formatArrival(departure, route.duration)}` ``.
3. Tests: `test/arrival.test.js` and `test/route-entry.test.js` already hold every case from [quickstart.md](./quickstart.md) and the contracts (14:07+25 min, rounding, < 1 min shows `arrive` clock + 1, ≥ 1 h, midnight, multi-day, monotonicity, two-digit padding, invalid durations, DST, `app.js` wiring). They fail until steps 1–2 are done. Implementation makes them pass; it does not rewrite them, and does not duplicate their cases in `test/geo.test.js`.
4. `README.md`: one line: each route shows its duration and the arrival time if you leave now ("25 min, arrive 14:32"); the arrival is the current time plus the routing duration only (no traffic, no waiting at stops).
5. Status summary line is **not** changed (spec Assumptions).

## Complexity Tracking

No violations to justify.
