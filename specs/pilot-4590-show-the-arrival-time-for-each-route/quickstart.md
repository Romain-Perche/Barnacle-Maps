# Quickstart: validate "arrival time for each route"

## Prerequisites

- Node.js ≥ 20 (repo uses `node --test`), Python 3 for the static server.
- Network access to OSM tiles, Nominatim and `routing.openstreetmap.de` for the manual checks.

## Automated

```bash
npm test                          # all suites, including test/arrival.test.js and test/route-entry.test.js
TZ=Europe/Paris npm test          # results must not depend on time zone
TZ=America/New_York npm test
```

Expected: all tests pass. `test/arrival.test.js` covers every row of
[contracts/arrival-helpers.md](./contracts/arrival-helpers.md), plus:
- monotonicity: increasing durations from one departure never give an earlier `at`;
- `at` = departure truncated to the minute + the minutes `formatDuration` shows, and `|at − (departure + duration)| < 90 s`, for random departures and durations;
- `src/app.js` imports `formatArrival` and uses it in the route title;
- `formatDuration` of a missing, non-finite or negative duration reads `1 min`;
- the daylight-saving rows run only under `TZ=Europe/Paris`.

## Manual (browser)

```bash
npm start    # http://localhost:8000
```

1. Allow geolocation, search a destination 1–3 km away (walk mode).
   **Expect**: every route reads `Route n · … · NN min, arrive HH:MM`, where HH:MM = the clock + NN, and the pleasure line is still below.
2. Switch to **Car**. **Expect**: arrival times on every car route, no pleasure line.
3. Add a stop. **Expect**: arrival = clock + full duration shown (through the stop).
4. Select another route, then wait for the pleasure scores. **Expect**: the arrival text of every route does not change.
5. Wait ≥ 1 minute without touching anything. **Expect**: the times do not change.
   Then switch mode back and forth. **Expect**: the times are recomputed from the new clock.
6. Search a destination with no route (e.g. across an ocean). **Expect**: the existing message and no arrival text.
7. Screen reader / devtools Accessibility pane: the route button's name includes "arrive HH:MM".
8. Optional midnight check: set the OS clock to 23:50 and route a ~25 min walk. **Expect**: `arrive 00:15 (+1 day)`.
