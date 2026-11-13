# Quickstart: validating the Bicycle Option

## Prerequisites

- Node ≥ 18, Python 3, a browser with geolocation (localhost is fine).
- Network access to `routing.openstreetmap.de`, `nominatim.openstreetmap.org`, `tile.openstreetmap.org`, `unpkg.com`.

## Automated

```bash
npm test
```

Expected: all tests pass, including `test/modes.test.js` checks that `TRAVEL_MODES` has `foot`, `car`, `bike`,
every mode has `label`/`base`/`profile`/`adjective`/`by`, and the bike URLs match
[contracts/travel-modes.md](contracts/travel-modes.md). `test/bike-ui.test.js` checks the Walk · Car · Bike radios (Walk checked) and the README bike line. Existing walk/car/stops/pleasure test files are unchanged and pass (SC-004).

## Endpoint sanity check (not done during planning: no network access from the sandbox)

```bash
curl -s "https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86?overview=false&alternatives=3" | head -c 300
```

Expected: JSON with `"code":"Ok"` and `routes[].duration` lower than the same query on `routed-foot`.

## Manual (in the app)

1. `npm start`, open http://localhost:8000, allow location.
2. Search a destination ~2–5 km away; walking routes appear (Walk is the default).
3. Click **Bike**: status shows "Computing cycling routes…", then up to 3 routes with distance + duration, no
   pleasure label; summary says "by bike" or "N cycling routes · fastest …" ([contracts/ui.md](contracts/ui.md)).
   Bike duration < walking duration for the same trip.
4. Click a route in the panel, then another on the map: selection follows.
5. Switch to **Car**, then **Walk**: routes recompute for the same destination; walk shows pleasure again.
6. Add 2 stops, select **Bike**: route passes through the stops in order; reorder/remove a stop → recomputed.
7. Click Bike then quickly Walk: only walking routes end up displayed.
8. README mentions the bike mode.
