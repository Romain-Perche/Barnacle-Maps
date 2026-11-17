# Contract: Travel modes (`src/geo.js` exports + selector markup)

## `TRAVEL_MODES` (exported object)

Shape of every entry: see `../data-model.md`. Consumers: `routeUrl` (base/profile), `src/app.js` (texts, `pleasure`, `detours`, selector validation `value in TRAVEL_MODES`).

## `routeUrl(from, to, base?, { alternatives, via, mode, stops })` (unchanged signature)

| Input | Output |
|---|---|
| `mode: "bike"` | `https://routing.openstreetmap.de/routed-bike/route/v1/bike/{lng,lat;…}?overview=full&geometries=geojson` |
| `mode: "bike", alternatives: 3` | same + `&alternatives=3` |
| `mode: "bike", stops: [s1, s2]` | coordinates `from;s1;s2;to` in that order |
| `mode: "bike"`, explicit `base` | `{base}/route/v1/bike/…` |
| `mode: "foot"` / `"car"` / unknown | unchanged from today |

## OSRM response consumed

Same as walking/car: `{ code: "Ok", routes: [{ distance, duration, geometry: { coordinates: [[lng, lat], …] } }] }`; anything else → no route.

## Selector markup (`index.html`, design C)

```html
<div id="mode" role="radiogroup" aria-label="Travel mode">
  <label><input type="radio" name="mode" value="foot" checked><span><span aria-hidden="true">🚶</span> Walk</span></label>
  <label><input type="radio" name="mode" value="car"><span><span aria-hidden="true">🚗</span> Car</span></label>
  <label><input type="radio" name="mode" value="bike"><span><span aria-hidden="true">🚲</span> Bike</span></label>
</div>
```

- One row, equal-width segments, single outer border; checked segment highlighted (`input:checked + span`), keyboard focus visible (`input:focus-visible + span`).
- Inputs are visually hidden but focusable (not `display:none`) so arrow keys and screen-reader "selected" state keep working.
- `change` on a radio whose value is in `TRAVEL_MODES` sets the mode and recomputes routes for the current destination, keeping stops.

## User-visible texts for Bike

`Computing cycling routes…` · `No cycling route found.` · `{distance} · {duration} by bike[ via N stop(s)]` · `{N} cycling routes[ via N stop(s)] · fastest {distance} · {duration}` · pleasure tooltip `Green pixels (parks, grass, woods) on the map along this route; more is more pleasant`.
