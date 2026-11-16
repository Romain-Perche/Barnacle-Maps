# Contract: UI (mode selector and status wording)

## Mode selector (`index.html`)

```html
<div id="mode" role="radiogroup" aria-label="Travel mode">
  <label><input type="radio" name="mode" value="foot" checked> <span aria-hidden="true">🚶</span> Walk</label>
  <label><input type="radio" name="mode" value="car"> <span aria-hidden="true">🚗</span> Car</label>
  <label><input type="radio" name="mode" value="bike"> <span aria-hidden="true">🚲</span> Bike</label>
</div>
```

- Rendered as one segmented bar, three equal segments; checked segment highlighted (blue text, light-blue background, bold).
- Radios visually hidden but focusable; arrow keys move selection; focused segment shows a visible focus ring.
- `foot` checked on load.

## Status messages (`{noun}`/`{by}` from `TRAVEL_MODES`; `{noRoute}` from the literal `NO_ROUTE` map in `src/app.js`, research R2)

| Situation | Text |
|---|---|
| Computing | `Computing {noun} routes…` |
| ≥ 2 routes | `{n} {noun} routes{via} · fastest {distance} · {duration}` |
| 1 route | `{distance} · {duration} {by}{via}` |
| None, no stops | `{noRoute}` = `No {noun} route found.` (literal per mode) |
| None, with stops | `{noRoute} Try removing a stop.` |
| Request failed, no stops | `Routing failed: {message}` (unchanged) |
| Request failed, with stops | `{noRoute} ({message})` |

Bike examples: "Computing cycling routes…", "2 cycling routes · fastest 3.42 km · 13 min", "3.42 km · 13 min by bike".
Walk and car texts are identical to today's.

## Route list

Each route entry for `pleasure: true` modes (walk, bike) has a `.pleasure` line ("Pleasure: …" → "Pleasure: N green px[ · most pleasant]" or "Pleasure unavailable"). Car entries have none.
