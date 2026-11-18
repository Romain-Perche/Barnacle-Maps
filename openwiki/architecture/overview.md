---
type: architecture
title: Architecture overview
description: How Barnacle Maps is built - a static, build-free browser app made of index.html, src/app.js (DOM, Leaflet, network, state) and src/geo.js (pure helpers), talking directly to public OpenStreetMap services.
tags: [architecture, frontend, leaflet, state]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-18T18:14:22.657Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-18T18:14:22.657Z" }
---

# Architecture overview

Barnacle Maps is a single-page navigation app that runs entirely in the browser. There is no backend, no build step and no package dependency: a static file server delivers `index.html`, `styles.css` and two ES modules, and the browser talks directly to public OpenStreetMap services. For the data flow diagrams see [`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md); for the third-party libraries and versions see [`sbom/SBOM.md`](../../sbom/SBOM.md).

## Pieces

| Piece | Role |
|---|---|
| `index.html` | Page skeleton: map container, side panel (search form, travel-mode radio group, results list, stops box, route list, status line). Loads Leaflet from unpkg with Subresource Integrity, then `src/app.js` as a module. |
| `src/app.js` | Everything that touches the DOM, Leaflet or the network: geolocation, fetches, rendering, event handlers and the app state. Runs once on page load. |
| `src/geo.js` | Pure helpers with no DOM and no `fetch`, so they can be unit tested in Node: formatting, URL builders, response parsers, the `TRAVEL_MODES` table, route selection geometry, stop list operations and the pleasure pixel math. |
| `styles.css` | Full-screen map with a floating panel; segmented travel-mode selector; route, pleasure and stop styles. |

The split is deliberate: `src/geo.js` states in its header that it has no DOM access and no fetch, and `src/app.js` imports its helpers and wires them to the page.

## External services

All calls are made from the user's browser with `fetch` or by Leaflet:

- **OSM tile server** (`tile.openstreetmap.org`): base map tiles via a Leaflet tile layer, and zoom-16 tiles fetched directly for the [pleasure score](../features/pleasure-score.md).
- **Nominatim** (`nominatim.openstreetmap.org/search`): [place search](../features/search.md).
- **OSRM** on `routing.openstreetmap.de` (`routed-foot`, `routed-bike`, `routed-car`): [routes](../features/routing-and-travel-modes.md).
- **unpkg.com**: Leaflet 1.9.4 script and stylesheet.
- **Browser geolocation**: the user's live position (`watchPosition` with high accuracy).

## App state and lifecycle

`src/app.js` keeps its state in module-level variables: the current `position`, the chosen destination `currentPlace`, the travel `mode` (default `foot`), the ordered `stops`, the drawn `routeLayers` and the selected route index. Nothing is persisted: reloading the page starts from scratch, with the map centred on Paris until the first position fix recentres it at zoom 15.

The central function is `updateRoutes()`. It is called when a destination is chosen, when the travel mode changes (if a destination exists), when the stop list changes, and when a position arrives while a route was waiting for it (`pendingRoute`). It clears the drawn routes, aborts any running pleasure scoring, fetches routes for the current mode and stops, draws them, writes a status summary, and starts pleasure scoring for modes that have it.

### Stale-response guarding

Async work is guarded by sequence counters rather than cancellation:

- `searchSeq` is incremented for every search and whenever results are dismissed; a search answer whose sequence no longer matches is dropped.
- `routeSeq` is incremented by every `updateRoutes()` call; routing results, detour results and pleasure scores that arrive for an older sequence are ignored.
- Pleasure tile downloads additionally use an `AbortController` (`pleasureAbort`) that the next `updateRoutes()` aborts.

This keeps the panel consistent when the user types quickly, switches modes or edits stops while requests are in flight.

## Errors

Network failures never throw out of the UI: search and routing errors become status texts (`Search failed: …`, `Routing failed: …`, or the mode's "No … route found." text), geolocation refusal shows a hint to allow location access, and pleasure failures show "Pleasure unavailable" without touching the routes.

## Related pages

- [Place search](../features/search.md), [Routing and travel modes](../features/routing-and-travel-modes.md), [Stops](../features/stops.md), [Pleasure score](../features/pleasure-score.md)
- [Running, configuration and security](../operations/running-and-configuration.md)
