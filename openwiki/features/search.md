---
type: feature
title: Place search, suggestions and the clear button
description: How the search box queries Nominatim on submit and with debounced suggestions while typing, how results become a destination or a stop, and what the × clear button resets.
tags: [feature, search, nominatim, accessibility]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T16:11:40.024Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-9a6d805649b823477f244ab2
    resource: repo://styles.css
generated: { by: "claude-code", at: "2026-11-13T16:11:40.024Z" }
---

# Place search, suggestions and the clear button

## Searching

The search form (`#search-form`) has a text input, a × clear button and a **Go** button.

- **Submit (Go / Enter)** — cancels any pending suggestion timer and runs `runSearch(q)` with the trimmed text, which shows "Searching…".
- **Suggestions while typing** — on every `input` event, once the trimmed text has at least `MIN_SUGGEST_CHARS` (3) characters, a search runs after a 500 ms debounce (`SUGGEST_DELAY_MS`), silently (no "Searching…"). The debounce exists to respect Nominatim's rate limit. Below 3 characters, results and status are cleared and any in-flight suggestion is dropped.

`searchUrl` builds `https://nominatim.openstreetmap.org/search?q=…&format=jsonv2&limit=5`; `parseSearchResults` keeps entries with a `display_name` and finite `lat`/`lon`. Errors show "Search failed: …"; no match shows "No results.".

## Results

Each result is a row with two buttons:

- the **place name** — calls `showRoute(place)`: sets it as destination, puts its name in the box, clears the results, adds a destination marker and computes routes ([Routing](routing.md));
- **Add as stop** — empties the box and the results and adds the place to the stop list ([Stops](stops.md)).

Stale responses are dropped with `searchSeq` — see [App state](../architecture/app-state-and-ui.md).

## The clear button (×)

Added by feature PILOT-85820 (`specs/pilot-85820-clear-button-for-the-search-box/`).

- `#search-clear` is a `type="button"` element with `aria-label="Clear search"`, placed inside `.search-box` after the input and before Go, so it is in tab order and never submits the form.
- `syncClear()` shows it whenever the box is non-empty (even whitespace) and hides it when empty. It is called on typing and wherever the app itself sets the box (choosing a destination, Add as stop).
- Clicking it cancels the suggestion timer, increments `searchSeq` (dropping in-flight searches), empties the box, the results and the status line, hides itself and returns focus to the input.
- It deliberately leaves the destination, routes, stops and travel mode untouched.
- CSS hides the browsers' native search cancel controls (`::-webkit-search-cancel-button`, `::-ms-clear`) so only one × appears, gives the button a 28 × 28 px tap area, and pads the input so text never runs under it.

`test/clear-button.test.js` checks these points against the source files; `tests/ai/us1…us3` describe browser scenarios — see [Testing](../testing/test-strategy.md).
