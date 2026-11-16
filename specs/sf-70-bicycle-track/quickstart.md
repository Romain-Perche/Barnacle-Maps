# Quickstart: validate Bicycle Travel Mode (SF-70)

## Prerequisites

- Node 18+ (for `node --test`), Python 3 (for the static server), a modern browser.
- Network access to `routing.openstreetmap.de`, `nominatim.openstreetmap.org`, `tile.openstreetmap.org`, `unpkg.com`.

## Automated checks

```bash
npm test
```

Expected: all tests pass, including `test/bike.test.js`, the updated key-list test in `test/modes.test.js` and L5 in `test/routes.test.js`. They cover:
- `TRAVEL_MODES` keys `bike`, `car`, `foot`; bike base `…/routed-bike`, profile `bike`, `pleasure: true`, `detours: false`; car `pleasure: false`; foot `detours: true`.
- `routeUrl` for bike: plain, with `alternatives: 3`, with stops (order kept), with explicit base.
- Bike texts (`Computing cycling routes…`, `No cycling route found.`, `by bike`, `cycling`) and unchanged foot/car texts.

## Live API smoke check

```bash
curl -s "https://routing.openstreetmap.de/routed-bike/route/v1/bike/13.4132,52.5219;13.3777,52.5163?overview=false&alternatives=3" | head -c 300
```

Expected: `"code":"Ok"` and 1–3 routes; the duration is lower than the same request on `routed-foot/route/v1/foot/…` (SC-002).

AI scenarios with yes/no checks: `tests/ai/us1-cycling-routes.md`, `tests/ai/us2-switch-modes.md`, `tests/ai/us3-bike-stops.md`.

## Manual scenarios (`npm start`, open http://localhost:8000, allow location)

1. **Selector (US1-1)**: one row of three segments `🚶 Walk | 🚗 Car | 🚲 Bike`, Walk highlighted. Tab into it and use arrow keys: highlight moves; a screen reader announces "Bike, radio button, selected".
2. **Bike routes (US1-2..6)**: select Bike, search a place 2–10 km away. Status shows `Computing cycling routes…`, then 1–3 routes with distance and duration, Route 1 selected, summary `… cycling routes …` or `… by bike`. Each route then shows `Pleasure: N green px`, one with `most pleasant`; hover tooltip says "along this route". Clicking a route on the map or panel selects it.
3. **No detours (FR-006)**: a very short bike trip where OSRM returns one route shows exactly one route.
4. **Switching (US2)**: with walking routes shown, select Bike → cycling routes, same destination, shorter durations; select Walk → walking routes return; select Car → no pleasure indicator. Click Walk, Bike, Car quickly: only Car routes end up displayed.
5. **Stops (US3)**: add 2 stops, select Bike, choose a destination: the route passes through both in order; switching mode keeps the stops.
6. **Errors/limits**: block `routing.openstreetmap.de` in devtools → `Routing failed: …` and no routes displayed. A bike trip > pleasure limit → each route `Pleasure unavailable`.
7. **README (FR-011)**: mentions Bike mode, `routed-bike` OSRM source, pleasure for walking and bike.
