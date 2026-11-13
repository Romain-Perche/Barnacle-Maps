# Contract: `src/geo.js` travel modes

## `TRAVEL_MODES`

```js
TRAVEL_MODES = {
  foot: { label: "Walk", base: "https://routing.openstreetmap.de/routed-foot", profile: "foot",    adjective: "walking", by: "on foot" },
  car:  { label: "Car",  base: "https://routing.openstreetmap.de/routed-car",  profile: "driving", adjective: "driving", by: "by car"  },
  bike: { label: "Bike", base: "https://routing.openstreetmap.de/routed-bike", profile: "bike",    adjective: "cycling", by: "by bike" },
}
```

Keys (sorted): `["bike", "car", "foot"]`.

## `routeUrl(from, to, base?, { mode: "bike", alternatives?, via?, stops? })`

Signature unchanged. For `mode: "bike"` with from `2.35,48.85` and to `2.36,48.86`:

| Options | URL |
|---------|-----|
| `{ mode: "bike" }` | `https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86?overview=full&geometries=geojson` |
| `{ mode: "bike", alternatives: 3 }` | same + `&alternatives=3` |
| `{ mode: "bike", stops: [s1, s2] }` | coordinates `from;s1;s2;to` in order |
| base `"https://example.test"`, `{ mode: "bike" }` | `https://example.test/route/v1/bike/…` |

Existing foot/car URLs are unchanged.
