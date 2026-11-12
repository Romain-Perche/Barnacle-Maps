---
type: architecture
title: Architecture overview
description: How Barnacle Maps is built. It is a static, build-free page with Leaflet, a browser module (src/app.js) that owns DOM, state and network calls, and a pure helper module (src/geo.js). This page also covers the search → route → pleasure flow and how stale requests are discarded.
tags: [architecture, leaflet, frontend, state, flow]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# Architecture overview

Barnacle Maps is a single static web page with no build step and no bundler. Dependency versions are listed in [`sbom/SBOM.md`](../../sbom/SBOM.md). It is made of these files:

| File | Role |
| --- | --- |
| `index.html` | Layout: a full-screen `#map` and a `#panel` holding the search form, the Walk/Car radio group, `#results`, the stops box, `#routes` and the `#status` live region. It loads Leaflet's CSS/JS from unpkg, then `src/app.js` as an ES module. |
| `styles.css` | Panel, route list, the selected route, stop markers and pleasure styling. |
| `src/app.js` | The browser layer. It owns the Leaflet map, DOM events, geolocation, `fetch` calls, tile decoding and all mutable state. |
| `src/geo.js` | Pure helpers with no DOM and no network access, unit-tested in Node. See [Pure geo helpers](geo-helpers.md). |

## State in `app.js`

All state lives in module-level `let` variables:

- `position`, the latest geolocation fix;
- `currentPlace`, the chosen destination;
- `stops`;
- `mode` (`"foot"` or `"car"`);
- `routeLayers`, one `{ route, line, button, pleasure }` per drawn route;
- `selectedRoute`;
- `pendingRoute`, set while a route waits for the first position fix;
- the counters `routeSeq` and `searchSeq`, and the `pleasureAbort` controller.

Nothing is persisted: a reload starts from a fresh state.

## End-to-end flow

1. **Geolocation.** `navigator.geolocation.watchPosition` updates `position` and the blue user marker. It centres the map once, at zoom 15. If a route was waiting (`pendingRoute`), it computes the route now. If geolocation is denied or unsupported, the status line says so.
2. **Search.** Submitting the form, or typing with debounce, calls Nominatim. Each result offers "go there" (`showRoute`) and "Add as stop". See [Place search](../features/place-search.md).
3. **Route computation.** `showRoute` places the destination marker and calls `updateRoutes()`. This function is also called when the stops change and when the travel mode changes while a destination is set. `fetchRoutes` asks OSRM for alternatives, and also for forced detours on walks that have no stops. `pickRoutes` keeps up to 3 distinct routes. See [Routing](../features/routing.md) and [Stops](../features/stops.md).
4. **Rendering.** `drawRoutes` adds one grey polyline and one panel button per route. Each label shows the distance, the duration and the arrival time, computed from a single `departure = new Date()` taken per computation (see [Arrival time](../features/arrival-time.md)). Route 1 is selected (blue), and the map fits all layers.
5. **Pleasure (walk only).** `scorePleasure` downloads zoom-16 OSM tiles in the background and labels each route with its count of green pixels. See [Pleasure score](../features/pleasure-score.md).

## Discarding stale requests

The user can trigger a new request before an older one returns. Each async path therefore takes a sequence number and drops its result if a newer request started in the meantime:

- `updateRoutes` increments `routeSeq`, aborts any pleasure download in flight, clears the drawn routes and copies `stops`. Its `fetchRoutes` and `scorePleasure` calls stop when `seq !== routeSeq`.
- `runSearch` increments `searchSeq`. Choosing a result, adding a stop or typing fewer than 3 characters also bumps it, so late suggestions never overwrite the list.

## External boundaries

The app depends on four public services: OSM tiles, Nominatim, the OSRM servers at routing.openstreetmap.de, and unpkg for Leaflet. Their endpoints, failure modes and security notes are in [External services](../integrations/external-services.md).
