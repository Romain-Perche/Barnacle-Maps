# Research: Reset View Button

## Where to put the button
- **Decision**: Leaflet `L.Control` at `topright`.
- **Rationale**: Panel is top-left, attribution bottom-right, zoom top-left; top-right overlaps none (FR-002) and works on narrow screens. Leaflet controls already give consistent styling and stop click propagation to the map.
- **Alternatives**: Static HTML button in `index.html` (needs manual positioning/z-index, map click bleed-through); inside `#panel` (not "on the map", crowds the panel).

## Capturing the starting view
- **Decision**: Hold `startView` in memory; initialised to `DEFAULT_VIEW`; on the first geolocation fix, where `centered` flips to true and `map.setView(latlng, 15)` runs, set `startView` to `{lat, lng, zoom: 15}` once. Never updated afterward.
- **Rationale**: Matches the clarification (settled start-up view, not following the user) and FR-004/005. Using the same values passed to `setView` avoids reading back from the map (which could be mid-animation or altered by a route fit).
- **Alternatives**: Read `map.getCenter()` after `moveend` (race with user panning/route fit); recompute from `position` on press (rejected by clarification).

## Performing the reset
- **Decision**: `map.setView([lat, lng], zoom)` — a single call changing only view.
- **Rationale**: Interrupts any in-flight `fitBounds` animation so the map ends at the start view (edge case "mid-animation"); idempotent for repeated presses; triggers no fetches (FR-009).
- **Alternatives**: `flyTo` (longer animation risks SC-002).

## Accessibility
- **Decision**: Render a real `<a>`-free `<button type="button">` inside the control container with `aria-label="Reset view"`, `title="Reset view"`, and visible text "Reset view".
- **Rationale**: Native button gives Enter/Space and focus; Leaflet's default focus styles are retained/enhanced with `:focus-visible` (FR-007, FR-008).

## Testing
- **Decision**: Pure helper in `src/view.js` unit-tested with `node --test`; DOM/Leaflet behaviour verified by the quickstart manual checks.
- **Rationale**: Project has no browser test harness; adding one is out of scope.

All NEEDS CLARIFICATION resolved (none were open).
