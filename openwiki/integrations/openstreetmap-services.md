---
type: integration
title: External services
description: Every outside service the Barnacle Maps browser app talks to — Nominatim, OSRM, the OSM tile server, the unpkg CDN and browser geolocation — with what is sent, what comes back and how failures show.
tags: [integrations, openstreetmap, nominatim, osrm, privacy]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T11:34:31.384Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-17T11:34:31.384Z" }
---

# External services

All calls are made directly from the user's browser; there is no proxy, API key or server of our
own in between. The diagram of these flows is in
[`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md).

| Service | Called from | Sent | Received | On failure |
| --- | --- | --- | --- | --- |
| Nominatim `nominatim.openstreetmap.org/search` | `searchUrl` / `runSearch` | Query text, `format=jsonv2`, `limit=5`, and a `viewbox` around the user's position when known | Places (`display_name`, `lat`, `lon`) | "Search failed: …" status |
| OSRM `routing.openstreetmap.de/routed-foot` and `/routed-car` | `routeUrl` / `fetchRoutes` | User position, stops, optional detour waypoint, destination | Route geometry (GeoJSON), distance, duration | "Routing failed" / "No … route found" status |
| OSM tiles `tile.openstreetmap.org` | Leaflet tile layer; `loadTile` | Tile coordinates (which reveal the area viewed and the route) | PNG tiles | Map tiles missing; pleasure shows "Pleasure unavailable" |
| unpkg `unpkg.com/leaflet@1.9.4` | `index.html` | — | Leaflet JS and CSS | App cannot start |
| Browser geolocation | `navigator.geolocation.watchPosition` | — | Live latitude/longitude (high accuracy) | "Location unavailable…" status; search unsorted, routes wait |

## Notes

- **Privacy**: the user's coordinates leave the browser to Nominatim (as the `viewbox`) and to
  OSRM (as the route start). Nothing is stored by the app itself.
- **Rate limits**: these are free community services. Suggestions are debounced 500 ms and need 3
  characters; pleasure scoring caps tile fetches at 150 per request and only runs for walks under
  15 km straight-line. See [Place search](../features/place-search.md) and
  [Pleasure score](../features/pleasure-score.md).
- **Response handling**: `fetchJson` throws `Request failed (<status>)` on non-2xx; parsers
  (`parseSearchResults`, `parseRoutes`) return empty lists on unexpected shapes instead of
  throwing.
- **Leaflet integrity**: the CDN scripts are loaded without Subresource Integrity attributes.
- Service base URLs are constants in `src/geo.js` (`searchUrl` default, `TRAVEL_MODES`) and
  `src/app.js` (`TILE_URL`); see [Running and configuration](../operations/running-and-configuration.md).
