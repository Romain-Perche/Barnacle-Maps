# Contract: `src/geo.js` travel-mode API

## `TRAVEL_MODES`

Keys: exactly `foot`, `car`, `bike`. Each value has the fields listed in [data-model.md](../data-model.md#travelmode-travel_modeskey-in-srcgeojs).
Existing fields (`label`, `base`, `profile`) of `foot` and `car` keep their current values.

## `routeUrl(from, to, base?, { alternatives, via, mode, stops })`

Signature and behavior unchanged. New case:

| Call | Result |
|---|---|
| `routeUrl(a, b, undefined, { mode: "bike" })` | `https://routing.openstreetmap.de/routed-bike/route/v1/bike/{a.lng},{a.lat};{b.lng},{b.lat}?overview=full&geometries=geojson` |
| … with `alternatives: 3` | same + `&alternatives=3` |
| … with `stops: [s1, s2]` | coords `a;s1;s2;b` in that order |
| … with explicit `base` | `{base}/route/v1/bike/…` |
