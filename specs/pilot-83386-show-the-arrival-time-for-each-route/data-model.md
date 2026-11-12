# Data Model: Show the arrival time for each route

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

Nothing is persisted. All values are in memory and derived for each route computation.

## Route (existing, unchanged)

Produced by `parseRoutes` / `pickRoutes` in `src/geo.js`.

| Field      | Type                 | Notes                                     |
|------------|----------------------|-------------------------------------------|
| `distance` | number (metres)      | OSRM `route.distance`                     |
| `duration` | number (seconds)     | OSRM `route.duration`; exact travel time; input to the arrival time |
| `path`     | `[lat, lng][]`       | Polyline                                  |

No new field is stored on the route. The arrival time is derived when the entry is rendered.

## Departure moment (new, transient)

| Field       | Type   | Notes |
|-------------|--------|-------|
| `departure` | `Date` | Taken once per successful, non-superseded route computation in `updateRoutes()`, right before drawing. Shared by every route of that computation. |

**Lifecycle**: created → used to render that computation's route entries → discarded. A new computation (destination, mode, stops, a pending position) creates a new one. It never changes between computations (FR-007).

## Arrival (new, derived)

Returned by `arrivalTime(departure, seconds)`:

| Field       | Type    | Rule |
|-------------|---------|------|
| `hours`     | integer 0–23 | Local hour of the rounded arrival instant |
| `minutes`   | integer 0–59 | Local minute of the rounded arrival instant |
| `dayOffset` | integer ≥ 0  | Number of local calendar dates between departure and arrival |

**Derivation rules**:
- Arrival instant = `departure.getTime() + seconds * 1000`, rounded to the nearest minute (FR-002).
- `hours` / `minutes` are read with the local `Date` getters (device time zone).
- `dayOffset` = difference of the local calendar dates (not elapsed hours / 24), so it stays correct across DST changes (FR-004).
- Monotonic: for one departure, a larger `seconds` never gives an earlier arrival (US1 scenario 2).

**Validation**: `seconds` is a finite number ≥ 0 (OSRM always provides one). `departure` may be a `Date` or epoch milliseconds.

## Rendered text (derived)

`formatArrival(departure, seconds)` →
- `"arrive HH:MM"` when `dayOffset === 0`
- `"arrive HH:MM (+1 day)"` when `dayOffset === 1`
- `"arrive HH:MM (+N days)"` when `dayOffset ≥ 2`

The route entry title is `Route {i+1} · {formatDistance} · {formatDuration}, {formatArrival}`. See [contracts/route-entry.md](./contracts/route-entry.md).
