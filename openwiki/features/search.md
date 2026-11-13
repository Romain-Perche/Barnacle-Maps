---
type: feature
title: Place search and suggestions
description: How the search box queries Nominatim on submit and as debounced suggestions while typing, parses results, drops superseded responses and offers "go" or "Add as stop" per result.
tags: [search, nominatim, geocoding, ui]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T11:32:10.059Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
generated: { by: "claude-code", at: "2026-11-13T11:32:10.059Z" }
---

# Place search and suggestions

## Requests

`searchUrl(query)` in `src/geo.js` builds
`https://nominatim.openstreetmap.org/search?q=<query>&format=jsonv2&limit=5` (query encoded with
`URLSearchParams`). `runSearch` in `src/app.js` fetches it through `fetchJson`, which throws
`Request failed (<status>)` on a non-OK response.

Two triggers:

- **Submit** (Enter or "Go"): searches the trimmed text immediately and shows `Searching…`.
- **Typing**: once the trimmed text has at least `MIN_SUGGEST_CHARS` (3) characters, a search runs
  500 ms after the last keystroke, silently (no "Searching…"). The debounce respects Nominatim's
  rate limit. Shorter text clears the results and cancels pending suggestions.

## Results

`parseSearchResults` maps each item to `{ name: display_name, lat, lng }` (numbers parsed from
Nominatim's strings, `lon` renamed `lng`) and drops items without a name or with non-finite
coordinates; a non-array response gives no results. Each result is a list item with two buttons:

- the place name: sets it as destination (`showRoute`), puts its name in the input, drops the
  marker and starts [routing](routing.md);
- **Add as stop**: clears the search and adds the place to the [stops](stops.md).

`No results.` is shown for an empty list, and `Search failed: <message>` on error. Names are
inserted with `textContent`, never as HTML.

## Superseding

Each search takes a new `searchSeq`; a response whose number is no longer current is discarded.
Choosing a result, adding a stop or clearing the text also bumps `searchSeq`, so a late suggestion
never reopens the list.
