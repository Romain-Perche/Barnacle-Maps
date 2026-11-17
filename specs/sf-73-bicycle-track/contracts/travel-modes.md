# Contract: Travel modes

## `TRAVEL_MODES` (export of `src/geo.js`)

Shape and values: see [../data-model.md](../data-model.md). Consumers: `routeUrl` (base, profile) and `src/app.js` (texts, `pleasure`, `detours`, the selector's `value in TRAVEL_MODES` check).

## `routeUrl(from, to, base?, { alternatives, via, mode, stops })`: signature unchanged

| Input | Output |
|---|---|
| `mode: "bike"` | `https://routing.openstreetmap.de/routed-bike/route/v1/bike/{lng,lat;…}?overview=full&geometries=geojson` |
| `mode: "bike", alternatives: 3` | same + `&alternatives=3` |
| `mode: "bike", stops: [s1, s2]` | coordinates `from;s1;s2;to` in order |
| `mode: "bike"`, explicit `base` | `{base}/route/v1/bike/…` |
| `mode: "foot"` / `"car"` / unknown | unchanged |

## OSRM response consumed

- HTTP 200: `{ code: "Ok", waypoints, routes: [{ distance, duration, geometry: { type: "LineString", coordinates: [[lng, lat], …] }, … }] }`.
- HTTP 400 with `{ code: "NoRoute", message }`: no route. The app shows the mode's `noRoute` text.
- Any other non-OK answer: routing error. The app shows `Routing failed: Request failed (N)`, or `{noRoute} (Request failed (N))` when there are stops.

## Selector markup (`index.html`, design C)

```html
<div id="mode" role="radiogroup" aria-label="Travel mode">
  <label><input type="radio" name="mode" value="foot" checked><span><span aria-hidden="true">🚶</span> Walk</span></label>
  <label><input type="radio" name="mode" value="car"><span><span aria-hidden="true">🚗</span> Car</span></label>
  <label><input type="radio" name="mode" value="bike"><span><span aria-hidden="true">🚲</span> Bike</span></label>
</div>
```

- One row, equal-width segments, one outer border with dividers. The checked segment is highlighted (`input:checked + span`), and keyboard focus is visible (`input:focus-visible + span`).
- Inputs are visually hidden, never `display:none`, so arrow keys and the "selected" state keep working.

## User-visible texts (bike)

- Computing: `Computing cycling routes…`
- No route: `No cycling route found.` (with stops: `No cycling route found. Try removing a stop.`)
- One route: `{distance} · {duration} by bike[ via N stop(s)]`
- Several: `{N} cycling routes[ via N stop(s)] · fastest {distance} · {duration}`
- Pleasure: `Pleasure: {n} green px[ · most pleasant]` / `Pleasure unavailable`. Tooltip: `Green pixels (parks, grass, woods) on the map along this route; more is more pleasant`
