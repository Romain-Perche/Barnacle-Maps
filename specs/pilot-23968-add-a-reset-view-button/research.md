# Research: Reset View Button

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-10

The Technical Context had no `NEEDS CLARIFICATION` items: the stack is fixed by the existing app
(vanilla ES modules, Leaflet 1.9.4 from unpkg, `node --test`, no build step). The research below
settles the design choices the spec leaves open.

## R1. How to add the button to the map

- **Decision**: A custom Leaflet control (`L.Control.extend({ onAdd })`) whose container holds one
  native `<button type="button">` with visible text "Reset view". The container calls
  `L.DomEvent.disableClickPropagation` and `L.DomEvent.disableScrollPropagation` so that clicks,
  double-clicks and wheel events on the button never reach the map.
- **Rationale**: A Leaflet control is "on the map" (FR-001), is laid out by Leaflet's corner
  stacking (no overlap with other controls in the same corner), and moves with the map container.
  A native `<button>` gives focus, Enter and Space activation, touch taps, and an accessible name
  from its text content for free (FR-004, FR-005). Visible text avoids depending on an icon font or
  glyph and makes the action obvious; a `title` adds the same tooltip.
- **Alternatives considered**:
  - A button in `#panel` (index.html): simpler, but the spec asks for a control on the map, and the
    panel already holds search and routes.
  - `<div role="button" tabindex="0">` (Leaflet's own zoom control uses `<a>` elements): needs
    manual key handling; a native button is strictly better.
  - Icon-only button (e.g. "⟲") with `aria-label`: allowed by FR-001, but less clear to sighted
    users and the glyph renders differently across platforms.

## R2. Where to place the control (FR-006)

- **Decision**: Leaflet corner `bottomright`. Leaflet inserts bottom-corner controls above existing
  ones, so the button sits just above the OpenStreetMap attribution.
- **Rationale**: `#panel` is fixed at top-left with `z-index: 1000` and on narrow screens is
  `calc(100% - 24px)` wide, so it covers the whole top edge on phones (the top-right corner is not
  free on mobile). Leaflet's zoom control lives in `topleft`. The bottom-right corner is free on all
  screen sizes and does not collide with either the panel or the zoom control.
- **Alternatives considered**: `topright` (hidden under the full-width panel on mobile);
  `topleft` under the zoom control (under the panel); `bottomleft` (works too, but bottom-right is
  the conventional spot for map "recenter" buttons and keeps the left edge free for the panel).
- **Known limit**: the panel has no max-height; with a very long result list on a very short
  screen it could reach the bottom. This already affects the map itself and is out of scope; the
  control stays reachable once the list is cleared or by scrolling.

## R3. What "starting view" is and how it is captured (FR-002, FR-002a)

- **Decision**: Keep one module-level `startView` value in `src/app.js`, initialised to
  `DEFAULT_VIEW` (`{ lat: 48.8566, lng: 2.3522, zoom: 13 }`). In `onPosition`, inside the existing
  `if (!centered)` branch (first fix only), set it to the first fix at `LOCATE_ZOOM` (15, the zoom
  the app already uses there; extract the literal into a named constant). Later position updates
  never touch it. Compute the value with a small pure helper in `src/geo.js`
  (`startingView(firstFix, defaultView, locateZoom)`) so the rule is unit-testable with `node --test`.
- **Rationale**: Reuses the existing `centered` flag, which already means "the first fix has been
  handled", so FR-002a holds by construction. Before the first fix (or if location is denied or
  unsupported) `startView` is still `DEFAULT_VIEW`, which covers spec edge cases 1 and 3. Nothing
  is persisted (spec assumption: not saved between sessions).
- **Alternatives considered**:
  - Read the map's view right after it first settles (`map.once("moveend")`): fragile, since
    `showRoute` can move the map before the first fix (`setView` to the destination) and that view
    must never count as starting view.
  - Recompute from `position` on click: violates FR-002a (would follow later updates).

## R4. How to move the map, including during an animation

- **Decision**: `map.setView([startView.lat, startView.lng], startView.zoom)` with Leaflet's
  default options (animated pan/zoom where Leaflet can, about 0.25 s), or `{ animate: false }` when
  `window.matchMedia("(prefers-reduced-motion: reduce)").matches` (spec Assumptions, CHK030). If a zoom animation is
  running when the button is pressed, defer the call to the next `zoomend`
  (`map.once("zoomend", reset)`).
- **Rationale**: In Leaflet 1.9.4, `setView` called while `map._animatingZoom` is true is silently
  dropped (`_tryAnimatedZoom` returns `true` without moving), and an un-animated `setView` gets
  overwritten when the running zoom animation ends. Waiting for `zoomend` (≤ 0.25 s) guarantees the
  edge case "pressed while the map is still moving ends at the starting view". Pan animations and
  `flyTo` are stopped by `setView` itself (`_stop()`), so they need no special handling. Total time
  stays well under SC-002 (1 s). Pressing when already at the starting view makes `setView` a no-op
  (FR-007); repeated presses each end at the same target.
- **Alternatives considered**:
  - `{ animate: false }` always: still loses to a running zoom animation (see above).
  - `flyTo`: longer, more distracting animation for a "go home" action; can exceed 1 s on long
    distances.
  - Checking `map._animatingZoom` is a private field; the deferral is kept in one small function
    with a comment. If it ever disappears, behaviour degrades only to "press again".
  - **To verify during implementation**: the Leaflet 1.9.4 behaviour above comes from knowledge of
    its source, not from checking it (unpkg.com was not reachable while planning). Check
    `_tryAnimatedZoom` and `_stop` in `leaflet-src.js` 1.9.4 and drop the deferral if not needed.

## R5. Not touching other state (FR-003)

- **Decision**: The click handler only calls the reset function, which only calls `map.setView`.
  It does not call `clearRoutes`, `showRoute`, `setStatus`, `selectRoute`, or touch `mode`,
  `currentPlace`, markers, or the panel DOM.
- **Rationale**: Routes and markers are Leaflet layers and stay on the map when the view changes;
  the panel is outside the map. `disableClickPropagation` ensures the click is not also treated as
  a map click (route polylines have click handlers).

## R6. Testing approach

- **Decision**: Unit-test `startingView` in a new `test/view.test.js` (`node --test`, as the other
  tests). Verify the Leaflet control, keyboard/screen-reader access, placement and "nothing else
  changes" manually with [quickstart.md](./quickstart.md).
- **Rationale**: The repo has no DOM/Leaflet test harness and no dependencies; adding jsdom or a
  browser runner for one button would break the "no build step or dependencies" rule in README.md.
