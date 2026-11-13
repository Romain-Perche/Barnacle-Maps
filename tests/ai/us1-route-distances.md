# US1: Read route distances at a glance
Covers: FR-001, FR-002, FR-003, FR-004, FR-006, FR-008, SC-001, SC-002, US1 scenarios 1, 2, 3, 4, 5, edge cases (0 m, just below 1 km, very long route, invalid distance, package not loaded / slow)

## Common setup (all scenarios)
1. In the repo root run `npm start` (serves http://localhost:8000; no install or build needed for the browser).
2. Use headless Playwright (Chromium) with network access to unpkg.com. Create the context with
   `geolocation: { latitude: 48.8566, longitude: 2.3522 }` and `permissions: ["geolocation"]`.
3. Mock geocoding: `page.route("https://nominatim.openstreetmap.org/search**", r => r.fulfill({ json: [{ display_name: "Test Place", lat: "48.8600", lon: "2.3600" }] }))`.
4. Mock car routing with a handler that returns the JSON of the current scenario:
   `page.route("https://routing.openstreetmap.de/routed-car/**", r => r.fulfill({ json: OSRM }))`, where
   `OSRM = { code: "Ok", routes: [ ... ] }` and each route is
   `{ distance: D, duration: T, geometry: { coordinates: [[2.3522, 48.8566], [LNG, LAT], [2.36, 48.86]] } }`.
   Give each route of one response a different middle point `[LNG, LAT]` (e.g. `[2.3522, 48.8600]`, `[2.3600, 48.8566]`, `[2.3400, 48.8700]`) so no route is dropped as overlapping.
5. Open http://localhost:8000. Wait until the page's `#status` no longer reads "Waiting for your location…", then run
   `await page.evaluate(() => import("/src/geo.js").then(m => m.distanceFormatReady))` so the package has loaded.
6. Select the **Car** travel mode: `page.check('input[name="mode"][value="car"]')` (car mode adds no detour routes and no pleasure tiles).

To run one search: fill `#search-input` with `test`, press Enter, click the first button of the first `#results li` (the "Test Place" button, not "Add as stop"), then wait until `#routes li` has the expected number of entries.

Read texts with: route entries = `#routes li button > span:first-child` textContent; summary = `#status` textContent.

## Scenario 1: metres below 1 km (US1 scenario 1, FR-002)
### Setup
Common setup; OSRM = one route `{ distance: 420.4, duration: 300 }`.
### Steps
1. Run one search.
2. Read the route entry and the summary.
### Expected
- [ ] The route entry reads exactly `Route 1 · 420 m · 5 min`.
- [ ] `#status` reads exactly `420 m · 5 min by car`.

## Scenario 2: kilometres with one decimal (US1 scenarios 2, 3, FR-003, FR-004)
### Setup
Common setup; OSRM = one route `{ distance: 12345, duration: 900 }`.
### Steps
1. Run one search.
2. Read the route entry.
### Expected
- [ ] The route entry reads exactly `Route 1 · 12.3 km · 15 min`.
- [ ] The summary in `#status` starts with `12.3 km · `.

## Scenario 3: whole kilometres have no trailing ".0" (US1 scenario 4, FR-003)
### Setup
Common setup; OSRM = one route `{ distance: 2000, duration: 360 }`.
### Steps
1. Run one search.
2. Read the route entry.
### Expected
- [ ] The route entry reads exactly `Route 1 · 2 km · 6 min`.
- [ ] The page text contains neither `2.0 km` nor `2.00 km`.

## Scenario 4: list and fastest-route summary use the same text (US1 scenarios 2, 5, FR-001)
### Setup
Common setup; OSRM = three routes with different middle points:
`{ distance: 1500, duration: 300 }`, `{ distance: 2000, duration: 420 }`, `{ distance: 2300, duration: 480 }`.
### Steps
1. Run one search and wait for 3 entries in `#routes li`.
2. Read all three route entries and `#status`.
### Expected
- [ ] The entries read exactly `Route 1 · 1.5 km · 5 min`, `Route 2 · 2 km · 7 min`, `Route 3 · 2.3 km · 8 min`, in that order.
- [ ] `#status` reads exactly `3 driving routes · fastest 1.5 km · 5 min`.
- [ ] The distance text in `#status` (`1.5 km`) is identical to the distance text in the Route 1 entry.

## Scenario 5: edge values (edge cases, FR-003, FR-004, SC-002)
### Setup
Common setup. Repeat the steps once per row, each time with OSRM = one route `{ distance: D, duration: 600 }`, and reload the page (step 5 of the common setup) between rows.

| D | expected distance text |
|---|---|
| 0 | `0 m` |
| 999.6 | `1 km` |
| 9999.96 | `10 km` |
| 1234567 | `1234.6 km` |

### Steps
1. Run one search.
2. Read the route entry.
### Expected
- [ ] For each row, the route entry reads exactly `Route 1 · <expected distance text> · 10 min`.
- [ ] No entry contains `1000 m`, `mm`, `cm`, `Mm`, a comma, or two digits after a decimal point.

## Scenario 6: invalid distance from the routing service (FR-008)
### Setup
Common setup; OSRM = one route `{ distance: null, duration: 300 }`. Collect `page.on("pageerror")` events.
### Steps
1. Run one search.
2. Read the route entry and `#status`.
### Expected
- [ ] The route entry reads exactly `Route 1 · — · 5 min` (em dash, U+2014).
- [ ] Neither the route entry nor `#status` contains `NaN`.
- [ ] No `pageerror` event was recorded.

## Scenario 7: package cannot load from the CDN (FR-006 fallback)
### Setup
Common setup, but BEFORE opening the page also add `page.route("https://unpkg.com/convert@**", r => r.abort())` (Leaflet stays unblocked). Skip the `distanceFormatReady` wait of step 5 or run it (it must still resolve). Collect `page.on("pageerror")` events. OSRM = three routes as in Scenario 4.
### Steps
1. Open the page and check that `.leaflet-container` is visible.
2. Run one search.
3. Read the route entries and `#status`.
### Expected
- [ ] `.leaflet-container` is visible and has at least one `.leaflet-tile` element.
- [ ] The entries read exactly `Route 1 · 1500 m · 5 min`, `Route 2 · 2000 m · 7 min`, `Route 3 · 2300 m · 8 min`.
- [ ] `#status` reads exactly `3 driving routes · fastest 1500 m · 5 min`.
- [ ] No `pageerror` event was recorded.
- [ ] `await page.evaluate(() => import("/src/geo.js").then(m => m.distanceFormatReady.then(() => "ok")))` returns `"ok"` (it resolves, never rejects).

## Scenario 8: the app never waits for a slow package (FR-006)
### Setup
Common setup, but BEFORE opening the page add a handler that delays the package by 8 seconds:
`page.route("https://unpkg.com/convert@**", async r => { await new Promise(res => setTimeout(res, 8000)); await r.continue(); })`.
Do NOT run the `distanceFormatReady` wait of step 5. OSRM = one route `{ distance: 1500, duration: 300 }`.
### Steps
1. Open the page and note the time T0.
2. Run one search immediately, as soon as `#status` no longer reads "Waiting for your location…".
3. Read the route entry and note the time T1.
4. Wait until 10 seconds have passed since T0, then run one more search.
5. Read the route entry again.
### Expected
- [ ] T1 − T0 is less than 8 seconds (routes appeared before the package arrived).
- [ ] At step 3 the route entry reads exactly `Route 1 · 1500 m · 5 min`.
- [ ] At step 5 the route entry reads exactly `Route 1 · 1.5 km · 5 min`.
