# Contracts

## geo.js API
- `searchUrl(query, base?, near?)` — `near` is `{lat,lng}` or omitted/null. With `near`, appends `viewbox=<left>,<top>,<right>,<bottom>`; never `bounded=1`. Without it, the URL is identical to today's (`q`, `format=jsonv2`, `limit=5`).
- `sortByDistance(results, from)` → new array; each item `{...result, distance}` sorted ascending, stable; `from == null` → returns a copy with no `distance`.

## UI (Design A)
Each result row: `[name button (flex:1)] [distance text] [Add as stop]`. Distance text uses `formatDistance` ("350 m", "4.20 km"); absent when position unknown. Click on name → `showRoute(place)`, "Add as stop" → `tryAddStop(place)`, each bound to the row's own place after sorting.
