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
| FR-006 | Native `<button type="button">`: in the tab order, activates on click, tap, Enter and Space. Focus stays on the button after activation. Tab order is the DOM order: Leaflet's control container (zoom, Reset view, attribution links) comes before `#panel`. |
| FR-007 | Accessible name "Reset view" (`aria-label`). Tooltip "Reset view" (`title`). Role is `button`. |
| FR-010 | Never disabled. It looks the same whether or not the map is at the starting view. |
| FR-012 | `#panel` is capped so it never reaches the bottom 96px of the map (see Styling). |
| FR-008 | Leaflet `bottomright` corner, above the attribution. With the `#panel` cap, there are ≥ 8px between the button's box and the panel or any control at 360×640, 375×667, 667×375 and 1280×800. |

## Behavior

On activation:

```text
const v = startView.current;
map.setView([v.lat, v.lng], v.zoom);
```

- Only the map center and zoom change (FR-002).
- Search input, results, routes, selected route, travel mode, status text, user marker, destination marker and open popups stay the same (FR-005). No announcement is made.
- A running pan/zoom animation or drag inertia is interrupted (`setView` stops it). Route requests in flight are not cancelled; their later `fitBounds` still runs (FR-014).
- The movement ends within 1 s of the press (SC-001). No `flyTo`.
- The click doesn't reach the map (`L.DomEvent.disableClickPropagation`), and scrolling over the control doesn't zoom the map.
- Idempotent: pressing it again at the starting view, or pressing it quickly several times, ends at the starting view with no errors.

## Styling (`styles.css`)

- `.reset-view`: 44×44 px (FR-011), `display: block`, white background, `color: #000`, no border (the `leaflet-bar` supplies border and radius), `cursor: pointer`, glyph font size matching the zoom buttons (~22px).
- `.reset-view:hover` uses the same hover background as Leaflet's controls (`#f4f4f4`).
- `.reset-view:focus-visible` has a visible outline (`2px solid #1a73e8`, ≥ 3:1 against white). No `:active` style, never `disabled` (FR-009, FR-010).
- `#panel` gets `max-height: calc(100% - 108px); overflow-y: auto; box-sizing: border-box;` (12px top offset + 96px free strip at the bottom, FR-012).
