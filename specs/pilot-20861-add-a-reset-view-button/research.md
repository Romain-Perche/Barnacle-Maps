# Research: Reset View Button

## Decision 1: Control mechanism
- **Decision**: Custom `L.Control` in position `topright`, rendering a `<button type="button">` inside a `leaflet-bar` container with `aria-label="Reset view"` and `title="Reset view"`.
- **Rationale**: Matches existing map-control look (FR-008); native button gives keyboard Enter/Space and focus for free (FR-006); Leaflet's `L.DomEvent.disableClickPropagation` prevents map drag/click interference.
- **Alternatives**: Plain HTML button absolutely positioned (needs manual styling/z-index, no Leaflet event isolation); placing it in `#panel` (spec says on-map controls).

## Decision 2: Placement
- **Decision**: `topright`.
- **Rationale**: `#panel` occupies top-left (and already covers the default topleft zoom control); attribution is bottom-right. Top-right collides with neither on desktop or narrow screens (panel width ≤ 100% − 24px but is short; control is small).
- **Alternatives**: topleft (hidden behind panel); bottomright (attribution conflict).

## Decision 3: Capturing the starting view
- **Decision**: Module-level `startingView = { center: [DEFAULT_VIEW.lat, DEFAULT_VIEW.lng], zoom: DEFAULT_VIEW.zoom }`; inside the existing `if (!centered)` block in `onPosition`, set it to `{ center: latlng, zoom: 15 }` alongside `setView`. Reuse a single `INITIAL_LOCATION_ZOOM = 15` constant for both.
- **Rationale**: The `centered` guard already guarantees one-time capture (FR-004, edge case of late permission); default is used when no fix (FR-003).
- **Alternatives**: Reading `map.getCenter()` after load (would capture user moves); storing a position-following value (violates FR-004).

## Decision 4: Reset behavior
- **Decision**: `map.setView(startingView.center, startingView.zoom)` (Leaflet default animation acceptable; idempotent when already there).
- **Rationale**: Touches only the map (FR-005); repeated presses are safe.

## Decision 5: Testing
- **Decision**: Deterministic tests run `src/app.js` against a fake Leaflet (`test/helpers/app-harness.js`, `test/reset-view.test.js`); pixel size, animation time and screen reader announcement are covered by AI scenarios (`tests/ai/`) and the quickstart. Existing `npm test` must still pass.
