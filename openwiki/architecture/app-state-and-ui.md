---
type: architecture
title: App state, UI panel and request sequencing
description: How src/app.js keeps its state in module-level variables, renders the floating panel, reports status, and uses sequence counters and an AbortController to drop stale network responses.
tags: [architecture, state, ui, concurrency]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T16:11:40.024Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-9a6d805649b823477f244ab2
    resource: repo://styles.css
generated: { by: "claude-code", at: "2026-11-13T16:11:40.024Z" }
---

# App state, UI panel and request sequencing

All runtime behaviour of Barnacle Maps lives in one ES module, `src/app.js`, loaded by `index.html`. There is no framework and no store: state is a handful of module-level `let` variables, and the DOM is updated directly. Pure computation (URLs, parsing, geometry, stops) is delegated to `src/geo.js` — see [Architecture overview](overview.md).

## The panel

`index.html` declares a full-screen `#map` div and a floating `#panel` with, top to bottom:

| Element | Role |
| --- | --- |
| `#search-form` with `#search-input`, `#search-clear` (×) and a **Go** submit button | place search — see [Place search](../features/search.md) |
| `#mode` radio group (`foot` / `car`) | travel mode — see [Routing](../features/routing.md) |
| `#results` | search results, each with an "Add as stop" button |
| `#stops-box` with `#stops` and `#clear-stops` | stop list, hidden while empty — see [Stops](../features/stops.md) |
| `#routes` | one button per drawn route, with an optional pleasure line |
| `#status` (`role="status"`) | single line of status text, announced by screen readers |

`styles.css` positions the panel over the map (`z-index: 1000`) and hides `#routes` and `#status` while they are empty (`:empty { display: none; }`).

## Module state

| Variable | Meaning |
| --- | --- |
| `position` | latest `{lat, lng}` from `navigator.geolocation.watchPosition`, or `null` |
| `userMarker`, `destMarker`, `stopMarkers` | Leaflet layers for you, the destination and the stops |
| `currentPlace` | the chosen destination `{name, lat, lng}` |
| `mode` | `"foot"` or `"car"` |
| `stops` | ordered list of `{name, lat, lng}` |
| `routeLayers`, `selectedRoute` | drawn routes (`{route, line, button, pleasure}`) and the selected index |
| `searchSeq`, `suggestTimer` | search request counter and the debounce timer |
| `routeSeq`, `pleasureAbort` | route request counter and the `AbortController` of the running pleasure job |
| `pendingRoute` | a destination was chosen before the position was known |
| `centered` | the map was centred on the first position fix |

Nothing is persisted: reloading the page resets everything (no cookies, `localStorage` or server state).

## Status messages

`setStatus(text)` writes the single `#status` line. It is the only feedback channel for progress ("Searching…", "Computing walking routes…"), results ("3 walking routes · fastest …") and errors ("Search failed: …", "Routing failed: …", "Location unavailable…").

## Dropping stale responses

Network calls can overlap (typing fast, switching mode, editing stops), so every async flow checks it is still the latest before touching the UI:

- **Search** — `runSearch` takes `seq = ++searchSeq` and returns without rendering if `searchSeq` moved on. Anything that should cancel pending results (choosing a destination, "Add as stop", the clear button, typing below the suggestion threshold) simply increments `searchSeq` and clears `suggestTimer`.
- **Routes** — `updateRoutes` takes `seq = ++routeSeq`; `fetchRoutes` and `updateRoutes` bail out when `seq !== routeSeq`, so only the newest request draws routes or sets status.
- **Pleasure** — `updateRoutes` aborts the previous `pleasureAbort` controller before starting; `scorePleasure` also re-checks `routeSeq` before writing scores.

`updateRoutes` is the single entry point that recomputes routes; it is called when a destination is chosen, the mode changes, the stops change, or the first position arrives while `pendingRoute` is set.
