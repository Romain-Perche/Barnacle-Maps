# Research: Reset View Button

The Technical Context had no NEEDS CLARIFICATION items: the stack is fixed by the repo, and the spec's clarification settled what "starting view" means. The research below covers the design choices. No questions were asked, because this ran non-interactively. The choices were made autonomously and are recorded here.

## R1. Where the starting view is recorded

- **Decision**: Use a `createStartView(DEFAULT_VIEW)` object from the new `src/view.js`. `onPosition` calls `startView.settle(lat, lng, 15)`. That call returns `true` (and updates the view) only the first time. `app.js` uses the return value to decide whether to auto-center, so this replaces the existing `centered` flag.
- **Rationale**: This puts "first auto-center" and "starting view" in one place, so they cannot drift apart (FR-003/FR-004). It is pure and testable under `node --test` without Leaflet. It also matches the existing pattern of pure helpers in their own module.
- **Alternatives considered**:
  - *Read `map.getCenter()/getZoom()` right after the first `setView`*: Leaflet may round or animate, and this ties the logic to the DOM. Rejected.
  - *Keep `centered` and add a separate `startView` variable in app.js*: that gives two pieces of state to keep in sync, and it can't be unit-tested because app.js needs `window.L` and the DOM. Rejected.
  - *Put it in `geo.js`*: this is view state, not geography. Rejected to keep geo.js cohesive.

## R2. How the control is built

- **Decision**: Use a custom `L.Control` subclass whose `onAdd` returns a `div.leaflet-bar.leaflet-control` containing a native `<button type="button" class="reset-view" aria-label="Reset view" title="Reset view">`. Call `L.DomEvent.disableClickPropagation` and `disableScrollPropagation` on the container.
- **Rationale**: Leaflet places and stacks the control, so it never overlaps other Leaflet controls (FR-008). A native `<button>` gives focus and Enter/Space activation with no extra code, plus a correct "button" role (FR-006/FR-007). Stopping propagation keeps clicks on the button from reaching the map.
- **Alternatives considered**: A button in `index.html` with absolute CSS positioning would need manual collision handling with Leaflet's corners. Making `<a role="button">` the way Leaflet's zoom control does needs extra key handling for Space. Both rejected.

## R3. Placement (FR-008)

- **Decision**: `position: "bottomright"`. Leaflet stacks it above the attribution control.
- **Rationale**: `#panel` is anchored top-left with `z-index: 1000` and `width: min(360px, 100% - 24px)`. On mobile it spans the full top of the screen, and its height grows with results and routes. It already covers the default top-left zoom control. Top-left and top-right would both sit under the panel on narrow screens. Bottom-right is the one corner the panel never reaches. The spec assumes placement "near the zoom controls", but in practice those are hidden under the panel. Visual closeness doesn't matter as much as "never hidden behind the panel", so placement follows FR-008. This was chosen autonomously.
- **Alternatives considered**: `topleft` under the zoom control is hidden by the panel. `topright` is hidden on mobile. Moving the zoom control is out of scope.

## R4. Reset motion

- **Decision**: `map.setView([lat, lng], zoom)` with Leaflet's default animation options.
- **Rationale**: The spec accepts smooth or instant. The default animation is short (well under 1 s, SC-001) and lands on the exact center and zoom (SC-002). If the map is already at the start view, `setView` does nothing visible (acceptance scenario 1.3). Repeated presses are idempotent.
- **Alternatives considered**: `flyTo` takes longer over large distances and may exceed 1 s. Rejected.

## R5. Not altering app state (FR-005)

- **Decision**: The click handler only calls `map.setView`. It does not touch `routeLayers`, `selectedRoute`, `mode`, `currentPlace`, `results`, `status`, `userMarker` or `destMarker`, and it does not call `fitBounds`.
- **Rationale**: Panning and zooming in Leaflet don't affect layers. Polylines and markers keep their geographic positions.

## R6. Styling and icon

- **Decision**: Use a visible glyph "⟲" (`aria-hidden` span) plus `aria-label`/`title` "Reset view". Size it 30×30 to match `leaflet-bar a`. Add a `:focus-visible` outline.
- **Rationale**: This matches Leaflet's control look, gives a tooltip for sighted users and an accessible name for screen readers (FR-007), and shows keyboard focus (FR-006).
- **Alternatives considered**: A text-only "Reset view" label is wider and clutters mobile. An SVG icon adds markup for no gain.
