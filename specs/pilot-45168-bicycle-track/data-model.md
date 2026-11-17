# Data Model: Bicycle Travel Mode

## Travel Mode (`TRAVEL_MODES[key]` in `src/geo.js`)

| Field | Type | foot | car | bike |
|-------|------|------|-----|------|
| `label` | string | "Walk" | "Car" | "Bike" |
| `icon` | string | "🚶" | "🚗" | "🚲" |
| `base` | URL | `https://routing.openstreetmap.de/routed-foot` | `…/routed-car` | `…/routed-bike` |
| `profile` | string (OSRM path segment) | "foot" | "driving" | "bike" |
| `noun` | string (status wording) | "walking" | "driving" | "cycling" |
| `adverb` | string (single-route summary) | "on foot" | "by car" | "by bike" |
| `pleasure` | boolean | true | false | true |
| `detours` | boolean | true | false | false |

Rules:
- Key order in the object, `foot`, `car`, `bike`, matches the UI order (Walk | Car | Bike).
- An unknown key falls back to `foot` (existing `routeUrl` behavior).
- The default mode at load is `foot` (FR-002).
- The existing `label`, `base` and `profile` values of `foot` and `car` must not change.

## Route (unchanged)

`{ distance: metres, duration: seconds, path: [[lat, lng], ...] }` from `parseRoutes`. Bike routes use the same shape.

## App state (`src/app.js`, unchanged shape)

`mode` ∈ keys of `TRAVEL_MODES`. Changing it keeps `currentPlace` and `stops` and calls `updateRoutes()`, which increments
`routeSeq` so late results are dropped (FR-006, FR-011).
