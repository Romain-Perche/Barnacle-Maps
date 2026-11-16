---
type: feature
title: Place search and suggestions
description: How the search box calls the Nominatim geocoder, both when the form is submitted and as debounced suggestions while the user types. It also covers how results are parsed and listed, how stale answers are dropped, and the per-result "Go" and "Add as stop" actions.
tags: [feature, search, nominatim, geocoding]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T11:56:00.654Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T11:56:00.654Z" }
---

# Place search and suggestions

The search box (`#search-form` / `#search-input`) finds places with the Nominatim geocoder.

## Requests

- `searchUrl(query)` in `src/geo.js` builds `https://nominatim.openstreetmap.org/search?q=…&format=jsonv2&limit=5`.
- `parseSearchResults(json)` maps each hit to `{ name: display_name, lat, lng }` and drops entries without a name or with non-numeric coordinates. A response that is not an array gives `[]`.
- `runSearch` in `src/app.js` calls `fetchJson`, which throws on a non-2xx response. Errors appear as "Search failed: …".

## Two triggers

- **Submit** (Enter or "Go"): cancels any pending suggestion timer and searches right away, showing "Searching…".
- **Typing**: once the trimmed query has at least `MIN_SUGGEST_CHARS` (3) characters, a search runs 500 ms after the last keystroke, without the "Searching…" message. The debounce keeps the app within Nominatim's rate limit. Shorter input clears the results and cancels any search in flight.

Each search takes a new number from `searchSeq`. A reply whose number is no longer current is ignored, so a slow answer never replaces a newer one. Picking a result or adding a stop also increments `searchSeq`.

## Results

Each result is a list item with two buttons:
- **Place name**: `showRoute(place)` sets the destination, puts the name in the input, drops a marker and computes the routes (see [Routing](routing-and-alternatives.md)).
- **"Add as stop"**: clears the search and calls `tryAddStop(place)` (see [Stops](stops.md)).

"No results." appears when Nominatim returns nothing usable. The search query is sent to a third-party service; see [External services](../integrations/external-services.md).

Tests: `test/geo.test.js` covers `searchUrl` and `parseSearchResults`, along with the formatting helpers.
