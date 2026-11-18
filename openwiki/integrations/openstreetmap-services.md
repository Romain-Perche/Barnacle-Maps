---
type: integration
title: External services
description: The third-party services the Barnacle Maps browser app calls (Nominatim, OSRM on routing.openstreetmap.de, OpenStreetMap tiles and unpkg), what each one receives, how failures are handled, and the privacy and usage-policy consequences.
tags: [integrations, openstreetmap, nominatim, osrm, privacy]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T15:57:49.174Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T15:57:49.174Z" }
---

# External services

Barnacle Maps has no server of its own. The browser calls public services directly, with no API keys and no credentials. For a diagram of these flows, see [dataflow/DATAFLOW.md](../../dataflow/DATAFLOW.md).

| Service | URL | Called from | What is sent | What comes back |
| --- | --- | --- | --- | --- |
| Nominatim geocoder | `https://nominatim.openstreetmap.org/search` | `searchUrl` (`src/geo.js`), `runSearch` (`src/app.js`) | The typed query text | Up to 5 places with name and coordinates |
| OSRM walking | `https://routing.openstreetmap.de/routed-foot` | `routeUrl`, `fetchRoutes` | Coordinates of the user's position, stops, optional detour waypoint and destination | Route geometry (GeoJSON), distance, duration |
| OSRM car | `https://routing.openstreetmap.de/routed-car` (profile `driving`) | same | same | same |
| OSRM bike | `https://routing.openstreetmap.de/routed-bike` (profile `bike`) | same | same | same |
| OSM tiles | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Leaflet tile layer, and `loadTile` for the [pleasure score](../features/pleasure-score.md) | Tile coordinates | PNG map tiles |
| unpkg CDN | `https://unpkg.com/leaflet@1.9.4/…` | `index.html` | — | Leaflet JS and CSS |

## Failure handling

- `fetchJson` throws `Request failed (status)` for any non-2xx response. Search shows "Search failed: …". Routing shows "Routing failed: …", or a "No … route found." message when there are stops.
- An OSRM reply that is not `code: "Ok"`, or that has no routes, parses to `[]` and gives the mode's "No … route found." message.
- Detour route requests use `Promise.allSettled`, so a failed detour is simply left out.
- Pleasure tile downloads share one `AbortController` with a 20 s timeout. Any failure turns every route's line into "Pleasure unavailable".
- If unpkg cannot be reached, `window.L` is undefined and the app does not start.

## Usage policies

These are shared community services with usage policies:

- Nominatim allows about one request per second. The app debounces suggestions by 500 ms, needs at least 3 characters, and drops superseded replies. Fast typing can still send several requests.
- The pleasure score can download up to 150 zoom-16 tiles per route request from `tile.openstreetmap.org`, on top of normal map browsing.
- Requests carry no custom `User-Agent` or `Referer` header beyond what the browser sends.

## Privacy

The user's precise live position (from `watchPosition` with `enableHighAccuracy: true`) is sent to `routing.openstreetmap.de` as the first point of every route request. The position is not sent to Nominatim: search queries are text only. Tile requests show the map area being viewed. Nothing is stored locally. See also [Running, configuration and security](../operations/running-and-configuration.md).
