# Contract: Travel modes (SF-72)

## 1. `TRAVEL_MODES` (export of `src/geo.js`)

```js
TRAVEL_MODES.bike
// → { label: "Bike", icon: "🚲", base: "https://routing.openstreetmap.de/routed-bike",
//     profile: "bike", pleasure: true, detours: false }
```

`foot` and `car` gain `icon`, `pleasure` and `detours` with the values listed in data-model.md. Their existing `label`, `base` and `profile` values stay as they are.

## 2. `routeUrl(from, to, base, { mode: "bike", alternatives, via, stops })`

The signature does not change. Examples with from `{48.85, 2.35}` and to `{48.86, 2.36}`:

| Call | URL |
|------|-----|
| `routeUrl(from, to, undefined, { mode: "bike" })` | `https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86?overview=full&geometries=geojson` |
| `… { mode: "bike", alternatives: 3 }` | same + `&alternatives=3` |
| `… { mode: "bike", stops: [s1, s2] }` | coordinates `from;s1;s2;to` in that order |
| `routeUrl(from, to, "https://example.test", { mode: "bike" })` | `https://example.test/route/v1/bike/…` |

## 3. Selector markup (`index.html`)

```html
<div id="mode" role="radiogroup" aria-label="Travel mode">
  <label><input type="radio" name="mode" value="foot" checked><span><span aria-hidden="true">🚶</span> Walk</span></label>
  <label><input type="radio" name="mode" value="car"><span><span aria-hidden="true">🚗</span> Car</span></label>
  <label><input type="radio" name="mode" value="bike"><span><span aria-hidden="true">🚲</span> Bike</span></label>
</div>
```

- Order: Walk, Car, Bike. Exactly one `checked` (foot) on load.
- The `change` listener in `src/app.js` stays as it is.

## 4. Selector styling (`styles.css`, design C)

- `#mode`: one row, `display:flex`, 1px border `#1a73e8`, `border-radius:6px`, `overflow:hidden`, 14px font. The labels share the width equally (`flex:1`).
- The inputs are visually hidden but focusable (for example `position:absolute; opacity:0; width:1px; height:1px`). They must not be removed with `display:none`.
- Segment: `#mode input + span` → `display:block; text-align:center; padding:6px 8px; color:#1a73e8; cursor:pointer`. Divider between segments: `#mode label + label { border-left:1px solid #1a73e8 }`.
- Selected: `#mode input:checked + span` → `background:#1a73e8; color:#fff; font-weight:600`.
- Focus: `#mode input:focus-visible + span` → a visible outline.
- **MUST NOT** write a descendant rule like `#mode span { display/padding … }`. It also matches the nested icon span and puts the emoji on its own line, which was the bug in the reverted SF-70. The icon and its label stay on one line.

## 5. User-facing texts (`src/app.js`)

| Situation | Bike text |
|-----------|-----------|
| Computing | `Computing cycling routes…` |
| No route | `No cycling route found.` (with stops: `… Try removing a stop.`) |
| One route | `{dist} · {dur} by bike[ via N stop(s)]` |
| Several | `{n} cycling routes[ via N stop(s)] · fastest {dist} · {dur}` |
| Pleasure tooltip (Walk and Bike) | `Green pixels (parks, grass, woods) on the map along this route; more is more pleasant` |

Walk and Car texts do not change (see data-model.md, ModeText).

## 6. "No route" answers: `isNoRouteResponse(json)` (export of `src/geo.js`)

| Input | Result |
|-------|--------|
| `{ code: "NoRoute", message: "No route found." }` (OSRM sends it with HTTP 400) | `true` |
| `{ code: "NoSegment", … }` | `true` |
| `{ code: "InvalidQuery" }`, `{ code: "InvalidValue" }`, `{ code: "TooBig" }`, `{ code: "Ok", … }` | `false` |
| `null`, `undefined`, a string, `{}` | `false` |

`src/app.js`: the routing requests (main and detour) read the body of a non-OK response. If `isNoRouteResponse(body)` is true, the request counts as "no routes" (`[]`), which gives "No cycling route found." (or the walking/driving text). Otherwise it still throws `Request failed (<status>)`. Search requests (Nominatim) do not change.
