---
type: feature
title: Arrival time per route
description: How each route entry shows "arrive HH:MM" (with a "(+N day)" marker when needed). It covers arrivalTime/formatArrival rounding and day-offset rules, the single departure moment per route computation, and the PILOT-83386 spec and tests.
tags: [arrival-time, routes, formatting, ui, pilot-83386]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-2f8a8f62d774016705d4a227
    resource: repo://test/arrival.test.js
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# Arrival time per route

Every route entry in the panel shows when you would arrive if you left now, right after the duration:

```text
Route 1 · 2.10 km · 25 min, arrive 14:32
Route 1 · 1.20 km · 18 min, arrive 00:08 (+1 day)
```

The feature was specified as PILOT-83386 in `specs/pilot-83386-show-the-arrival-time-for-each-route/`, which holds the spec, plan, data model and the contract in `contracts/route-entry.md`. See [Spec-driven development](../workflows/spec-driven-development.md).

## Pure helpers (`src/geo.js`)

`arrivalTime(departure, seconds)` returns `{ hours, minutes, dayOffset }`:

- **Rounding.** It adds the *exact* OSRM `duration` (seconds) to the departure, then rounds that instant to the nearest minute (`Math.round(ms / 60000) * 60000`). Exactly 30 s rounds up. The rounded duration shown on screen is never used, so the shown time is always within 30 s of the real arrival, and a longer route never shows an earlier arrival.
- **Local time.** It reads hours and minutes with the local `Date` getters, so the device's time zone and DST rules apply at the arrival instant.
- **Day offset.** This is the difference between the local calendar dates of the departure and the *rounded* arrival, not a count of elapsed 24-hour periods. It compares the dates through `Date.UTC(y, m, d)` so that DST-length days still give whole numbers. Rounding alone can cross midnight: 23:59:40 + 10 s gives `00:00` with a `dayOffset` of 1.
- **No clock reads.** `departure` is a `Date` or epoch ms passed in by the caller, so the function is deterministic and testable.

`formatArrival(departure, seconds)` renders `arrive HH:MM`, always zero-padded and 24-hour whatever the locale, with ` (+1 day)` or ` (+N days)` when `dayOffset > 0`. The word "arrive" is fixed lowercase English.

## Wiring in `src/app.js`

- `updateRoutes()` takes `const departure = new Date()` once, after the routes arrive and pass the stale check, just before `drawRoutes(routes, m, departure)`. All routes of one computation therefore share the same departure moment.
- `drawRoutes` appends `, ${formatArrival(departure, route.duration)}` to each entry's title span. The arrival time is part of the visible text, so it is also part of the button's accessible name.
- The text does **not** tick forward. It is recomputed only when `updateRoutes()` runs again: on a new destination, a mode change, any stop change, or the first fix after the app was waiting for a position. See [Routing](routing.md).
- The `#status` summary line has no arrival time. With stops, the arrival is the time of reaching the final destination, because the OSRM duration covers the whole multi-leg trip.

## Tests

- `test/arrival.test.js` covers the contract table (rounding at 29/30 s, midnight, multi-day, rounding across midnight) and the format regex. It also reads `src/app.js` as text to check the wiring.
- `tests/ai/us1-arrival-time.md` and `tests/ai/us2-arrival-refresh.md` are Playwright scenarios run against the real app with a frozen clock. See [Testing](../testing/test-suite.md).
