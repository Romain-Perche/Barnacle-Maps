---
type: integration
title: External services and privacy
description: The public third-party services Barnacle Maps calls straight from the browser (Nominatim, OSRM, OSM tiles, unpkg), what data each receives including the user's position, how failures surface, and the security and usage-policy consequences.
tags: [integrations, nominatim, osrm, openstreetmap, privacy, security]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T14:30:06.574Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-17T14:30:06.574Z" }
---

# External services and privacy

Barnacle Maps has no server of its own: every outside call is made by the browser with `fetch` or by Leaflet / `<script>` tags. No API keys, accounts or credentials are used. For the diagrams of these flows see [dataflow/DATAFLOW.md](../../dataflow/DATAFLOW.md); for library versions see [sbom/SBOM.md](../../sbom/SBOM.md).

| Service | Used for | Called from | Data sent |
| --- | --- | --- | --- |
| Nominatim `nominatim.openstreetmap.org` | Place search | `searchUrl` / `runSearch` | The typed query text |
| OSRM `routing.openstreetmap.de/routed-{foot,car,bike}` | Routes | `routeUrl` / `fetchRoutes` | Coordinates of the user's **live position**, every stop and the destination |
| OSM tiles `tile.openstreetmap.org` | Base map, and zoom-16 tiles for the pleasure score | Leaflet `tileLayer`, `loadTile` | Tile coordinates around the viewed area and along routes |
| unpkg `unpkg.com/leaflet@1.9.4` | Leaflet JS and CSS | `index.html` | Nothing beyond the page load |

The browser Geolocation API (`navigator.geolocation.watchPosition`, high accuracy) supplies the position; it works only on `localhost` or HTTPS.

## Privacy

The user's precise position leaves the browser in every OSRM request URL, together with stops and destination. Search text goes to Nominatim. Tiles reveal the areas viewed and routed. Nothing is stored locally by the app.

## Failure behaviour

- **Nominatim** errors show "Search failed: …".
- **OSRM** `NoRoute` / `NoSegment` (HTTP 400) means "no route" for the mode; other errors show "Routing failed: …". Failed detour requests are silently dropped. See [Routing and travel modes](../features/routing-and-travel-modes.md).
- **Tiles** for the pleasure score: any failure or the 20 s timeout gives "Pleasure unavailable". See [Pleasure score](../features/pleasure-score.md).
- **Geolocation** denied: "Location unavailable. Allow location access to get directions."; unsupported: "Geolocation is not supported by this browser."

## Usage policy and security notes

- Suggestions are debounced to 500 ms with a 3-character minimum to stay within Nominatim's rate limit ([Place search](../features/search.md)).
- The pleasure score can fetch up to 150 extra tiles per route set; the 15 km and tile caps limit load on the OSM tile server.
- Leaflet is loaded from unpkg without a Subresource Integrity hash, so the page trusts the CDN.
- Place names from Nominatim are inserted with `textContent` (results, stop list) and route lines are created by Leaflet; the destination popup uses Leaflet `bindPopup(place.name)`, which renders a string as HTML, so the Nominatim display name is trusted there.

## Testing without the network

The test VM cannot reach these hosts. Unit tests use `test/fakes/osrm.js`, which checks request URLs against the official OSRM HTTP docs; the browser scenarios answer every service with `tests/ai/support/fake-services.mjs`. `.factory/test-env.md` records which fakes stand in for which service. See [Running and testing](../operations/running-and-testing.md).

## Related pages

- [Architecture overview](../architecture/overview.md)
