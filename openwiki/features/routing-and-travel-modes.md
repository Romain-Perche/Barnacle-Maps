---
type: feature
title: Routing and travel modes
description: How Barnacle Maps computes and shows up to three walk, car or bike routes with OSRM, covering the TRAVEL_MODES table, the segmented mode selector, URL building, alternatives, walking-only detours, route de-duplication, drawing and status messages.
tags: [routing, osrm, travel-modes, bike, ui]
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
  - id: openwiki-source-9a6d805649b823477f244ab2
    resource: repo://styles.css
generated: { by: "claude-code", at: "2026-11-16T15:57:49.174Z" }
---

# Routing and travel modes

Once a destination is chosen, the app asks OSRM for routes from the user's live position, through any [stops](stops.md), to the destination. It then shows up to 3 routes on the map and in the `#routes` list.

## Travel modes

`TRAVEL_MODES` in `src/geo.js` is the single source of per-mode behaviour. Each entry has:

| Key | Label | OSRM server | Profile | `pleasure` | `detours` |
| --- | --- | --- | --- | --- | --- |
| `foot` | 🚶 Walk | `routing.openstreetmap.de/routed-foot` | `foot` | yes | yes |
| `car` | 🚗 Car | `routing.openstreetmap.de/routed-car` | `driving` | no | no |
| `bike` | 🚲 Bike | `routing.openstreetmap.de/routed-bike` | `bike` | yes | no |

Each entry also carries the status texts: `computing` ("Computing cycling routes…"), `noRoute`, and `single` / `plural` ("by bike", "cycling"). `src/app.js` reads these flags and texts instead of comparing mode names, and an unknown mode falls back to `foot`.

### The selector

`index.html` has `#mode`, a `role="radiogroup"` with three radio inputs (`foot` checked by default). Each input is followed by an outer `<span>` holding an `aria-hidden` emoji and the label text. `styles.css` turns this into a segmented control: inputs are visually hidden, `#mode input + span` is the button, the checked segment gets a `#e8f0fe` background and blue text, and `:focus-visible` draws an outline. The padding and `display: block` rules target only the outer span (`input + span`), so the nested emoji span stays inline. Changing the radio sets `mode` and, if a destination is set, calls `updateRoutes()`. Stops are kept.

## Building the request

`routeUrl(from, to, base, { alternatives, via, mode, stops })` builds
`{base}/route/v1/{profile}/{lng,lat;…}?overview=full&geometries=geojson[&alternatives=3]`.
Points are in OSRM's `lng,lat` order: start, then stops in list order, then the optional `via` detour waypoint, then the destination. An explicit `base` replaces the mode's server but keeps its profile.

## fetchRoutes: alternatives and detours

`fetchRoutes(place, seq, mode, stops)` in `src/app.js`:

1. Requests the main route with alternatives and parses every route with `parseRoutes`. This keeps only `code: "Ok"` responses with GeoJSON geometry, and flips coordinates to `[lat, lng]`.
2. With stops, or with 2 or more routes, or for a mode whose `detours` is false (car, bike), it returns `pickRoutes(main)`.
3. Otherwise (walking, fewer than 2 routes, no stops), it asks for two **detour routes** through `detourWaypoints(position, place)`. These are two points on either side of the midpoint of the straight line, offset by `max(150 m, 0.25 × distance)`. Failed detour requests are ignored (`Promise.allSettled`).

`pickRoutes(candidates, 3)` sorts by duration and always keeps the fastest. It adds a candidate only if its distance is at most 1.6 × the shortest and fewer than 80% of its 25 m samples lie within 20 m of a route already kept (`routeOverlap`).

## Drawing and selection

`drawRoutes` adds one grey polyline and one list button per route ("Route n · distance · duration", formatted by `formatDistance` and `formatDuration`). For modes with pleasure it adds a pleasure line too. `selectRoute(i)` makes route i blue and on top, and sets `aria-pressed` on its button. You can select a route from the list or by clicking its line. The map then fits all routes and markers.

## Status messages

`updateRoutes` shows:

- `Waiting for your location to compute a route…` when no position is known yet (`pendingRoute` is set and the map centres on the destination);
- the mode's `computing` text while fetching;
- `Routing failed: …` on a network/HTTP error, or `No … route found.` with a stops-specific variant ("Try removing a stop.");
- on success, either `"<distance> · <duration> by bike"` for one route or `"3 cycling routes · fastest …"`, with ` via N stops` added when there are stops.

Then, for modes with pleasure, it starts the [pleasure score](pleasure-score.md). The OSRM service is described in [External services](../integrations/openstreetmap-services.md).

## Tests

- `test/routes.test.js`: `routeUrl`, `parseRoutes`, `detourWaypoints`, `samplePath`, `pointToSegmentDistance`, `routeOverlap`, `pickRoutes`, `routesBbox`, plus static checks on `index.html`, `app.js` and `README.md`.
- `test/modes.test.js`: car mode URLs and the fallback to walking.
- `test/bike.test.js`: the bike entry, mode order, detours only for walking, pleasure for foot and bike only, bike URLs with stops, the segmented selector markup and CSS, and that `app.js` reads `TRAVEL_MODES` flags.
- `tests/ai/us1-cycling-routes.md`, `us2-switch-modes.md`: browser scenarios for the bike feature.
