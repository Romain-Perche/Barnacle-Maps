# Data Model: Bicycle Travel Mode (SF-72)

All state lives in memory in the browser. Nothing is persisted.

## TravelMode (`TRAVEL_MODES[key]` in `src/geo.js`)

| Field | Type | foot | car | bike |
|-------|------|------|-----|------|
| `label` | string | "Walk" | "Car" | "Bike" |
| `icon` | string (emoji) | "🚶" | "🚗" | "🚲" |
| `base` | URL | `https://routing.openstreetmap.de/routed-foot` | `…/routed-car` | `…/routed-bike` |
| `profile` | OSRM profile segment | "foot" | "driving" | "bike" |
| `pleasure` | boolean: show and compute the pleasure indicator | true | false | true |
| `detours` | boolean: force side-waypoint detours when OSRM returns fewer than 2 routes | true | false | false |

Validation rules:
- The key MUST be one of `foot`, `car`, `bike`. `routeUrl` falls back to `foot` for unknown keys (existing behaviour). The selector `change` handler ignores values not in `TRAVEL_MODES`.
- Default mode: `foot`.

## ModeText (`MODE_TEXT[key]` in `src/app.js`)

| Field | foot | car | bike |
|-------|------|-----|------|
| `computing` | "Computing walking routes…" | "Computing driving routes…" | "Computing cycling routes…" |
| `noRoute` | "No walking route found." | "No driving route found." | "No cycling route found." |
| `single` | "on foot" | "by car" | "by bike" |
| `plural` | "walking" | "driving" | "cycling" |

The foot and car values reproduce today's strings exactly, so Walk and Car behaviour is unchanged (SC-004).

## Route (unchanged)

`{ distance: metres, duration: seconds, path: [[lat, lng], …] }`, from `parseRoutes`. A route is computed for exactly one mode (the `m` captured at the start of `updateRoutes`) and is drawn only if its `seq === routeSeq`.

## State transitions (selector)

```
foot ⇄ car ⇄ bike  (any to any; on change: mode = value; if currentPlace → updateRoutes(); stops kept)
```

`updateRoutes`: idle → (no place) status hint | (no position) waiting → computing → {routes drawn → [pleasure computing → scored | unavailable] (only if `pleasure`)} | no route | error.
