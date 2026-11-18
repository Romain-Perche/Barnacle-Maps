---
type: feature
title: Place search and suggestions
description: How the search box queries Nominatim, shows debounced suggestions while the user types, drops out-of-date replies, and turns a result into a destination or a stop.
tags: [search, nominatim, geocoding, ui]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T15:57:49.174Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-16T15:57:49.174Z" }
---

# Place search and suggestions

The search box at the top of the panel (`#search-form`, `#search-input`) finds places with the Nominatim geocoder. Each result can become the destination or a stop.

## Two ways to search

- **Submit** (Enter or "Go"): the `submit` handler cancels any pending suggestion timer and calls `runSearch(q)` with the trimmed query. The status line shows "Searching…".
- **Suggestions while typing**: the `input` handler waits `SUGGEST_DELAY_MS` (500 ms) after the last keystroke, then calls `runSearch(q, { announce: false })`. This keeps the app within Nominatim's rate limit. Queries shorter than `MIN_SUGGEST_CHARS` (3, from `src/geo.js`) fetch nothing. They clear the results and status and bump `searchSeq`, so a suggestion still in flight is dropped.

## Request and parsing

`searchUrl(query)` in `src/geo.js` builds `https://nominatim.openstreetmap.org/search?q=…&format=jsonv2&limit=5`, so at most 5 results come back. `parseSearchResults` maps each item to `{ name: display_name, lat, lng }` (converting `lat`/`lon` with `Number`). It drops items that have no name or non-finite coordinates, and returns `[]` for anything that is not an array.

`fetchJson` throws on a non-2xx status. `runSearch` catches the error and shows "Search failed: …", but only when its request is still the latest one.

## Stale replies

Each `runSearch` takes `seq = ++searchSeq` and ignores its result if `searchSeq` has changed by the time the reply arrives. These events bump `searchSeq`: a newer search, choosing a result (`showRoute`), "Add as stop", and shortening the query below the threshold. So an old suggestion list never replaces a newer one or reappears after a choice.

## Results

Each result is an `<li>` with two buttons whose text is set with `textContent`:

- **The place name** calls `showRoute(place)`. That sets `currentPlace`, puts the name in the input, clears the results, places a destination marker with a popup, and calls `updateRoutes()`. See [Routing and travel modes](routing-and-travel-modes.md).
- **"Add as stop"** (with an `aria-label` that names the place) clears the results and the input, then calls `tryAddStop(place)`. See [Stops](stops.md).

No results gives the status "No results.".

## Tests

`test/geo.test.js` checks that `searchUrl` encodes the query, that `parseSearchResults` converts and filters, and that `MIN_SUGGEST_CHARS` has a sensible value. The DOM behaviour is only checked by hand or by the AI scenarios. See [Testing](../testing/testing.md) and [External services](../integrations/openstreetmap-services.md).
