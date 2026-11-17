# Contract: outside service, OSRM Route service (FOSSGIS bike instance)

Request: `GET https://routing.openstreetmap.de/routed-bike/route/v1/bike/{lng},{lat};...;{lng},{lat}?overview=full&geometries=geojson[&alternatives=3]`

Response fields the app reads (from the OSRM HTTP docs, `docs/http.md` "Route service" / "Route object"):

```json
{ "code": "Ok",
  "routes": [ { "distance": 1234.5, "duration": 300.2,
                "geometry": { "type": "LineString", "coordinates": [[2.35, 48.85], ...] } } ] }
```

- `code` other than `"Ok"` (e.g. `"NoRoute"`) or no `routes` → treated as no route (`parseRoutes` returns `[]`).
- HTTP error → `fetchJson` throws → the status line shows the error, and no routes are shown.
- Same shape as the foot and car instances: no parser change.
