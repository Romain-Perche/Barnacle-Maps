---
type: feature
title: Place search
description: How Barnacle Maps searches places with Nominatim - submitted searches and debounced suggestions while typing, result parsing, stale-answer guarding, and choosing a result as destination or stop.
tags: [search, nominatim, geocoding, feature]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-18T18:14:22.657Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-18T18:14:22.657Z" }
---

# Place search

The search box at the top of the panel turns text into places using the public Nominatim geocoder. Each result can become the destination (which starts [routing](routing-and-travel-modes.md)) or a [stop](stops.md).

## Requests

`searchUrl(query)` in `src/geo.js` builds `https://nominatim.openstreetmap.org/search?q=…&format=jsonv2&limit=5`, so at most 5 results come back. `runSearch` in `src/app.js` fetches it with `fetchJson` (any non-OK status is an error).

Two triggers:

- **Submit** (Enter or "Go"): cancels any pending suggestion timer and searches the trimmed text, showing "Searching…".
- **Typing**: once the trimmed text has at least 3 characters (`MIN_SUGGEST_CHARS`), a suggestion search runs 500 ms after the last keystroke (`SUGGEST_DELAY_MS`), without the "Searching…" status. The debounce keeps the app within Nominatim's usage policy. Below 3 characters the results are cleared and any in-flight suggestion is dropped.

## Results

`parseSearchResults` maps each Nominatim item to `{ name: display_name, lat, lng }` (numbers from the string `lat`/`lon`) and drops items without a name or with non-finite coordinates; a non-array answer gives no results. The list shows, per place, a button with its name and an "Add as stop" button. Empty results show "No results.", errors "Search failed: …".

- Clicking the name calls `showRoute(place)`: it becomes `currentPlace`, the input shows its name, the list is cleared, a destination marker with a popup is placed, and routes are computed.
- "Add as stop" clears the input and list and tries to add the place as a stop.

## Stale answers

Every search takes a new `searchSeq`; choosing a result, adding a stop or shortening the text also bumps it. An answer whose sequence is no longer current is ignored, so a slow suggestion never overwrites newer results or reappears after a choice.

## Tests

`test/geo.test.js` covers `searchUrl`, `parseSearchResults` and `MIN_SUGGEST_CHARS`. The app harness (`test/fakes/app-harness.js`) and the AI harness answer Nominatim with a fake place in the documented jsonv2 shape. See [Testing](../testing/testing.md).

## Related pages

- [Routing and travel modes](routing-and-travel-modes.md), [Stops](stops.md)
- [Architecture overview](../architecture/overview.md)
