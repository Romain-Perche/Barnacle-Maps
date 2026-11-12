# Implementation Plan: Show the arrival time for each route

**Branch**: `factory/pilot-83386-show-the-arrival-time-for-each-route` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/pilot-83386-show-the-arrival-time-for-each-route/spec.md`

## Summary

Each route entry in the panel will show the local clock time of arrival when leaving now, right after its duration: `Route 1 · 2.10 km · 25 min, arrive 14:32`, plus ` (+1 day)` / ` (+N days)` when the arrival is on a later calendar date. Two pure helpers in `src/geo.js` do the work: `arrivalTime(departure, seconds)` and `formatArrival(departure, seconds)`. They add the exact OSRM duration to a departure moment, round to the nearest minute, and format `HH:MM` in 24-hour local time with a calendar-day offset. `updateRoutes()` in `src/app.js` takes one `departure = new Date()` per successful, non-superseded computation and passes it to `drawRoutes()`, which appends the text to each route title. Since routes are rebuilt on every recomputation and there's no timer, the times refresh exactly when the routes do (FR-006 and FR-007). The status line is untouched (FR-010).

## Technical Context

**Language/Version**: JavaScript (ES2022 modules), run directly in the browser; Node.js ≥ 18 for the tests

**Primary Dependencies**: Leaflet 1.9.4 (CDN). External services: Nominatim, OSRM (routing.openstreetmap.de), OSM tiles. No new dependencies.

**Storage**: N/A (in-memory only)

**Testing**: `node --test test/` (built-in `node:test` + `node:assert/strict`); pure helpers from `src/geo.js` are unit-tested

**Target Platform**: Modern desktop and mobile browsers; served statically (`python3 -m http.server`)

**Project Type**: Single-page static web app (no build step)

**Performance Goals**: Negligible: O(routes ≤ 3) date arithmetic per computation

**Constraints**: Device local time zone; fixed 24-hour `HH:MM` regardless of locale; no live ticking; DST-safe day offset

**Scale/Scope**: About 25 lines of helper code, about 3 lines changed in `src/app.js`, 1 new test file, 1 line in the README

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the **unfilled template** (only placeholder principles), so it defines no ratified gates. Instead I checked the plan against the conventions the repository already follows:

| Gate (from repo conventions) | Status |
|---|---|
| No build step, no new dependencies (README) | ✅ Pass: plain ES module code only |
| Pure logic lives in `src/geo.js` and is unit-tested in Node; `src/app.js` holds DOM/fetch glue | ✅ Pass: `arrivalTime` / `formatArrival` in `geo.js`, with tests in `test/` |
| Existing behaviour is preserved (FR-008, FR-010) | ✅ Pass: only the title text is extended; status, pleasure and selection are untouched |
| README documents user-visible features | ✅ Pass: one sentence added about the arrival time |

**Post-design re-check (after Phase 1)**: still passes. The design adds no modules, dependencies, storage or timers.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-83386-show-the-arrival-time-for-each-route/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R6
├── data-model.md        # Phase 1: Route / Departure / Arrival
├── quickstart.md        # Phase 1: validation guide
├── contracts/
│   └── route-entry.md   # Phase 1: helper API + route entry text contract
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 (/speckit-tasks; not created here)
```

### Source Code (repository root)

```text
index.html               # unchanged
styles.css               # unchanged
README.md                # + one sentence: each route shows "arrive HH:MM" (leave-now time)
src/
├── geo.js               # + export arrivalTime(departure, seconds), formatArrival(departure, seconds)
└── app.js               # updateRoutes(): const departure = new Date() after the supersede check;
                         # drawRoutes(routes, m, departure): title += `, ${formatArrival(departure, route.duration)}`
test/
└── arrival.test.js      # new: contract tables, rounding, midnight/multi-day, monotonicity
```

**Structure Decision**: Keep the existing single-project layout (`src/` + `test/` at the repo root). No new directories.

## Implementation Notes

1. **`src/geo.js`**: add the helpers next to `formatDuration`:
   - `arrivalTime(departure, seconds)`: `ms = Math.round((+departure + seconds * 1000) / 60000) * 60000`; `a = new Date(ms)`, `d = new Date(+departure)`; `dayOffset = Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000)`; return `{ hours: a.getHours(), minutes: a.getMinutes(), dayOffset }`.
   - `formatArrival(departure, seconds)`: `arrive HH:MM`, zero-padded, plus ` (+1 day)` or ` (+N days)` when `dayOffset > 0`.
   - Update the file's header comment to mention arrival time formatting.
2. **`src/app.js`**: import `formatArrival`. In `updateRoutes()`, after `if (!routes.length) …`, set `const departure = new Date();` and call `drawRoutes(routes, m, departure)`. In `drawRoutes`, add the parameter and extend the title template literal. Leave `setStatus(...)` unchanged.
3. **Tests**: `test/arrival.test.js` covers every row of [contracts/route-entry.md](./contracts/route-entry.md), the two US2 refresh rows (14:07 → 14:32, 14:12 → 14:37), monotonicity over sorted durations, and that `formatArrival` never matches a 12-hour/AM/PM pattern.
4. **README**: append a sentence to the routes description.

## Decisions Made Without Interaction

This command ran non-interactively, so I made these choices myself (rationale in [research.md](./research.md)):
- The departure moment is taken when the routes arrive (after the fetch and the supersede check), not when the request starts (R2).
- Rounding is applied to the arrival instant (exact duration), not by adding the displayed rounded duration (R3).
- Formatting is done by hand rather than with `Intl`, to guarantee `HH:MM` 24-hour output in every locale (R4).
- The arrival is plain text inside the existing title `<span>`, with no new element or CSS (R5).

## Complexity Tracking

No constitution violations; nothing to justify.
