# Quickstart: Validate "Show the arrival time for each route"

**Contracts**: [contracts/route-entry.md](./contracts/route-entry.md) | **Data model**: [data-model.md](./data-model.md)

## Prerequisites

- Node.js ≥ 18 (for `node --test`), Python 3 (for the static server)
- A browser with geolocation (localhost counts as secure), plus network access to OSM tiles, Nominatim and routing.openstreetmap.de

## 1. Unit tests

```bash
npm test
```

Expected: all existing suites pass, plus a new arrival-time test file (e.g. `test/arrival.test.js`) that covers every row of the tables in [contracts/route-entry.md](./contracts/route-entry.md): same-day results, rounding at 29 s and 30 s, midnight rollover (`+1 day`), several days (`+N days`), rounding that crosses midnight, and monotonicity (a longer duration never gives an earlier arrival).

Tests build departures with the local `new Date(y, m, d, h, min, s)` constructor, so they pass in any `TZ`. To double-check, run them in another time zone:

```bash
TZ=Pacific/Auckland npm test
TZ=America/New_York npm test
```

## 2. Manual check in the browser

```bash
npm start            # http://localhost:8000
```

1. Allow location and search for a destination 1–3 km away. **Expect**: every route reads `Route N · X km · D min, arrive HH:MM`, where HH:MM ≈ the current clock time + D (±1 min). Longer routes never show earlier times. The status line under the list has no "arrive".
2. Switch to **Car**. **Expect**: the car routes show arrival times based on the moment of the switch, and no pleasure line appears.
3. Add a stop ("Add as stop" or click map → "Add stop here"). **Expect**: the recomputed route(s) show arrival times for the full trip through the stops.
4. Wait at least 2 minutes without touching anything. **Expect**: the times don't change. Then switch the mode back and forth. **Expect**: the times move forward to reflect the new computation.
5. Long trip: search for a city 100+ km away in Car mode. **Expect**: the duration shows in hours (`2 h 5 min`) and still has `, arrive HH:MM`.
6. Next day (optional): set the device clock to 23:50 (or use DevTools → Sensors / an overridden `Date`) and compute a route of 15+ min. **Expect**: `arrive 00:xx (+1 day)`.
7. Failure: go offline (DevTools → Network → Offline) and search. **Expect**: the existing error message appears, with no route entries and no arrival time.
