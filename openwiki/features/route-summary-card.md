---
type: feature
title: Route summary card
description: The #route-card bar at the bottom of the map shows the selected route's mode, duration, distance and arrival time, refreshes every minute, announces selection changes politely and hides whenever no route is drawn.
tags: [feature, ui, route-card, accessibility, arrival-time]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-9a6d805649b823477f244ab2
    resource: repo://styles.css
  - id: openwiki-source-82a2d2662bc1d8f133e3021f
    resource: repo://test/route-card.integration.test.js
  - id: openwiki-source-55d019e41c654dd4a3212b31
    resource: repo://test/summary.test.js
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# Route summary card

When a route is selected, a bar at the bottom centre of the map (`#route-card`) shows four figures, in order: travel mode, duration, distance and "Arrive HH:MM". It was added by feature PILOT-73195; its spec and contracts are in `specs/pilot-73195-summary-card-for-the-selected-route/` (see [Spec-driven development workflow](../development/spec-workflow.md)).

## Markup and style

- `index.html` declares `#route-card` (`role="group"`, `aria-label="Selected route"`, initially `hidden`) with `.rc-mode`, `.rc-duration` (bold), `.rc-distance`, `.rc-arrival`. It is a sibling of `#map`, not a Leaflet control.
- `#route-card-live` is a visually hidden (`.sr-only`) `aria-live="polite"` paragraph for screen reader announcements.
- `styles.css` centres the bar with `left: 50%; transform: translateX(-50%)`, `bottom: 28px` (above the map attribution), sizes it to its content (`width: max-content`, capped by the viewport), never truncates figures (`white-space: nowrap`, wrapping between items), shows the mode in grey and the duration in the selected-route blue.

## Figures (`src/geo.js`)

`routeSummary(route, now, locale, mode)` returns `{ mode, duration, distance, arrival }`:

- `mode` is the `TRAVEL_MODES` label (`Walk` / `Car`); a missing or unknown mode falls back to `Walk`.
- `duration` and `distance` use the same `formatDuration` / `formatDistance` as the route list, so the bar and panel always match.
- `arrival` comes from `formatArrival`, which uses `arrivalInfo`: arrival is `now` plus the **rounded displayed minutes** (at least 1), so it agrees with the duration text. It follows the locale's hour cycle (two-digit hours for 24-hour locales) and appends `+1 day` / `+N days` when the arrival falls on a later calendar day (calendar days, robust to DST).

## Behaviour (`src/app.js`)

- `selectRoute(i)` (from a panel button or a click on the route line) calls `renderCard()`, then writes "Route N, Mode: duration, distance, arrive HH:MM" to the live region.
- `renderCard()` fills the bar from `routeLayers[selectedRoute]` with `drawnMode` (the mode the routes were computed for, not the radio currently checked), shows it, and schedules itself again at the next minute boundary so the arrival time stays current. The minute refresh does not touch the live region, so it is not re-announced.
- `hideCard()` clears the timer, hides the bar and empties the live region. It runs from `clearRoutes()`, i.e. at the start of every new routing request, so the bar is hidden while loading, after a routing error and when no route is found.
- `drawRoutes` reserves room for the bar when fitting the map: bottom padding is `40 + card.offsetHeight + 28` px.

## Tests

- `test/summary.test.js`: `arrivalInfo`, `formatArrival`, `routeSummary` (rounding, next-day, DST, 12/24-hour locales).
- `test/route-card-ui.test.js`: markup and CSS contract.
- `test/route-card.integration.test.js`: drives the real app in the fake browser through the user stories (selection, minute refresh, hide on load/failure, mode change, stops).
- `tests/ai/us1-…`, `us2-…`, `us3-…`: Playwright scenarios. See [Testing](../testing/test-suites.md).

Related: [Routing and travel modes](routing.md), [App state and request lifecycle](../architecture/app-state-and-lifecycle.md).
