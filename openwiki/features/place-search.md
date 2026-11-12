---
type: feature
title: Place search and suggestions
description: How the search box finds places through Nominatim, with an explicit Go submit and debounced type-ahead suggestions. Covers the result list and its "Add as stop" buttons, and how searchSeq drops stale responses.
tags: [search, nominatim, geocoding, suggestions, ui]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# Place search and suggestions

The search form (`#search-form` with `#search-input`) finds places through [Nominatim](../integrations/external-services.md). The browser code is `runSearch` and the input/submit handlers in `src/app.js`. The pure parts, `searchUrl`, `parseSearchResults` and `MIN_SUGGEST_CHARS`, are in `src/geo.js` (see [Pure geo helpers](../architecture/geo-helpers.md)).

## Two triggers

- **Submit** (the Go button or Enter): cancels any pending suggestion timer and runs `runSearch(q)` right away, showing "Searching…" in the status line.
- **Typing**: each `input` event clears the timer.
  - If the trimmed query has fewer than `MIN_SUGGEST_CHARS` (3) characters, it clears the results and the status, and bumps `searchSeq` to drop any suggestion still in flight.
  - Otherwise it schedules `runSearch(q, { announce: false })` after `SUGGEST_DELAY_MS` (500 ms). The debounce keeps the app within Nominatim's usage policy of about 1 request per second.

Each request asks for at most 5 results in `jsonv2` format.

## Results

`parseSearchResults` turns the response into `{ name, lat, lng }` items. Each item becomes an `<li>` with two buttons:

1. **The place name.** It calls `showRoute(place)`, which:
   - sets `currentPlace` and fills the input with the place name;
   - clears the results and moves the destination marker;
   - calls `updateRoutes()` (see [Routing](routing.md)).
2. **"Add as stop".** It clears the input and the results, then calls `tryAddStop(place)` (see [Stops](stops.md)).

If there are no results, the status shows "No results.". If the request fails, it shows `Search failed: <message>`. `fetchJson` throws on any non-2xx status.

## Stale responses

`runSearch` takes `seq = ++searchSeq` and returns without rendering if `seq !== searchSeq` when the response arrives. Several actions also bump `searchSeq`: choosing a result (`showRoute`), adding a stop from the results, and shortening the query below 3 characters. This keeps a slow suggestion from bringing back a list the user already dismissed. Errors are shown only when they belong to the latest search.
