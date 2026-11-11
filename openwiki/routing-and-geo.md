---
type: "Reference"
title: "Routing, Stops and Pleasure Logic"
openwiki_generated: true
verified:
  - by: openwiki/0.9.0
    at: 2026-11-11T18:14:21.891Z
sources:
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-11T18:14:21.891Z" }
---

# Routing, Stops and Pleasure Logic

The app is split into a DOM-free logic module, `src/geo.js`, and the UI module `src/app.js`, which imports the helpers and wires them to Leaflet and the panel. Libraries and versions are listed in [sbom/SBOM.md](../sbom/SBOM.md).

## Travel modes and URLs (`src/geo.js`)

- `TRAVEL_MODES` defines two modes: `foot` (OSRM base `routing.openstreetmap.de/routed-foot`, profile `foot`) and `car` (`.../routed-car`, profile `driving`).
- `routeUrl(from, to, base, { alternatives, via, mode, stops })` builds an OSRM URL with `lng,lat` order. Points are `from`, then the stops in order, then an optional `via`, then `to`. Alternatives are requested with `alternatives=3`.
- `searchUrl` / `parseSearchResults` handle Nominatim geocoding; `MIN_SUGGEST_CHARS` is 3.

## Stops

`addStop`, `removeStop`, `moveStop` never mutate their input list. `MAX_STOPS` is 5, and a place within `STOP_DUPLICATE_M` (20 m) of an existing stop counts as a duplicate. `mapPointStop` turns a map click into a stop.

## Route selection

`parseRoutes` / `parseRoute` read OSRM JSON. `detourWaypoints` proposes side waypoints used when OSRM returns no alternatives (not used when stops exist). `routeOverlap` measures how much of one route lies within 20 m of another. `pickRoutes` keeps the fastest route plus distinct alternatives (overlap under 0.8, distance at most 1.6x the shortest), up to 3.

## Pleasure indicator (walking only)

Helpers `routesBbox`, `lngLatToPixel`, `pathPixels`, `pathTiles`, `isGreenPixel`, `countGreenPixels` and `bestPleasure` count green pixels on OSM tiles along each route. In `src/app.js`: zoom 16, 4 px radius, at most 150 tiles, 20 s timeout, and a skip when the straight-line distance exceeds 15 km, in which case "Pleasure unavailable" is shown. The route with the most green pixels is marked "most pleasant".

## UI wiring (`src/app.js`)

It creates the Leaflet map (default view Paris, zoom 13) with OSM tiles, tracks the user position (`onPosition`), runs searches (`runSearch`), fetches and draws routes (`fetchRoutes`, `drawRoutes`, `selectRoute`), scores pleasure (`scorePleasure`) and renders the stops list (`renderStops`, `setStops`, `tryAddStop`). A sequence counter (`routeSeq`) discards stale responses.

## Tests

`npm test` runs `node --test test/`: `geo`, `modes`, `pleasure`, `routes`, `stops` and `readme-comment` tests.
