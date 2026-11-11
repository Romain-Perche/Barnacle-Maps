# UI Contract: "Reset view" map control

## Placement and look (FR-001, FR-007)

- A Leaflet control added to the map at startup with `position: "bottomright"`. Leaflet stacks it above the attribution.
- Container: `div.leaflet-control.leaflet-bar.reset-view-control`, so it looks like the other Leaflet controls.
- Visible on every screen size whenever the map is shown. It never overlaps `#panel` (top-left) or the zoom control (top-left).

## DOM

```html
<div class="leaflet-control leaflet-bar reset-view-control">
  <button type="button" aria-label="Reset view" title="Reset view">
    <span aria-hidden="true">⌂</span>
  </button>
</div>
```

- Button size matches Leaflet bar buttons (30×30 px, or 34×34 px when touch styles apply) (FR-009).
- It shows a visible `:focus-visible` outline. The icon and the outline have at least 3:1 contrast against their background (FR-009).
- The control is always enabled, also when the map is already at the starting view (FR-001).
- Clicks, double-clicks and wheel events on the container do not reach the map (`L.DomEvent.disableClickPropagation`, `disableScrollPropagation`).

## Behaviour (FR-002 … FR-006)

| Trigger | Result |
|---------|--------|
| Mouse click / tap | `map.setView([start.lat, start.lng], start.zoom, { animate: !reducedMotion })` where `start = startView.get()` and `reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches`, read at the moment of activation (FR-010) |
| After activation | Keyboard focus stays on the button (FR-006) |
| Keyboard focus + Enter or Space | Same as a click (native `<button>`) |
| Screen reader focus | Announced as a button named "Reset view" |
| Pressed during a pan/zoom animation | That animation stops; the map ends at the starting view |
| Pressed several times quickly | Map ends at the starting view; no errors |
| Pressed before the first location fix | Goes to the default view; the first fix still centers the map and becomes the starting view |

**Must not do**: request a location fix (FR-008), cancel route or pleasure computations in progress, or announce anything extra to assistive technology.

**Must not change**: search input, search results, destination marker, the open/closed state of the destination popup, drawn routes, selected route, travel mode, pleasure indicators, user marker, status text, `centered`, or any request sequence counter.

**Timing**: the map reaches the starting view within 1 s (SC-002).
