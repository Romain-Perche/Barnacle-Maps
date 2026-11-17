# Quickstart: validate the Bicycle Travel Mode

## Prerequisites

- Node ≥ 20, Python 3, a browser with geolocation (localhost)
- Network access to `routing.openstreetmap.de`, `nominatim.openstreetmap.org`, `tile.openstreetmap.org`, `unpkg.com`

## Automated checks

```bash
npm test
```

Expected: all tests pass. That includes:
- the existing suite, with the two edits listed in [research.md](./research.md) R7
- `test/bike.test.js`: [contract](./contracts/travel-modes.md) URLs and the [data model](./data-model.md) fields
- `test/selector.test.js`: design C markup and CSS
- `test/bike-app.test.js`: the real `src/app.js` with fakes
- `test/osrm-fake.test.js`: the fake OSRM checked against the OSRM docs

The outside services are fakes; see `.factory/test-env.md`.

## AI scenarios

`tests/ai/us1-cycling-routes.md`, `us2-switch-modes.md`, `us3-stops.md`. They run the real app in headless Chromium through `tests/ai/harness.mjs` (setup in `tests/ai/README.md`).

## Live routing check (couldn't run during planning: firewall)

```bash
curl -s "https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.3522,48.8566;2.3622,48.8436?overview=false&alternatives=3" | head -c 300
```

Expected: `"code":"Ok"` and at least one route. If the server rejects the `bike` segment, switch `profile` to `driving` (research R1).

## Manual scenarios

Run `npm start`, open http://localhost:8000, and allow location.

1. **Selector (US1-1, FR-001/002)**: one row `🚶 Walk | 🚗 Car | 🚲 Bike`, Walk highlighted. Tab into it and use the arrow keys to move the selection.
2. **Bike routes (US1-2..6)**: select Bike and search a place 3–5 km away. Expected: "Computing cycling routes…", then up to 3 routes with distance/duration. The summary says "cycling routes" or "by bike". The pleasure line appears and one route is "most pleasant". Clicking a route on the map or in the panel highlights it.
3. **Duration sanity (SC-002)**: for the same destination, the bike duration is between the walk and car durations.
4. **Switch modes (US2)**: with a destination set, go Walk → Bike → Car → Bike. Routes are replaced each time with no new search. Clicking quickly ends on the last mode's routes.
5. **Stops (US3)**: add 2 stops, then select Bike. The route passes through both in order. Switching modes keeps the stops.
6. **Long ride**: pick a destination more than 15 km away in Bike mode. Expected: "Pleasure unavailable".
7. **Car unchanged**: Car routes show no pleasure line.
