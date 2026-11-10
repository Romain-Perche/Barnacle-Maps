# UI Contract: Reset view control

## DOM

Leaflet creates this markup inside `.leaflet-bottom.leaflet-right`, stacked above the attribution:

```html
<div class="leaflet-control leaflet-bar reset-view-control">
  <button type="button" class="reset-view" aria-label="Reset view" title="Reset view">
    <svg aria-hidden="true" focusable="false" width="22" height="22" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <!-- circular arrow (⟲): open arc plus arrowhead -->
    </svg>
  </button>
</div>
```

The container and the `<button>` are real DOM elements created with `L.DomUtil.create` (or `document.createElement`), not an `innerHTML` string; only the `<svg>` inside the button may be set with `innerHTML`. `test/reset-view-control.test.js` and the integration tests check this through `test/support/fake-browser.js` (plan.md §Testing).

| Requirement | Contract |
|---|---|
| FR-001 | Added to the map once at startup and never removed or hidden |
| FR-006 | Native `<button type="button">`: in the tab order, activates on click, tap, Enter and Space. Focus stays on the button after activation. Tab order is the DOM order: Leaflet's control container (zoom, Reset view, attribution links) comes before `#panel`. |
| FR-007 | Accessible name "Reset view" (`aria-label`). Tooltip "Reset view" (`title`). Role is `button`. |
| FR-010 | Never disabled. It looks the same whether or not the map is at the starting view. |
| FR-001 | Icon is an inline SVG circular arrow, 22×22 px (same as the zoom + / − symbols); no text glyph, so no font dependency. |
| FR-012 | `#panel` is capped so it never reaches the bottom 96px of the map (see Styling). Pure CSS, so it holds after resize/rotation and at 200% zoom (FR-017). |
| FR-008 | Leaflet `bottomright` corner, above the attribution (which counts as a control; Leaflet's 10px stacking margin gives the gap). With the `#panel` cap, there are ≥ 8px between the button's box and the panel or any control at 360×640, 375×667, 667×375 and 1280×800. |

## Behavior

On activation:

```text
try {
  const v = startView.current;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  map.setView([v.lat, v.lng], v.zoom, { animate: !reduce });
} catch (err) {
  console.error(err);   // FR-018: map stays put, focus stays on the button, nothing shown to the user
}
```

- Only the map center and zoom change (FR-002).
- Search input, results, routes, selected route, travel mode, status text, user marker, destination marker and open popups stay the same (FR-005). No announcement is made.
- A running pan/zoom animation or drag inertia is interrupted (`setView` stops it). Route requests in flight are not cancelled; their later `fitBounds` still runs (FR-014).
- The movement ends within 1 s of the press (SC-001, to `moveend`). No `flyTo`. Instant (`animate: false`) under `prefers-reduced-motion: reduce` (FR-015).
- Clicks, double-clicks and double-taps don't reach the map (`L.DomEvent.disableClickPropagation`, which also stops `dblclick`), and mouse-wheel scrolling over the control doesn't zoom the map (`L.DomEvent.disableScrollPropagation`) (FR-002). `disableClickPropagation` also stops `mousedown`, `touchstart` and `contextmenu` on the control, so a drag, long-press, right-click or pinch that starts on the button never pans or zooms the map; the browser's own context menu may still appear.
- Destination marker, popups being opened and markers being added are untouched; they finish in their normal state.
- Idempotent: pressing it again at the starting view, or pressing it quickly several times, ends at the starting view with no errors.

## Styling (`styles.css`)

- `.reset-view`: 44×44 px (FR-011), `display: block`, white background, `color: #000`, no border (the `leaflet-bar` supplies border and radius), `cursor: pointer`, SVG icon 22×22 px with `stroke="currentColor"` (~19:1 on #f4f4f4, 21:1 on white).
- `.reset-view:hover` uses the same hover background as Leaflet's controls (`#f4f4f4`).
- `.reset-view:focus-visible` has a visible outline (`2px solid #1a73e8`, `outline-offset: -2px` so it is drawn inside the button, ≥ 3:1 against white) (FR-013). No `:active` style, never `disabled` (FR-009, FR-010).
- `#panel` gets `max-height: calc(100% - 108px); overflow-y: auto; box-sizing: border-box;` (12px top offset + 96px free strip at the bottom, FR-012).
- `@media (forced-colors: active)`: `.reset-view { background: ButtonFace; color: ButtonText; forced-color-adjust: none; }` and `.reset-view:focus-visible { outline-color: Highlight; }` (FR-016).
