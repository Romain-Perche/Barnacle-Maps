# UI Contract: Reset view control

## DOM

Leaflet creates this markup inside `.leaflet-bottom.leaflet-right`, stacked above the attribution:

```html
<div class="leaflet-control leaflet-bar reset-view-control">
  <button type="button" class="reset-view" aria-label="Reset view" title="Reset view">
    <span aria-hidden="true">⟲</span>
  </button>
</div>
```

| Requirement | Contract |
|---|---|
| FR-001 | Added to the map once at startup and never removed or hidden |
| FR-006 | Native `<button type="button">`: in the tab order, activates on click, tap, Enter and Space |
| FR-007 | Accessible name "Reset view" (`aria-label`). Tooltip "Reset view" (`title`). Role is `button`. |
| FR-008 | Leaflet `bottomright` corner. `#panel` (top-left) never covers it, and Leaflet stacks it next to the other controls without overlap. |

## Behavior

On activation:

```text
const v = startView.current;
map.setView([v.lat, v.lng], v.zoom);
```

- Only the map center and zoom change (FR-002).
- Search input, results, routes, selected route, travel mode, status text, user marker and destination marker stay the same (FR-005).
- The click doesn't reach the map (`L.DomEvent.disableClickPropagation`), and scrolling over the control doesn't zoom the map.
- Idempotent: pressing it again at the starting view, or pressing it quickly several times, ends at the starting view with no errors.

## Styling (`styles.css`)

- `.reset-view`: 30×30 px, white background, no border (the `leaflet-bar` supplies border and radius), `cursor: pointer`, font size ~18px, matching `.leaflet-bar a`.
- `.reset-view:hover` uses the same hover background as Leaflet's controls (`#f4f4f4`).
- `.reset-view:focus-visible` has a visible outline (`2px solid #1a73e8`).
