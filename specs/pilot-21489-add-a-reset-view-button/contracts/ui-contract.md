# UI Contract: Reset View control

- **Placement**: Leaflet control, `topright` map corner; visible whenever the map is shown.
- **Element**: `<button type="button">`, visible text "Reset view", `aria-label="Reset view"`, `title="Reset view"`; keyboard focusable, Enter/Space activate, visible focus indicator.
- **Action**: on click → `map.setView(startView)`; no other side effects (no change to search input, results, destination marker, routes, selection, mode, pleasure, user marker, status; no network requests).
- **Click isolation**: click/double-click on the control must not propagate to the map (`L.DomEvent.disableClickPropagation`).

## Module contract: `src/view.js`
```text
createStartView(defaultView) -> {
  get():  {lat, lng, zoom}            // current start view (copy)
  settle({lat, lng, zoom}): boolean   // first call replaces view and returns true; later calls no-op, return false
}
```
