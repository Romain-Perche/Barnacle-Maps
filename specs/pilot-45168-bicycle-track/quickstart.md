# Quickstart: validate the Bicycle Travel Mode

## Prerequisites

Node ≥ 18, Python 3, a browser with geolocation, network access to `routing.openstreetmap.de`, `nominatim.openstreetmap.org`, `tile.openstreetmap.org`.

## 1. Unit tests

```bash
npm test
```

Expected: all tests pass, including the bike cases of [contracts/geo-api.md](./contracts/geo-api.md) and the updated mode-set test.

## 2. Endpoint smoke check

```bash
curl -s "https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86?overview=false&alternatives=3" | head -c 200
```

Expected: JSON with `"code":"Ok"` and a `routes` array.

## 3. Manual app checks

`npm start`, open http://localhost:8000, allow location.

| # | Steps | Expected |
|---|---|---|
| 1 | Look at the panel | Segmented bar "🚶 Walk · 🚗 Car · 🚲 Bike", Walk highlighted |
| 2 | Tab to the selector, press → twice | Selection moves Walk → Car → Bike; focus ring visible |
| 3 | Search a place ~3 km away, pick it, select Bike | "Computing cycling routes…", then 1–3 routes; status uses "cycling"/"by bike"; durations shorter than Walk for same trip |
| 4 | Wait | Each bike route shows a pleasure line; greenest marked "most pleasant" |
| 5 | Click a route on the map / in the list | It becomes selected |
| 6 | Add 2 stops; switch Walk → Bike → Car → Bike | Destination and stops kept; routes recomputed each time; car shows no pleasure line |
| 7 | Switch modes rapidly | Only routes for the final mode remain |
| 8 | Pick a destination > 15 km away, Bike | Routes shown, pleasure "Pleasure unavailable" |
| 9 | README | Mentions bike mode and `routed-bike` |
