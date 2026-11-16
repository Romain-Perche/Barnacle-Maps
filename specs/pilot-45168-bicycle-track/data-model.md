# Data Model: Bicycle Travel Mode

No persistence. Entities are in-memory JS values.

## TravelMode (`TRAVEL_MODES[key]` in `src/geo.js`)

| Field | Type | foot | car | bike |
|---|---|---|---|---|
| key | string (object key) | `foot` | `car` | `bike` |
| label | string | `Walk` | `Car` | `Bike` |
| icon | string | `🚶` | `🚗` | `🚲` |
| base | URL | `…/routed-foot` | `…/routed-car` | `…/routed-bike` |
| profile | string (OSRM path segment) | `foot` | `driving` | `bike` |
| noun | string, used in "Computing {noun} routes…", "N {noun} routes", "No {noun} route found." | `walking` | `driving` | `cycling` |
| by | string, single-route summary suffix | `on foot` | `by car` | `by bike` |
| pleasure | boolean — show pleasure indicator | true | false | true |
| detours | boolean — force side-waypoint detours when OSRM returns < 2 routes and no stops | true | false | false |

Rules:
- Display order in the selector is Walk, Car, Bike (fixed in `index.html`, not derived from object order).
- Default mode is `foot` (FR-002). Unknown keys fall back to `foot` in `routeUrl` (existing behavior).

## Route (unchanged)

`{ distance: m, duration: s, path: [[lat, lng], …] }` from `parseRoutes`. Up to 3 per request via `pickRoutes`.

## App state transitions (`src/app.js`, unchanged logic)

`mode` changes on radio `change` → if a destination is set, `updateRoutes()`: increments `routeSeq`, aborts pleasure scoring, clears routes, fetches for the new mode with the same `currentPlace` and `stops`; late responses with an old `seq` are dropped.
