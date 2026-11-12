# Data Model: Show the Arrival Time for Each Route

No persisted data. All values are derived in memory for one route computation.

## Route (existing, unchanged)

| Field | Type | Source |
|-------|------|--------|
| `distance` | number (m) | OSRM via `parseRoutes` |
| `duration` | number (s) | OSRM via `parseRoutes` (passed through unchecked). With stops, this is the full duration through all stops to the destination |
| `path` | `[lat, lng][]` | OSRM |

## Departure (new, transient)

| Field | Type | Rule |
|-------|------|------|
| `departure` | `Date` | `new Date()` captured once in `updateRoutes()` after the routes of the **latest** request (`seq === routeSeq`) resolve and are non-empty. It is shared by all routes of that computation |

Lifecycle: created → passed to `drawRoutes` → discarded. A new value is created on every recomputation. It is never updated in place (no ticking).

## Estimated arrival (new, derived per route)

| Field | Type | Rule |
|-------|------|------|
| `at` | `Date` | `floorToMinute(departure) + Math.max(1, Math.round(route.duration / 60)) × 60 000 ms` (the displayed minutes) |
| `clock` | string | `HH:MM`, 24-hour, local time, zero-padded |
| `dayOffset` | integer ≥ 0 | local calendar date of `at` − local calendar date of `departure`, in days |
| `label` | string | `arrive ${clock}` + (`dayOffset === 1` ? ` (+1 day)` : `dayOffset > 1` ? ` (+${dayOffset} days)` : ``) |

Validation and invariants:
- `duration` is normally a non-negative finite number from OSRM, but `parseRoutes` does not check it. Missing, non-numeric, non-finite or negative values are invalid; the shared minute helper (used by `formatDuration` and the arrival helpers) treats them as 0, so they read `1 min`.
- Monotonic: for the same departure, `d1 ≤ d2 ⇒ at(d1) ≤ at(d2)`.
- `at` = displayed clock + displayed duration minutes, exactly.
- `|at − (departure + duration)| < 90 s`.
