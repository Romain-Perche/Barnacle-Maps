# Quickstart / Validation: Bicycle Travel Mode (SF-72)

## Prerequisites

- Node 18+ (for `node --test`) and Python 3 (for `npm start`).
- A browser with geolocation (served from localhost).
- Outbound access to `routing.openstreetmap.de`, `nominatim.openstreetmap.org`, `tile.openstreetmap.org` and `unpkg.com`. If a sandbox blocks them, mock the responses (for example with Playwright route interception), as was done for SF-70.

## 1. Unit tests

```bash
npm test
```

Expected: all tests pass. This includes the existing suites (only the key list in `test/modes.test.js` is updated) and the new `test/bike.test.js` checks from contracts/travel-modes.md §1–§5.

## 2. Selector (US1-AS1, FR-001)

`npm start`, open http://localhost:8000.
- One row of three segments: "🚶 Walk | 🚗 Car | 🚲 Bike". Walk is highlighted. Each emoji sits on the same line as its label.
- Tab into the group and use the arrow keys to move between modes. A screen reader announces "Walk, radio button, selected, 1 of 3".

## 3. Cycling routes (US1)

Select Bike and search for a place 2–10 km away.
- The status shows "Computing cycling routes…", then "N cycling routes · fastest …" or "… by bike".
- 1–3 routes appear, the first is selected, and clicking a route on the map or in the panel selects it.
- Each route shows "Pleasure: …", then a green-pixel count. One route is marked "most pleasant", or all show "Pleasure unavailable" for long trips.
- The durations are shorter than Walk's for the same destination (SC-002).

## 4. Switching (US2)

With Walk routes shown, click Bike: the routes are replaced by cycling routes to the same destination. Click Car: the routes have no pleasure line. Click Walk, then Bike quickly: only Bike routes remain.

## 5. Stops (US3)

Add 2 stops, select Bike and choose a destination. The route goes through stop 1, then stop 2. Switch modes: the stops are kept.

## 6. Live endpoint check (research R1)

```bash
curl -s "https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86?overview=false&alternatives=3" | head -c 200
```

Expected: `{"code":"Ok",…`. If the service rejects the `bike` segment, switch `TRAVEL_MODES.bike.profile` to `driving` and update the tests.

## 7. Error case

Block `routed-bike` in DevTools (request blocking) and select Bike: the status shows "Routing failed: …" and no Walk or Car routes stay on the map.
