---
type: feature
title: Place search
description: How the search box queries Nominatim on submit and as debounced suggestions while typing, how results are parsed and rendered with "route" and "Add as stop" actions, and how stale searches are discarded.
tags: [feature, search, nominatim, geocoding, debounce]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T15:51:15.781Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-3390e37fd07ec2f303755cde
    resource: repo://test/geo.test.js
generated: { by: "claude-code", at: "2026-11-12T15:51:15.781Z" }
---

# Place search

The panel's search box (`#search-input` in `#search-form`) finds places with the public [Nominatim](https://nominatim.org) geocoder. Each result becomes a row in `#results` with two buttons:

- the place name — sets it as the destination (`showRoute`) and starts [routing](../features/routing.md);
- **Add as stop** (aria-label `Add <name> as stop`) — appends it to the [stops](../features/stops.md), clears the results and the input.

## Requests

`searchUrl(query)` builds `https://nominatim.openstreetmap.org/search?q=…&format=jsonv2&limit=5` (query URL-encoded via `URLSearchParams`). `parseSearchResults(json)` maps each item to `{ name: display_name, lat, lng }` with numeric coordinates (`lon` → `lng`) and drops items without a name or with non-finite coordinates; non-array input gives `[]`.

## Two triggers

| Trigger | Behaviour |
| --- | --- |
| Form submit (Enter / **Go**) | Cancels the pending suggestion timer and searches immediately; status shows `Searching…`. |
| Typing (`input` event) | If the trimmed text has fewer than `MIN_SUGGEST_CHARS` (3) characters: drops in-flight suggestions, clears results and status. Otherwise schedules a silent search after 500 ms (`SUGGEST_DELAY_MS`); each keystroke restarts the timer. |

The debounce exists to respect Nominatim's rate limit (about one request per second).

## Outcomes

- Results → rows rendered, status cleared.
- None → `No results.`
- Error → `Search failed: <message>` (from `fetchJson`, e.g. `Request failed (503)`).

## Stale-result protection

`runSearch` captures `++searchSeq` and ignores its response if `searchSeq` changed meanwhile. The counter is also bumped when a destination is chosen, when **Add as stop** is clicked and when the text gets too short, so a late suggestion never re-opens the list after the user has moved on. See [Architecture overview](../architecture/overview.md).

Choosing a destination also puts its name in the input, replaces the destination marker (popup with the name) and recomputes routes.

## Tests

`test/geo.test.js` covers `searchUrl` encoding, `parseSearchResults` conversion/filtering and the `MIN_SUGGEST_CHARS` threshold. App tests drive search through the harness's scripted `search` fetch handler (see [Test suite](../testing/test-suite.md)).

## Related pages

- [Stops](../features/stops.md)
- [Routing and travel modes](../features/routing.md)
- [Architecture overview](../architecture/overview.md)
