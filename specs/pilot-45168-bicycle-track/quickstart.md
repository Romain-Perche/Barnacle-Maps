# Quickstart: validate the Bicycle Travel Mode

## Prerequisites
- Node ≥ 20 and Python 3. Network access to `routing.openstreetmap.de`, `tile.openstreetmap.org`,
  `nominatim.openstreetmap.org` and `unpkg.com`.

## Automated
```bash
npm test
```
Expected: all tests pass, including the new bike cases in `test/modes.test.js` / `test/stops.test.js`
(see [contracts/travel-modes.md](./contracts/travel-modes.md)).

## Manual (browser)
```bash
npm start   # http://localhost:8000
```
1. The selector shows three segments, 🚶 Walk | 🚗 Car | 🚲 Bike, with Walk highlighted.
2. Allow location, search for a place about 3 km away, and pick it. Walking routes appear.
3. Select Bike. The status shows "Computing cycling routes…", then "N cycling routes · fastest …" or "… by bike".
   The durations are shorter than walking. Each route has a pleasure line, and one is marked "most pleasant".
4. Click a route on the map or in the list. It becomes the selected route.
5. Add two stops, then switch Walk → Bike → Car → Bike. The destination and stops are kept, routes go through the stops
   in order, and the status wording follows the mode. Car routes have no pleasure line.
6. Tab to the selector and use the arrow keys. The selection moves, and a screen reader announces "Bike, radio button, selected".
7. Pick a destination more than 15 km away in Bike mode. The routes show, with "Pleasure unavailable".
