---
type: integration
title: External services and privacy
description: The third-party services Barnacle Maps calls directly from the browser — Nominatim, OSRM on routing.openstreetmap.de, the OSM tile server and the unpkg CDN — what each receives and returns, how failures are handled, and the privacy and security consequences.
tags: [integration, nominatim, osrm, openstreetmap, privacy, security]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T16:11:40.024Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T16:11:40.024Z" }
---

# External services and privacy

Barnacle Maps has no backend: the browser calls every service directly with `fetch` (via `fetchJson` for JSON APIs). No API keys, credentials or custom headers are used. The diagram of these flows is in [dataflow/DATAFLOW.md](../../dataflow/DATAFLOW.md).

| Service | Endpoint | Sent | Received | Used by |
| --- | --- | --- | --- | --- |
| Nominatim | `https://nominatim.openstreetmap.org/search` | the typed query text | up to 5 places (name, lat, lon) | [Place search](../features/search.md) |
| OSRM walking | `https://routing.openstreetmap.de/routed-foot/route/v1/foot/…` | coordinates of your position, stops, detour waypoint, destination | route geometries, distances, durations | [Routing](../features/routing.md) |
| OSRM car | `https://routing.openstreetmap.de/routed-car/route/v1/driving/…` | same | same | [Routing](../features/routing.md) |
| OSM tiles | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | tile coordinates (map view; zoom-16 tiles along walking routes) | PNG tiles | Leaflet map, [Pleasure](../features/pleasure.md) |
| unpkg CDN | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.{js,css}` | — | Leaflet library | `index.html` |

The library versions are recorded in [sbom/SBOM.md](../../sbom/SBOM.md).

## Failure handling

- `fetchJson` throws `Request failed (<status>)` on a non-2xx response; callers turn it into a status line ("Search failed: …", "Routing failed: …").
- Detour requests use `Promise.allSettled`, so a failed detour only removes that candidate.
- Tile failures or the 20 s timeout make pleasure show "Pleasure unavailable"; routes stay visible.
- There is no retry and no caching layer beyond the browser's HTTP cache.

## Rate limits and usage policies

These are free community services with usage policies. The app limits load by debouncing suggestions (500 ms, ≥ 3 characters), limiting results to 5, and capping pleasure at 150 tiles and 15 km. The browser's default `User-Agent`/`Referer` are sent; no custom identification is set.

## Privacy and security notes

- **Location leaves the device**: every route request puts your precise live position (and your stops) in the URL sent to `routing.openstreetmap.de`. Tile requests along a walking route also reveal the route's area to the tile server.
- **Search text** is sent to Nominatim as you type (after 3 characters).
- Geolocation needs a secure context (localhost or HTTPS); without permission, status shows "Location unavailable…" and routes cannot be computed.
- Leaflet is loaded from unpkg **without Subresource Integrity** (`integrity` attribute), so the page trusts the CDN to serve the expected file.
- Place names from Nominatim are written with `textContent` in the panel (result list, stop list), but they are also passed as strings to Leaflet's `bindPopup` (destination marker) and `bindTooltip` (stop markers), which Leaflet inserts as HTML. That Nominatim data therefore reaches an HTML sink.
