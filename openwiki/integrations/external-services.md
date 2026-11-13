---
type: integration
title: External services, privacy and security
description: The third-party services the Barnacle Maps browser app calls directly (Nominatim, OSRM, OSM tiles, unpkg), what data each receives, how failures are handled, and the security-relevant properties of the app.
tags: [integrations, security, privacy, openstreetmap]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T11:32:10.059Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T11:32:10.059Z" }
---

# External services, privacy and security

The app has no backend: every outside call is made by the user's browser. The full model of what
moves where is in [`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md).

## Services

| Service | Called from | Receives | Returns | On failure |
|---|---|---|---|---|
| Nominatim `nominatim.openstreetmap.org/search` | `searchUrl` / `runSearch` | the search text | up to 5 places | `Search failed: …` |
| OSRM `routing.openstreetmap.de/routed-foot` and `/routed-car` | `routeUrl` / `fetchRoutes` | coordinates of the user's position, stops, detour points and destination | route geometries, distances, durations | `Routing failed: …` (detour failures ignored) |
| OSM tiles `tile.openstreetmap.org` | Leaflet tile layer; `loadTile` for [pleasure](../features/pleasure.md) | tile coordinates (which reveal the viewed or walked area) | PNG tiles | map gaps; `Pleasure unavailable` |
| unpkg `unpkg.com` | `index.html` | - | Leaflet JS/CSS and the `convert` module | no map if Leaflet fails; whole-metre distances if `convert` fails |

None of the calls carry credentials or custom headers, and the app has no API keys or secrets.
Library versions are pinned in the URLs and listed in [`sbom/SBOM.md`](../../sbom/SBOM.md).

## Privacy

- The user's position comes from `navigator.geolocation.watchPosition` (high accuracy) and is sent
  to OSRM as the route start of every routing request. It is not sent to Nominatim.
- Nothing is stored: no cookies, `localStorage` or server-side storage.

## Fair use of the OSM services

The public OSM services have usage policies. The code limits load: suggestions are debounced
(500 ms, at least 3 characters) "to respect Nominatim's rate limit"; at most 2 extra detour
requests per walk; pleasure scoring is skipped above 15 km straight-line or 150 tiles and times
out after 20 s.

## Security notes

- Search results, stop names, route texts and status messages are inserted with `textContent`.
- Leaflet popups and tooltips are given strings: the destination popup (`bindPopup(place.name)`)
  and stop tooltips (`bindTooltip`) receive names from Nominatim or map-click labels, and Leaflet
  renders string content as HTML. Treat these as the places where third-party text reaches HTML.
- The unpkg `<script>`, stylesheet and import-map entries have pinned versions but no Subresource
  Integrity attributes, so the app trusts unpkg to serve the right files.
- Geolocation requires a secure context: `localhost` or HTTPS (see
  [Running and dependencies](../operations/running-and-dependencies.md)).
