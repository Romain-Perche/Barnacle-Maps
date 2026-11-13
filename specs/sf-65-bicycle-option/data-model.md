# Data Model: Bicycle Option

No persisted data. Only in-memory structures change.

## TravelMode (`TRAVEL_MODES` in `src/geo.js`)

Keyed by mode id (`foot` | `car` | `bike`), value:

| Field | Type | foot | car | bike (new) |
|-------|------|------|-----|------------|
| `label` | string | "Walk" | "Car" | "Bike" |
| `base` | URL | `https://routing.openstreetmap.de/routed-foot` | `…/routed-car` | `…/routed-bike` |
| `profile` | string | "foot" | "driving" | "bike" |
| `adjective` (new) | string | "walking" | "driving" | "cycling" |
| `by` (new) | string | "on foot" | "by car" | "by bike" |

Validation rules:
- Every entry has non-empty `label`, `base`, `profile`, `adjective`, `by`.
- Unknown mode ids fall back to `foot` in `routeUrl` (unchanged).
- Default mode is `foot` (`let mode = "foot"` in `app.js`, `checked` radio in `index.html`).

Mode-dependent behaviour (in `app.js`, keyed on mode id, not new fields):
- Forced detours: `foot` only.
- Pleasure indicator: `foot` only.

## Route (unchanged)

`{ distance: metres, duration: seconds, path: [[lat, lng], …] }` from `parseRoutes`. For bike, `duration` is the
OSRM bicycle-profile estimate.

## State transitions

Mode change (radio `change`) → `mode = value` → if a destination is set, `updateRoutes()` (stops kept,
previous request superseded via `routeSeq`). Unchanged; bike is just a new valid value.
