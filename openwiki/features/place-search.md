---
type: feature
title: Place search and suggestions
description: How the search panel queries Nominatim while typing or on submit, biases results near the user's position, sorts them nearest first with a distance column, and drops stale responses.
tags: [search, nominatim, geocoding, ui]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T11:34:31.384Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-82a6c108a0cce47d4fee63ff
    resource: repo://test/sort-results.test.js
generated: { by: "claude-code", at: "2026-11-17T11:34:31.384Z" }
---

# Place search and suggestions

The search box at the top of the panel finds places with the public Nominatim geocoder. Code lives
in `runSearch` and the form/input handlers in `src/app.js`, and in `searchUrl`,
`parseSearchResults` and `sortByDistance` in `src/geo.js`.

## Triggers

- **Submit** (Enter or "Go"): cancels any pending suggestion timer and runs the search with the
  "Searching…" status.
- **Typing**: once the trimmed query has at least `MIN_SUGGEST_CHARS` (3) characters, a search
  runs after `SUGGEST_DELAY_MS` (500 ms) without input, to respect Nominatim's rate limit. Shorter
  input clears the list and bumps `searchSeq`, which drops any in-flight suggestion.

## Request

`searchUrl(query, base, near)` builds
`https://nominatim.openstreetmap.org/search?q=…&format=jsonv2&limit=5`. When the user's position
is known it adds a `viewbox` of ±`NEAR_BOX_DEG` (0.25°) latitude around them, with the longitude
half-width widened by `1 / cos(latitude)` and clamped to valid coordinates. It never sets
`bounded=1`, so the viewbox is only a preference: Nominatim still returns farther matches when
nothing near matches.

`parseSearchResults` keeps only entries with a `display_name` and finite `lat`/`lon`, mapped to
`{ name, lat, lng }`. Anything that is not an array gives an empty list.

## Ordering and distance column

`sortByDistance(results, position)` adds a straight-line (haversine) `distance` in metres to each
place and sorts nearest first. `Array.prototype.sort` is stable, so places at the same distance
keep Nominatim's order. Without a position it returns a copy in the original order with no
`distance`.

Each result row is a name button (choose as destination, see [Routing](routing.md)), then — only
when a distance exists — a `span.distance` formatted by `formatDistance` (`420 m`, `1.50 km`,
`12.3 km`), then the "Add as stop" button (see [Stops](stops.md)). Without a position the row
layout is unchanged from before the feature.

## Stale responses and errors

`runSearch` takes `++searchSeq` and ignores its response if the counter changed meanwhile — a
newer search, a cleared input, a chosen result or an added stop all bump it. Failures show
`Search failed: <message>` only if the failing search is still current; an empty result shows
"No results.".

## Tests

`test/sort-results.test.js` covers `sortByDistance` (order, tie stability, no position, no
mutation) and the `viewbox` in `searchUrl`; `test/geo.test.js` covers the base URL, parsing and
formatting. The AI scenarios `tests/ai/us1-nearest-first.md` and `tests/ai/us2-distance-column.md`
check the behaviour in a real browser. See [Testing](../testing/tests.md) and
[External services](../integrations/openstreetmap-services.md).
