# Data Model: Bicycle Travel Mode (SF-70)

Client-only app; no storage. The "model" is the in-memory mode table in `src/geo.js` and the existing route object.

## Travel mode (`TRAVEL_MODES[key]`, `src/geo.js`)

| Field | Type | foot | car | bike (new) |
|---|---|---|---|---|
| key | string | `foot` | `car` | `bike` |
| label | string | `Walk` | `Car` | `Bike` |
| icon | string (emoji) | `🚶` | `🚗` | `🚲` |
| base | URL | `https://routing.openstreetmap.de/routed-foot` | `…/routed-car` | `…/routed-bike` |
| profile | string (OSRM path segment) | `foot` | `driving` | `bike` |
| pleasure | boolean | true | false | true |
| detours | boolean | true | false | false |
| computing | string | `Computing walking routes…` | `Computing driving routes…` | `Computing cycling routes…` |
| noRoute | string | `No walking route found.` | `No driving route found.` | `No cycling route found.` |
| single | string (1 route summary) | `on foot` | `by car` | `by bike` |
| plural | string (adjective for N routes) | `walking` | `driving` | `cycling` |

Validation rules:
- Keys are exactly `foot`, `car`, `bike`; `foot` is the default (`routeUrl` and the selector both fall back to it).
- Unknown mode keys fall back to `foot` (existing `routeUrl` behaviour, kept).
- Existing values for `foot` and `car` (`label`, `base`, `profile`) are unchanged; their texts reproduce today's strings exactly.

## Route (unchanged)

`{ distance: metres, duration: seconds, path: [[lat, lng], …] }`, from `parseRoutes`. A route belongs to the mode that was selected when its request started; `routeSeq` discards results of superseded requests.

## UI state (`src/app.js`, unchanged shape)

- `mode`: one of the `TRAVEL_MODES` keys, `"foot"` at load, not persisted.
- `stops`, `currentPlace`: kept across mode changes (FR-008/009).

## State transitions

```
select mode M (radio change)
  └─ currentPlace? ─ yes → updateRoutes(): ++routeSeq, abort pleasure, clear routes,
                             status = M.computing → fetch (M.base/M.profile, stops, alternatives)
                             → [stale seq: drop] → none: M.noRoute → draw ≤3, select fastest,
                             status uses M.single / M.plural → M.pleasure? score pleasure
                   └─ no  → nothing (mode remembered for next destination)
```
