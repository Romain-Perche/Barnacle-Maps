---
type: feature
title: Arrival time
description: How each route in the panel shows "arrive HH:MM" if you leave now — the pure arrivalTime/formatArrival helpers (rounding, next-day suffix, DST-safe day counting), when the departure instant is taken, and which events refresh it.
tags: [feature, arrival-time, routing, time, ui]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T15:51:15.781Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-d27ecf6cb97e60958bc3ff10
    resource: repo://test/arrival-panel.test.js
  - id: openwiki-source-2f8a8f62d774016705d4a227
    resource: repo://test/arrival.test.js
generated: { by: "claude-code", at: "2026-11-12T15:51:15.781Z" }
---

# Arrival time

Every route entry in the panel shows the clock time you would arrive if you left now, for walking and car routes, with or without stops. Example title: `Route 1 · 2.10 km · 25 min, arrive 14:32`. The feature was specified in `specs/pilot-97524-show-the-arrival-time-for-each-route/` (requirements FR-001…FR-011, contract in `contracts/arrival.md`); see [Spec-driven development workflow](../development/spec-driven-workflow.md).

## Pure helpers (`src/geo.js`)

### `arrivalTime(departure, durationSeconds) → Date | null`

- Adds the raw OSRM duration (seconds) to `departure`, then rounds to the nearest minute (half a minute rounds up, via `Math.round` on minutes).
- Returns `null` when `departure` is not a valid `Date`, or the duration is not a finite number ≥ 0.
- Pure: never reads the clock and returns a new `Date`.

### `formatArrival(departure, durationSeconds) → string`

- Returns `arrive HH:MM` in 24-hour local time, zero-padded, built from `getHours()`/`getMinutes()` so it does not depend on the browser locale.
- When the arrival is on a later **local calendar day**, appends ` (+1 day)` or ` (+N days)`. Days are counted by comparing `Date.UTC(y, m, d)` of the local dates, so DST transitions (23 h or 25 h days) still count as one day.
- Returns `""` for invalid input (whatever `arrivalTime` rejects).

| departure | duration | result |
| --- | --- | --- |
| 14:07:00 | 25 min | `arrive 14:32` |
| 14:07:40 | 24 min 50 s | `arrive 14:33` (exact sum, then round) |
| 23:50:00 | 25 min | `arrive 00:15 (+1 day)` |
| 22:00:00 | 26 h | `arrive 00:00 (+2 days)` |
| invalid / negative | — | `""` |

## Panel integration (`src/app.js`)

`drawRoutes(routes, mode, departure)` writes each title span as
`Route {i} · {distance} · {duration}` followed by `, {arrival}` only when `formatArrival` returned a non-empty string. So a route with a missing or invalid duration simply has no arrival suffix while the others keep theirs.

Design rules from the spec that the code follows:

- The arrival text is plain text inside the same title span (no extra element), so it is part of the button's accessible name.
- The status summary line (`fastest 2.10 km · 25 min`) does **not** include an arrival time.
- No badge or emphasis marks the earliest-arriving route; routes stay ordered fastest-first.
- The pleasure line of walking routes is unchanged.

## When the departure is taken

`updateRoutes()` captures `const departure = new Date()` **after** routes have been fetched and checked as still current, once per set of routes, then passes it to `drawRoutes`. Consequences:

- Slow routing does not make arrivals early: if routing takes 2 minutes, the departure is the moment the results arrived.
- All routes in one set share the same departure.
- The time is not ticking: the passage of time alone never updates the displayed arrivals.

## Refresh rules

Arrival times are recomputed only when routes are recomputed, i.e. on every `updateRoutes()` call: travel mode change, new destination, stop added/removed/reordered/cleared, and the position becoming available for a waiting route. Later position updates only move the user marker and do not change the arrivals.

`updateRoutes()` clears all route entries as soon as a recomputation starts, so old arrival times disappear immediately. If the new computation finds no route, fails, or is superseded by a newer one, no arrival time is shown.

## Tests

- `test/arrival.test.js` — contract tests of the helpers (examples table, invalid input, rounding, purity, locale independence, DST spring-forward/fall-back in New York).
- `test/arrival-panel.test.js` — runs the real `app.js` in the [test harness](../testing/test-suite.md) with a controlled clock: panel text, departure timing, refresh triggers, and leftovers after failures.
- `tests/ai/us1-arrival-time.md`, `tests/ai/us2-arrival-refresh.md` — Playwright scenarios with a fixed Europe/Paris clock.

## Related pages

- [Routing and travel modes](../features/routing.md)
- [Test suite](../testing/test-suite.md)
- [Spec-driven development workflow](../development/spec-driven-workflow.md)
