# Research: Reset View Button

All items below were open technical choices; none needed outside input. The product question
(which view counts as "starting") was answered in the spec's Clarifications (Session 2026-11-10).

## R1. Where to record the starting view

- **Decision**: A module-level `startView` in `src/app.js`, initialised to `DEFAULT_VIEW` and replaced
  once inside the existing `if (!centered)` branch of `onPosition`, using `locatedView(position)`.
- **Rationale**: The app already has exactly one place where it chooses its own view on the first
  geolocation fix, and the `centered` flag already makes it run once per page load. Hooking there
  matches FR-003/FR-004 by construction, including the "location arrives after the user moved the map"
  edge case (the app re-centers then, and that view becomes the target).
- **Alternatives considered**:
  - Read `map.getCenter()/getZoom()` on the first `moveend`/`load`: fragile (fires for user moves and
    for `fitBounds`, and before the fix arrives).
  - Always reset to the user's *current* position: rejected by the clarification (later live updates
    must not move the target).
  - Persist in `localStorage`: out of scope (spec: each page load records its own).

## R2. How to move the map

- **Decision**: `map.setView([lat, lng], zoom)` with Leaflet defaults, except `animate: false` when `prefers-reduced-motion: reduce` matches (spec FR-010).
- **Rationale**: Leaflet animates the pan/zoom when it can (≈0.25 s) and jumps otherwise, well within
  SC-003 (1 s). `setView` stops any running animation first, so presses during a pan, a `fitBounds`
  or repeated presses always end on the same exact center/zoom (no drift). Calling it when already
  at the target causes no error.
- **Alternatives considered**: `flyTo` (prettier, but duration grows with distance and can exceed 1 s
  for far views); `setView(..., { animate: false })` (fine, but an instant jump is less readable; the
  spec allows either).

## R3. What the control is made of

- **Decision**: A Leaflet custom control (`L.Control.extend`) whose container is
  `div.leaflet-bar.leaflet-control` holding a native `<button type="button" class="reset-view">`
  with `aria-label="Reset view"` and `title="Reset view"`, and an `aria-hidden` home glyph.
- **Rationale**: A native `<button>` gives focusability and Enter/Space activation for free (FR-006),
  and the accessible name comes from `aria-label`. `leaflet-bar` gives the same white box, border and
  shadow as the zoom buttons. `L.DomEvent.disableClickPropagation` / `disableScrollPropagation` stop
  the press from also panning/zooming the map (double-click zoom, drag start).
- **Alternatives considered**: `<a href="#" role="button">` like Leaflet's own zoom links (needs
  manual Space handling and `preventDefault`); a button in `#panel` (not "on the map with the other
  map controls", FR-007); a third-party plugin such as Leaflet.ResetView/EasyButton (adds a
  dependency for ~20 lines of code).

## R4. Placement that never overlaps the search panel

- **Decision**: Create the map with `zoomControl: false`, then add `L.control.zoom({ position: "bottomright" })`
  and the reset control at `"bottomright"` too. Leaflet inserts bottom-corner controls above earlier
  ones, so the stack is (top to bottom): Reset view, zoom +/-, attribution.
- **Rationale**: `#panel` is absolutely positioned at top-left, `z-index: 1000`, width
  `min(360px, 100% - 24px)`, i.e. it covers the top-left corner at every width and the whole top edge
  on phones. Leaflet's corners also use `z-index: 1000` and the panel comes later in the DOM, so
  today the default top-left zoom control is hidden behind the panel. The bottom-right corner is the
  only one free at all widths. Moving the zoom control keeps the reset button "next to the other map
  controls" (FR-007) and makes the zoom buttons visible again.
- **Alternatives considered**: `topleft` under the zoom control (hidden behind the panel);
  `topright` (covered by the full-width panel on phones); `bottomleft` alone (away from the zoom
  control, violating "with the other map controls"); shifting the top-left corner down with CSS by
  the panel height (panel height changes with results/routes, so it would need JS to track it).
- **Panel height on narrow screens**: below ~420 px wide the panel spans the columns used by the
  bottom-right controls, so an unbounded results/routes list could grow down over them. Decision: a
  CSS-only cap, `@media (max-width: 440px) { #panel { max-height: calc(100% - 172px); overflow-y: auto; } }`
  (172 px = 12 px top offset + bottom-right stack ~136 px + clearance), so the panel always ends above
  Reset view and its content scrolls. Alternatives: capping only `#results`/`#routes` separately (two
  scroll areas, still unbounded together); moving the controls with JS when the panel grows (more code,
  and the controls would jump around); capping on all widths (needless on desktop, where the panel
  never reaches the right edge).

## R5. Testing approach

- **Decision**: Put the DOM-free parts in `src/geo.js` (`DEFAULT_VIEW`, `LOCATED_ZOOM`,
  `locatedView(position)`) and unit-test them in a new `test/view.test.js` with `node:test`.
  Validate the Leaflet/DOM behavior manually with the scenarios in `quickstart.md`.
- **Rationale**: Matches the repo's existing split (pure helpers tested in Node; `app.js` has no
  tests because it needs `window.L` and the DOM). No test-runner or jsdom dependency is added.
- **Alternatives considered**: jsdom + Leaflet in Node, or Playwright browser tests: heavier than the
  feature, and they would add the project's first dependencies.

## R6. A reset during route loading must not be undone by `fitBounds`

- **Decision**: Remember the route search that was current at the press (`resetRouteSeq = routeSeq`)
  and skip `fitBounds` in `drawRoutes` for that search only (FR-011).
- **Rationale**: Reuses the existing `routeSeq` counter that already tells searches apart; one number,
  no timers. Later searches get a new `seq`, so they fit as usual.
- **Alternatives rejected**: cancelling the route fetch (spec says loading continues and routes still
  appear); a boolean "user reset" flag (would need clearing and could leak into the next search).
