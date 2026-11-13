---
type: architecture
title: Architecture overview
description: How Barnacle Maps is built - a no-build browser app split into a DOM/network layer (src/app.js) and pure, Node-testable helpers (src/geo.js), talking directly to OpenStreetMap services.
tags: [architecture, frontend, leaflet, state]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T11:32:10.059Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T11:32:10.059Z" }
---

# Architecture overview

Barnacle Maps is a single-page navigation app that runs entirely in the browser. There is no
backend and no build step: a static file server delivers `index.html`, `styles.css` and the ES
modules in `src/`, and the browser then talks directly to third-party OpenStreetMap services.
For where each piece of data comes from and goes, see the data flow model in
[`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md).

## Pieces

| Piece | Role |
|---|---|
| `index.html` | Page shell: map container, search form, travel-mode radios, result/stop/route lists and a `role="status"` line. Loads Leaflet from unpkg as a classic script, declares an import map for the `convert` package, then loads `src/app.js` as a module. |
| `src/app.js` | Everything that touches the DOM, Leaflet, `fetch`, geolocation and canvas. Owns all mutable UI state. |
| `src/geo.js` | Pure helpers with no DOM access and no `fetch`: URL builders, response parsers, geometry, route de-duplication, stop list operations, pleasure scoring and formatting. Unit tested in Node. |
| `styles.css` | Layout of the full-screen map and the floating panel. |

The split is deliberate: `geo.js` declares itself "pure helpers ... so they can be unit tested in
Node", and the test suite checks it stays that way (see [Test suite](../testing/test-suite.md)).
Its one asynchronous side effect is the dynamic `import("convert")` used for distance
formatting (see [Distance formatting](../features/distance-formatting.md)).

## Runtime state (src/app.js)

Module-level variables hold the state: the user's `position`, the current destination
`currentPlace`, the travel `mode` (`"foot"` or `"car"`), the ordered `stops`, the drawn
`routeLayers` and the selected index, plus markers. There is no persistence: nothing is written to
`localStorage`, cookies or any server, so a reload starts fresh.

## Lifecycle of a route

1. On load, the map is centred on Paris and `navigator.geolocation.watchPosition` starts; the
   first fix recentres the map and every fix moves the blue position marker.
2. The user picks a destination from the search results ([Place search](../features/search.md))
   or changes stops or mode. All of these call `updateRoutes()`.
3. `updateRoutes()` snapshots mode, destination and stops, bumps `routeSeq`, aborts any pleasure
   computation and clears the old routes. Without a position it sets `pendingRoute` and waits; the
   next geolocation fix retries.
4. It fetches routes from OSRM ([Routing](../features/routing.md)), draws them and writes a
   summary to the status line, then, for walking only, starts the best-effort
   [pleasure score](../features/pleasure.md).

### Superseding requests

Requests are never cancelled on the network (except pleasure tiles); instead each search and route
computation captures a sequence number (`searchSeq`, `routeSeq`) and drops its result if a newer
one started meanwhile. This keeps the UI consistent when the user types or clicks quickly.

## External services

Nominatim (search), OSRM on `routing.openstreetmap.de` (routes), the OSM tile server (map and
pleasure tiles) and unpkg (Leaflet and `convert`). Details, data sent and failure handling are in
[External services, privacy and security](../integrations/external-services.md).
