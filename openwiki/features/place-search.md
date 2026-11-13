---
type: feature
title: Place search
description: How the search box queries Nominatim on submit and with debounced suggestions while typing, parses up to five results, and lets the user route to a result or add it as a stop.
tags: [feature, search, nominatim, geocoding]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-3390e37fd07ec2f303755cde
    resource: repo://test/geo.test.js
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# Place search

The panel's search form (`#search-form`, `#search-input`) finds places with the public [Nominatim](https://nominatim.openstreetmap.org) geocoder.

## Request and parsing (`src/geo.js`)

- `searchUrl(query)` builds `https://nominatim.openstreetmap.org/search?q=…&format=jsonv2&limit=5` (the base URL is a parameter so tests can override it).
- `parseSearchResults(json)` maps each result to `{ name: display_name, lat, lng }` (converting the string `lat`/`lon` to numbers) and drops entries without a name or with non-finite coordinates. Anything other than an array gives `[]`.

## Triggers (`src/app.js`)

- **Submit** ("Go"): cancels any pending suggestion timer and runs a search with status "Searching…".
- **Typing**: once the trimmed text has at least `MIN_SUGGEST_CHARS` (3) characters, a search runs after `SUGGEST_DELAY_MS` (500 ms) of inactivity, silently (no "Searching…" status). The debounce exists to respect Nominatim's rate limit. Shorter text clears the results and drops any in-flight suggestion.

Each search takes a new `searchSeq`; a response that arrives after a newer search, a result click or a cleared input is discarded (see [App state and request lifecycle](../architecture/app-state-and-lifecycle.md)).

## Results

Each result row has two buttons:

- the place name: `showRoute(place)` sets it as destination, drops a marker with a popup and computes routes ([Routing](routing.md));
- **Add as stop**: clears the search and calls `tryAddStop(place)` ([Stops](stops.md)).

No results show "No results."; a failed request (network error or non-2xx) shows "Search failed: …". Result names are inserted with `textContent`, never as HTML.

See [External services](../integrations/external-services.md) for what is sent to Nominatim.
