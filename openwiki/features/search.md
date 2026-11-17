---
type: feature
title: Place search and suggestions
description: How the search box queries Nominatim on submit and as-you-type, guards against stale answers, and turns each result into "route here" and "Add as stop" actions.
tags: [search, nominatim, geocoding, feature]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T14:30:06.574Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-17T14:30:06.574Z" }
---

# Place search and suggestions

The search box `#search-input` in the panel finds places with the public Nominatim geocoder.

## Requests

`searchUrl(query)` in `src/geo.js` builds

```
https://nominatim.openstreetmap.org/search?q=<query>&format=jsonv2&limit=5
```

and `parseSearchResults(json)` keeps, for each hit, `{ name: display_name, lat: Number(lat), lng: Number(lon) }`, dropping hits without a name or with non-finite coordinates. A non-array answer gives no results.

## Two triggers

- **Submit** (Enter or "Go") - cancels a pending suggestion and runs `runSearch(q)`, which sets the status to "Searching…".
- **Typing** - once the trimmed text has at least `MIN_SUGGEST_CHARS` (3) characters, a search runs 500 ms after the last keystroke (`SUGGEST_DELAY_MS`), without the "Searching…" status. The delay is there to respect Nominatim's rate limit. Shorter text clears the results and drops any in-flight suggestion.

## Stale answers

Each search takes a new `searchSeq` number. When the answer arrives, it is ignored if a newer search started, or if the user meanwhile picked a result, added a stop or cleared the box (all of these bump `searchSeq`). Errors show "Search failed: …" only for the current search. An empty list shows "No results."

## Result actions

Each result in `#results` is a row with two buttons:

- **Place name** - `showRoute(place)`: makes it the destination, puts its name in the box, places a marker and computes routes (see [Routing and travel modes](routing-and-travel-modes.md)).
- **Add as stop** - clears the box and results and calls `tryAddStop(place)` (see [Stops](stops.md)).

## Tests

`test/geo.test.js` covers `searchUrl` and `parseSearchResults`. The AI scenarios answer Nominatim with a fake (`tests/ai/support/fake-services.mjs`); see [Running and testing](../operations/running-and-testing.md).

## Related pages

- [Stops](stops.md)
- [External services and privacy](../integrations/external-services.md)
