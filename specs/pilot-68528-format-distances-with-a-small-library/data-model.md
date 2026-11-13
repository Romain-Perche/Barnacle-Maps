# Data Model: Format distances with a small library

The feature adds no stored data and no new entities. It only changes how one existing value is shown.

## Route distance (existing)

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `route.distance` | number (metres, ≥ 0, may be fractional) | OSRM `routes[].distance`, via `parseRoutes` / `parseRoute` in `src/geo.js` | Not changed by this feature |

## Displayed distance (derived string)

Produced only by `formatDistance(meters)` (FR-001). The full rules are in
[contracts/format-distance.md](./contracts/format-distance.md).

| Input state | Output |
|-------------|--------|
| Not a finite number, or negative | `"—"` |
| Rounded to whole metres = 0 | `"0 m"` |
| 1 – 999 whole metres | `"<n> m"` |
| ≥ 1000 whole metres | `"<km, ≤ 1 decimal, no trailing .0> km"` |
| Package not loaded | `"<whole metres> m"` (fallback) |

There are no state transitions.
