# Data Model: Show the arrival time for each route

This feature has no persistence. It adds one derived value to an existing in-memory entity.

## Route option (existing, extended)

Produced by `parseRoutes` / `pickRoutes` in `src/geo.js` and kept in `routeLayers` entries in `src/app.js`.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `distance` | number (m) | OSRM | unchanged |
| `duration` | number (s) | OSRM | unchanged; input to the arrival time |
| `path` | `[lat, lng][]` | OSRM | unchanged |
| *(derived)* arrival | `Date` | `arrivalTime(departure, duration)` | computed when the route is drawn; **not stored** on the route object |

## Route computation (implicit)

One successful run of `updateRoutes()` that reaches `drawRoutes`.

| Field | Type | Notes |
|-------|------|-------|
| `departure` | `Date` | `new Date()` taken once, after the routes resolve and the superseded-request check passes (research R5); shared by every route in the set |
| `seq` | number | existing `routeSeq` token; a superseded computation never draws, so it never shows arrivals |

## Derived value: arrival

- `arrivalMs = round((departure + duration·1000) / 60 000) · 60 000`, which is the nearest minute, with a half minute rounding up (FR-002).
- `clock = HH:MM` from the local `getHours()`/`getMinutes()`, zero-padded, 24 h (FR-003).
- `dayOffset` = number of local calendar days between `departure` and `arrival`, an integer ≥ 0 (FR-004, DST-safe, research R4).
- Display: `arrive {clock}`, followed by ` (+1 day)` if `dayOffset = 1` or ` (+{n} days)` if `dayOffset = n > 1`.

### Validation rules

- `departure` must be a valid `Date`, and `duration` must be finite and ≥ 0. Otherwise the display is `""`, meaning no arrival is shown.
- Arrival never appears without a drawn route (FR-007).

### Lifecycle

`updateRoutes()` → `clearRoutes()` removes the old labels → (fetch) → stale check → `departure = new Date()` → `drawRoutes(routes, m, departure)` writes the new labels. Nothing changes the labels between two computations (spec assumption, research R7).
