# Contract: Reset View

**Feature**: [../spec.md](../spec.md) | **Data model**: [../data-model.md](../data-model.md)

Two interfaces: a pure function exported from `src/geo.js` (tested with `node --test`) and the UI
control on the map (tested manually, see [../quickstart.md](../quickstart.md)).

## 1. `startingView(firstFix, defaultView, locateZoom)` — `src/geo.js`

```js
export function startingView(firstFix, defaultView, locateZoom) → { lat, lng, zoom }
```

| Input         | Type                              | Meaning                                       |
|---------------|-----------------------------------|-----------------------------------------------|
| `firstFix`    | `{ lat, lng }` or `null`/`undefined` | the first location found, if any           |
| `defaultView` | `{ lat, lng, zoom }`              | the app's fixed default view                  |
| `locateZoom`  | number                            | the close zoom used when centering on the user |

Behaviour:

1. `firstFix` has finite `lat` and `lng` → returns `{ lat: firstFix.lat, lng: firstFix.lng, zoom: locateZoom }`.
2. Otherwise (`null`, `undefined`, or non-finite coordinates) → returns `{ lat, lng, zoom }` copied
   from `defaultView`.
3. Always returns a new object; never mutates its inputs.

Examples:

| Call | Result |
|------|--------|
| `startingView({ lat: 45.76, lng: 4.84 }, { lat: 48.8566, lng: 2.3522, zoom: 13 }, 15)` | `{ lat: 45.76, lng: 4.84, zoom: 15 }` |
| `startingView(null, { lat: 48.8566, lng: 2.3522, zoom: 13 }, 15)` | `{ lat: 48.8566, lng: 2.3522, zoom: 13 }` |
| `startingView({ lat: NaN, lng: 4.84 }, { lat: 48.8566, lng: 2.3522, zoom: 13 }, 15)` | `{ lat: 48.8566, lng: 2.3522, zoom: 13 }` |

## 2. "Reset view" map control — `src/app.js` (+ `styles.css`)

**DOM** (inside the Leaflet `bottomright` corner, above the attribution):

```html
<div class="leaflet-control reset-view leaflet-bar">
  <button type="button" title="Reset view">Reset view</button>
</div>
```

| Property            | Value                                                          | Requirement |
|---------------------|----------------------------------------------------------------|-------------|
| Element             | native `<button type="button">`                                | FR-004      |
| Accessible name     | "Reset view" (from text content)                               | FR-005      |
| Tooltip             | `title="Reset view"`                                           | FR-001      |
| Visible             | whenever the map is shown; never hidden or disabled            | FR-001      |
| Position            | Leaflet `bottomright` corner, above the attribution (no overlap) | FR-006      |
| Focus               | document tab order (map controls, after zoom buttons); visible `:focus-visible` outline; stays on the button after activation | FR-004, FR-004a |
| Size / contrast     | ≥ 44 × 44 CSS px; WCAG 2.1 AA (text 4.5:1, edge 3:1)            | FR-004a     |
| Event propagation   | click, double-click, wheel and drag do not reach the map       | FR-003a     |

**On activation** (click, tap, Enter, Space):

1. If a Leaflet zoom animation is running, wait for the map's next `zoomend`, then continue.
2. Call `map.setView([startView.lat, startView.lng], startView.zoom)`, with `{ animate: false }` when
   the user prefers reduced motion.
3. Nothing else: no status message or screen-reader announcement, popups left as they are, no change to routes, markers, panel, mode or selection (FR-003).

Guarantees: ends at `startView` within 1 s (SC-002); a no-op if already there (FR-007); repeated
presses all end at `startView`; no errors when location is denied or not yet found.
