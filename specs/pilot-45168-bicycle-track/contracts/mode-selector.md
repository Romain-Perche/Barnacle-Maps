# Contract: travel mode selector (UI)

```html
<div id="mode" role="radiogroup" aria-label="Travel mode">
  <label><input type="radio" name="mode" value="foot" checked><span aria-hidden="true">🚶</span> Walk</label>
  <label><input type="radio" name="mode" value="car"><span aria-hidden="true">🚗</span> Car</label>
  <label><input type="radio" name="mode" value="bike"><span aria-hidden="true">🚲</span> Bike</label>
</div>
```

- Three adjacent segments in this order, with exactly one checked. The checked segment is highlighted (blue background
  `#1a73e8` / `#e8f0fe`, as for the selected route).
- Inputs are visually hidden but focusable. Arrow keys move the selection, and a focus ring shows on the segment.
- Accessible names: "Walk", "Car", "Bike". Walk is checked at load.
- Status strings by mode (FR-007): `Computing {noun} routes…`, `No {noun} route found.`,
  `{distance} · {duration} {adverb}[ via N stop(s)]`, `{n} {noun} routes[ via N stop(s)] · fastest {distance} · {duration}`.
