# UI Contract: Reset view control

## DOM

Created by `src/app.js` as a Leaflet control at position `bottomright`:

```html
<div class="leaflet-bar leaflet-control">
  <button type="button" class="reset-view" aria-label="Reset view" title="Reset view">
    <span aria-hidden="true">⌂</span>
  </button>
</div>
```

- Exactly one `button.reset-view` exists while the map is displayed (FR-001).
- Square button, same size as the zoom buttons, showing only the home icon ⌂ (FR-001).
- Accessible name: "Reset view" (FR-006). Tooltip on hover: "Reset view".

## Placement (FR-007)

- Map created with `zoomControl: false`; zoom control re-added with `position: "bottomright"`, then
  the reset control added at `"bottomright"`.
- Visual stack in the bottom-right corner, top to bottom: Reset view, zoom in/out, attribution.
- Never overlaps `#panel` (top-left) at any viewport width, including ≤ 384 px wide phones.
- At viewports ≤ 440 px wide (where `#panel` and the bottom-right stack share horizontal space),
  `#panel` has `max-height: calc(100% - 172px)` and `overflow-y: auto`: its bottom edge always stays
  above the Reset view button, and long `#results` / `#routes` lists scroll inside the panel. Wider
  viewports: `#panel` unchanged.
- Button is at least 30×30 px (same as `.leaflet-bar a`, `.leaflet-touch` 30 px), and shows a
  visible focus outline when focused with the keyboard. Icon and border have ≥ 3:1 contrast against white (FR-009). Focus stays on the button after activation.

## Behavior

| Input | Result |
|---|---|
| Click / tap | `map.setView([startView.lat, startView.lng], startView.zoom, { animate: !prefersReducedMotion })` |
| Same, with `prefers-reduced-motion: reduce` | Instant jump, no animation (FR-010) |
| Keyboard focus + Enter or Space | Same as click (native button) |
| Press when already at the starting view | No error, no visible jump (FR-008) |
| Press during a pan/zoom/fitBounds animation | Running animation stops; map ends on the starting view |
| Repeated presses | Same final center and zoom every time |
| Press while routes are loading | Map moves; route fetching continues unchanged; when those routes arrive they are drawn and listed but the map does **not** fit them (FR-011). Routes of any later search fit as usual |

Events do not propagate to the map (`L.DomEvent.disableClickPropagation`,
`L.DomEvent.disableScrollPropagation`), so pressing the button never also zooms or pans the map.

## Guarantees after a press (FR-005, SC-004)

Unchanged: search input value, search results list, destination marker, drawn routes and their
styles, selected route (`aria-pressed`), travel mode radios, pleasure texts, status text, user
position marker, and the starting view itself. The only internal write is `resetRouteSeq = routeSeq`,
which stops the route search loading during the press from fitting the map (FR-011).

Changed: only the map center and zoom (center equal to the starting view within floating-point
tolerance, zoom exactly equal: SC-002).
