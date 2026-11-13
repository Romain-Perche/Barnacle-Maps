---
type: architecture
title: App state and request lifecycle
description: How src/app.js keeps its state in module-level variables, reacts to geolocation, and uses sequence counters so stale search and routing responses never overwrite newer ones.
tags: [architecture, state, lifecycle, concurrency, app]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# App state and request lifecycle

`src/app.js` is the only module that touches the DOM, Leaflet and the network. It is loaded once as an ES module from `index.html` and holds all runtime state in module-level variables; nothing is persisted (no cookies, `localStorage` or server). Reloading the page resets everything. Pure computations are delegated to `src/geo.js` (see [Architecture overview](overview.md)).

## State

| Variable | Meaning |
| --- | --- |
| `position` | Latest `{ lat, lng }` from geolocation, or `null` before the first fix |
| `currentPlace` | The chosen destination `{ name, lat, lng }` |
| `stops` | Ordered list of stops (see [Stops](../features/stops.md)) |
| `mode` | `"foot"` or `"car"`, from the radio group |
| `routeLayers` | One `{ route, line, button, pleasure }` per drawn route |
| `selectedRoute` | Index of the highlighted route |
| `drawnMode` | Mode the drawn routes were computed for (used by the summary card) |
| `routeSeq`, `searchSeq` | Monotonic request counters |
| `pendingRoute` | A route is waiting for the first position fix |
| `pleasureAbort` | `AbortController` of the running pleasure scoring |

## Geolocation

At start-up the app calls `navigator.geolocation.watchPosition` with high accuracy. Each fix updates the blue position marker; the first fix also centres the map at zoom 15. If a destination was chosen before any fix (`pendingRoute`), the next fix triggers `updateRoutes()`. When permission is denied, the status reads "Location unavailable…"; without the API, "Geolocation is not supported by this browser."

## The routing cycle: `updateRoutes()`

`updateRoutes()` is the single entry point that (re)computes routes. It is called when a destination is picked (`showRoute`), when stops change (`setStops`), when the travel mode changes (only if a destination exists), and on the first position fix if pending.

1. Snapshot `mode`, `currentPlace` and a copy of `stops`, and take `seq = ++routeSeq`.
2. Abort any running pleasure scoring and clear drawn routes (which also hides the [summary card](../features/route-summary-card.md)).
3. No destination: show a hint (or nothing) and stop. No position yet: set `pendingRoute`, centre on the destination, show "Waiting for your location…".
4. Fetch routes (see [Routing](../features/routing.md)). On error, or if `seq` is no longer current, return.
5. Draw routes, select route 0, write a status summary ("3 walking routes · fastest …" or "… on foot via 2 stops").
6. For walking only, start best-effort [pleasure scoring](../features/walking-pleasure.md).

## Superseded requests

Two counters protect against out-of-order responses:

- `searchSeq` is incremented for every search and also when a result is clicked or the input becomes too short; a search response whose sequence is no longer current is dropped.
- `routeSeq` is checked after every `await` in the routing and pleasure paths; only the latest request may draw routes, set error statuses or write pleasure labels.

All user-visible messages go through `setStatus`, which writes the `#status` element (`role="status"`, so screen readers announce it).
