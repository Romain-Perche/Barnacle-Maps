# Data Model: Bicycle Travel Mode

## Travel mode (`TRAVEL_MODES[key]` in `src/geo.js`)

Keys, in selector order: `foot`, `car`, `bike`. Default `foot` (FR-002). Unknown keys fall back to `foot` in `routeUrl` (unchanged).

| Field | Type | foot | car | bike |
|---|---|---|---|---|
| `label` | string | `Walk` | `Car` | `Bike` |
| `icon` | string | `🚶` | `🚗` | `🚲` |
| `base` | URL | `https://routing.openstreetmap.de/routed-foot` | `…/routed-car` | `…/routed-bike` |
| `profile` | string | `foot` | `driving` | `bike` |
| `pleasure` | boolean | `true` | `false` | `true` |
| `detours` | boolean | `true` | `false` | `false` |
| `computing` | string | `Computing walking routes…` | `Computing driving routes…` | `Computing cycling routes…` |
| `noRoute` | string | `No walking route found.` | `No driving route found.` | `No cycling route found.` |
| `single` | string | `on foot` | `by car` | `by bike` |
| `plural` | string | `walking` | `driving` | `cycling` |

**Validation rules**
- Every entry has every field. Strings are non-empty.
- Foot/car texts must equal today's literals in `src/app.js` (SC-004: no behaviour change).
- `pleasure` is false only for car (FR-008). `detours` is true only for foot (FR-009).

## Route (unchanged)

`{ distance: m, duration: s, path: [[lat, lng], …] }` from `parseRoutes`. Computed for one mode. Up to 3 per request after `pickRoutes` (FR-004).

## UI state in `src/app.js` (unchanged shape)

- `mode`: a key of `TRAVEL_MODES`. Set by the selector's `change` event.
- `routeSeq`: incremented per `updateRoutes` call. A result is drawn only if its seq is still current (FR-006).
- `stops`, `currentPlace`: kept across mode changes (FR-007, US2).

**State transition**: mode change with `currentPlace` set → `updateRoutes()` → clears routes, aborts pleasure → status `computing` → draws routes (or shows `noRoute` / an error) → if `pleasure`, scores pleasure.
