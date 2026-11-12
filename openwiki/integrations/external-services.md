---
type: integration
title: External services and security notes
description: The public third-party services Barnacle Maps calls straight from the browser (OSM tiles, Nominatim, OSRM at routing.openstreetmap.de, and Leaflet from unpkg), how failures surface, and the privacy and security points that follow from that design.
tags: [integrations, openstreetmap, nominatim, osrm, leaflet, security, privacy]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# External services and security notes

Barnacle Maps has **no backend**. The browser calls every service directly from `src/app.js`, using URLs built by `src/geo.js`. Library and tool versions are recorded in the generated [software bill of materials](../../sbom/SBOM.md). At the moment it lists no lockfile packages, because Leaflet is loaded from a CDN rather than installed.

## Services

| Service | Endpoint | Used for | Defined in |
| --- | --- | --- | --- |
| OSM tile server | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Base map layer, and zoom-16 tiles decoded for the [pleasure score](../features/pleasure-score.md) | `TILE_URL` in `app.js` |
| Nominatim | `https://nominatim.openstreetmap.org/search` | [Place search](../features/place-search.md) (`jsonv2`, 5 results) | `searchUrl` in `geo.js` |
| OSRM (FOSSGIS) | `https://routing.openstreetmap.de/routed-foot` and `/routed-car`, `route/v1/{foot\|driving}` | [Routes](../features/routing.md), alternatives and detours | `TRAVEL_MODES` / `routeUrl` in `geo.js` |
| unpkg CDN | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.{css,js}` | The Leaflet map library, exposed as `window.L` | `index.html` |

All of these are free community services with fair-use policies. The app limits its load on them in three ways:

- type-ahead search is debounced by 500 ms and needs at least 3 characters;
- a route computation makes at most 3 OSRM requests (the main request plus 2 detours);
- pleasure scoring loads at most 150 tiles and only for walks under 15 km.

Moving to production traffic would mean self-hosting these services or using commercial providers. To do that, change the constants named above.

## Failure handling

- `fetchJson` throws `Request failed (<status>)` on any non-2xx response.
- Search failures show `Search failed: …`.
- Routing failures show `Routing failed: …`, or the "No … route found" message.
- A failed detour request is silently ignored.
- A failed or slow tile turns the whole pleasure batch into "Pleasure unavailable".
- None of these failures throws past its handler, and there is no retry logic.

## Privacy and security notes

- **Location sharing.** Geolocation runs with `enableHighAccuracy: true`. The user's coordinates, and the coordinates of every stop, are sent to the OSRM server in route URLs. Search queries go to Nominatim, and tile requests show the map area being viewed. No data is stored locally or sent anywhere else.
- **Secure context.** Browsers expose geolocation only on HTTPS or `localhost`. See [Running and configuration](../operations/running-locally.md).
- **DOM injection.** Place names from Nominatim and stop names are inserted with `textContent`, not `innerHTML`, which prevents HTML injection from geocoder data. The one HTML string is the stop-marker `divIcon`, which contains only the stop number.
- **Third-party script.** Leaflet is loaded from unpkg with a pinned version but without Subresource Integrity (`integrity=`) attributes, and there is no Content-Security-Policy. A compromised CDN could therefore inject script. Adding SRI hashes, or vendoring Leaflet, would close that gap.
- **Canvas reads.** Pleasure scoring reads tile pixels, which works only because the OSM tile server sends CORS headers. With a different tile provider, the canvas could become tainted and scoring would show as unavailable.
- **No credentials.** The app uses no API keys or secrets.
