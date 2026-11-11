# Research: Reset View Button

Phase 0 for [plan.md](./plan.md). The Technical Context had no NEEDS CLARIFICATION items. This file records the design choices and why they were made. The plan ran unattended (factory mode), so each choice below was made without asking anyone.

## R1. Which view is the "starting view"

- **Decision**: Start with `DEFAULT_VIEW` (Paris, 48.8566 / 2.3522, zoom 13). At the first location fix, in the existing `if (!centered)` branch of `onPosition` that calls `map.setView(latlng, 15)`, store `{ lat, lng, zoom: 15 }` as the starting view. After that, never change it.
- **Rationale**: This follows the spec's Clarification (Option A) and FR-003/FR-004. Hooking into the same branch that centers the map means the stored view is always exactly the view the app showed. Live position updates do not go through that branch, so they cannot move the starting view.
- **Alternatives considered**:
  - Reading `map.getCenter()/getZoom()` after startup: there is no clear "startup is done" moment, and the user may already have panned.
  - Always resetting to the user's current position: rejected by the clarification (the view must not follow the user).

## R2. Where the starting-view logic lives

- **Decision**: Add a pure factory `createStartView(defaultView)` to `src/geo.js`. It returns `{ get(), setOnce(view) }`. `setOnce` returns `true` the first time and `false` (and does nothing) after that. `get()` returns a copy.
- **Rationale**: `geo.js` is the repo's home for DOM-free, unit-tested logic. This makes FR-003/FR-004 testable with `node --test`, with no browser needed.
- **Alternatives considered**: A bare `let startView` in `app.js`: simpler, but `app.js` cannot be imported in Node (it uses `window.L` and the DOM), so the once-only rule would go untested.

## R3. How to build the control

- **Decision**: A custom `L.Control.extend({ onAdd })` that creates `div.leaflet-bar.leaflet-control.reset-view-control` containing a native `<button type="button">`. The button has `aria-label="Reset view"` and `title="Reset view"`, and shows a visible icon glyph (⌂) marked `aria-hidden="true"`. Call `L.DomEvent.disableClickPropagation` and `disableScrollPropagation` on the container.
- **Rationale**: The spec's Assumptions ask to reuse the map library's control placement and look (FR-007). A native `<button>` is focusable and responds to Enter and Space for free (FR-006). The aria-label gives the accessible name "Reset view". Stopping propagation keeps a click on the button from reaching the map (for example, from closing the destination popup).
- **Alternatives considered**:
  - A button in `#panel`: does not count as "on the map, alongside the map controls".
  - An `<a href="#" role="button">` like Leaflet's zoom links: needs extra key handling for Space, and the native button is simpler.
  - A third-party plugin (e.g. Leaflet.ZoomHome): adds a dependency, which goes against the repo's no-dependency rule.

- **Look (FR-001)**: Leaflet 1.9's bar links have a white background, black text, 4px corners on the first/last link, and `#f4f4f4` on hover and focus; they have no separate active style. So the button uses the same values, with `:active` also `#f4f4f4`, so pressing it does not show the browser's default grey button look.

## R4. Placement (corner)

- **Decision**: `position: "bottomright"`. Leaflet stacks it above the attribution control in that corner.
- **Rationale**: `#panel` is fixed at top-left (`z-index: 1000`, up to full width on small screens), so it covers the top-left corner, and on narrow screens the top-right as well. The bottom-right corner is never under the panel, and the zoom control is not there, so FR-007 and the small-screen edge case hold. It also falls under the thumb on phones.
- **Alternatives considered**: `topleft` (under the panel), `topright` (covered by the full-width panel on phones).
- **Note (outside this feature)**: Leaflet's default zoom control is at `topleft`, and `#panel` may cover it. This plan does not move it. The reset control is placed so it cannot overlap it either way.

## R5. How to move the map

- **Decision**: `map.setView([lat, lng], zoom, { animate: !reducedMotion })`. `reducedMotion` is read from `matchMedia("(prefers-reduced-motion: reduce)")` each time the button is pressed (FR-010). Otherwise Leaflet's default animation options are used.
- **Rationale**: `setView` first stops any running pan/zoom/fly animation (Leaflet 1.9 calls `_stop()`), so a reset during the `fitBounds` animation after a route search, or several quick presses, always ends at the starting view (edge cases). The default animation lasts about 0.25 s, well inside SC-002's 1 s. For big jumps Leaflet resets without animation, which is also instant. If the map is already at the starting view, nothing visible happens (acceptance scenario 1.2).
- **Alternatives considered**: `flyTo`: its duration grows with distance and can go over 1 s for far-away views. `fitBounds`: not needed, since the target is a center plus a zoom.

## R6. Keeping other state untouched (FR-005)

- **Decision**: The click handler only calls `map.setView` with the stored view. It does not read or write `routeLayers`, `destMarker`, `currentPlace`, `mode`, `results`, `input`, `status`, `userMarker`, `centered` or the sequence counters.
- **Rationale**: This meets FR-005/SC-003 by construction. Because `centered` is not touched, a reset before the first fix does not stop the app from centering on the first fix (edge case), and that fix then becomes the starting view.

## R7. Testing approach

- **Decision**: Unit tests for `createStartView` in `test/startview.test.js`: default value, first `setOnce` wins, later calls are ignored and return `false`, `get()` returns a copy, and invalid input is rejected. The Leaflet wiring and accessibility are covered by AI-run browser scenarios in `tests/ai/us1-return-to-starting-view.md` and `tests/ai/us2-accessible-reset-control.md` (Markdown only, run by an agent with a headless browser), and by the manual checklist in [quickstart.md](./quickstart.md).
- **Rationale**: The repo has no browser test harness and no dependencies. Adding jsdom/Playwright would go against that rule for a feature of about 40 lines.
