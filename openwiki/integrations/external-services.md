---
type: integration
title: External services, security and privacy
description: The third-party services Barnacle Maps calls from the browser (OSM tiles, Nominatim, OSRM on routing.openstreetmap.de, unpkg), what data each receives, and the security and privacy consequences of the design.
tags: [integration, security, privacy, osm, nominatim, osrm, unpkg]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# External services, security and privacy

Barnacle Maps has no backend: the browser calls every service directly over HTTPS, with plain `fetch` (or Leaflet / `<script>` tags), no API key, no credential and no cookie of its own. The data flow is drawn in [dataflow/DATAFLOW.md](../../dataflow/DATAFLOW.md).

| Service | Used for | What it receives | Code |
| --- | --- | --- | --- |
| `tile.openstreetmap.org` | Base map tiles; zoom 16 tiles for the [pleasure score](../features/walking-pleasure.md) | Tile coordinates (which reveal the viewed area and the walking routes) | `TILE_URL` in `src/app.js` |
| `nominatim.openstreetmap.org` | [Place search](../features/place-search.md) | The typed search text | `searchUrl` in `src/geo.js` |
| `routing.openstreetmap.de/routed-foot`, `/routed-car` | [Routing](../features/routing.md) | Exact coordinates of the user's position, every stop, detour waypoints and the destination | `TRAVEL_MODES`, `routeUrl` in `src/geo.js` |
| `unpkg.com` | Leaflet 1.9.4 JS and CSS | Page load only | `index.html` |

Library versions: [sbom/SBOM.md](../../sbom/SBOM.md).

## Usage limits

These are free community services with usage policies (Nominatim allows about one request per second; tile servers forbid heavy use). The app limits its load: suggestions are debounced (500 ms, at least 3 characters), at most 5 search results, at most 3 alternatives plus 2 detour requests per routing, and pleasure scoring stops beyond 150 tiles or 15 km and after 20 s. The app sets no custom `User-Agent` or contact header; the browser's `Referer` identifies it.

## Privacy

- The user's live position comes from `navigator.geolocation.watchPosition` (browser permission prompt; requires a secure context, i.e. HTTPS or `localhost`).
- That position is sent to OSRM as the start of every route request. Search text goes to Nominatim. Nothing is stored locally or sent to a server owned by the project.

## Security notes

- Panel content (search results, route labels, stop names, statuses, card) is written with `textContent`, never as HTML.
- Leaflet popups and tooltips render HTML: the destination marker uses `bindPopup(place.name)` and stop markers `bindTooltip("N. name")`, where names come from Nominatim's `display_name`. The stop marker icon HTML is only the stop number.
- Leaflet is loaded from unpkg without Subresource Integrity attributes, so the page trusts the CDN.
- Network failures surface as statuses ("Search failed: …", "Routing failed: …", "Pleasure unavailable") and never break the app.
