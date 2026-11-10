# UI Contract: Reset View control

- **Element**: `<button type="button">` inside a Leaflet control container (`leaflet-bar leaflet-control`), map position `topright`.
- **Accessible name**: "Reset view" (`aria-label` and `title`); visible glyph/text may be an icon or text, but the name must be exposed.
- **Activation**: click/tap, Enter, Space.
- **Effect**: `map.setView(startingView.center, startingView.zoom)`. No other state changes; no network requests.
- **Events**: click and double-click on the control must not propagate to the map (no unintended zoom/pan).
- **Focus**: visible focus indicator (browser default or explicit style).
- **Layout**: must not overlap `#panel`, the zoom control, or attribution at widths ≥ 320px.
