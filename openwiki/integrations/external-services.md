---
type: "Reference"
title: "External services and dependencies"
openwiki_generated: true
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T11:56:00.654Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-832598c8183ff3da283ac785
    resource: repo://pins.json
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T11:56:00.654Z" }
---


# External services and dependencies

Barnacle Maps has no server of its own: the user's browser calls every service below directly. For the full picture of what moves where, see [`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md).

| Service | Used for | Where in code | Data sent |
|---|---|---|---|
| OSM tile server `tile.openstreetmap.org` | Map background (Leaflet tile layer) and zoom-16 tiles read for the [pleasure score](../features/pleasure-score.md) | `TILE_URL`, `loadTile` in `src/app.js` | Tile coordinates around the viewed area and the walking routes |
| Nominatim `nominatim.openstreetmap.org` | [Place search](../features/search-and-suggestions.md) | `searchUrl` in `src/geo.js` | Search text (also while typing, debounced) |
| FOSSGIS OSRM `routing.openstreetmap.de/routed-foot` and `/routed-car` | [Routing](../features/routing-and-alternatives.md) | `TRAVEL_MODES`, `routeUrl` in `src/geo.js` | The user's live position, the stops, detour points and the destination |
| `www.openstreetmap.org/directions` | [Phone hand-off](../features/phone-qr-handoff.md) link | `phoneRouteUrl` in `src/geo.js` | Start and destination (5 decimals) and the engine, but only when the user opens the link or scans the QR code |
| unpkg CDN | Leaflet (JS and CSS) and qrcode-generator | `index.html` | The page load only |

The app needs no API keys, tokens or other credentials for any of these services. It uses the public community endpoints, which have usage policies. That is why search suggestions are debounced and the pleasure score caps how many tiles it downloads.

## Dependencies and pinning

There is no `package-lock.json` and there are no npm runtime packages: `package.json` only defines the `start` and `test` scripts. The front-end libraries come from unpkg at fixed versions:

- **Leaflet**: a versioned unpkg URL in `index.html`, with no SRI hash.
- **qrcode-generator**: a versioned URL with a `sha384` Subresource Integrity hash and `crossorigin="anonymous"`. The same URL and hash are recorded in `pins.json`, so the factory's SBOM picks them up.

For the exact versions of all third-party components, see the software bill of materials [`sbom/SBOM.md`](../../sbom/SBOM.md). The factory generates it; never edit it by hand.

Related: [Architecture](../architecture/overview.md), [Running and security](../operations/running-and-security.md).
