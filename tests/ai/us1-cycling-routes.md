# US1: See cycling routes and their duration
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-012, US1 scenario 1, 2, 3, 4, 5, 6, 7, SC-001, SC-002, SC-003

Common setup for every scenario below, unless the scenario says otherwise:

- Start the app: `npm start` from the repository root (serves http://localhost:8000).
- Network access to `unpkg.com` is required (Leaflet). Map tiles may fail to load; this does not change any expected result.
- Use headless Chromium with Playwright: `browser.newContext({ geolocation: { latitude: 48.8566, longitude: 2.3522 }, permissions: ["geolocation"] })`.
- Mock the search with `page.route("https://nominatim.openstreetmap.org/search**", …)`. Return this JSON for every query:
  `[{"display_name": "Test Place", "lat": "48.8666", "lon": "2.3622"}]`
- Mock the routing with `page.route("https://routing.openstreetmap.de/**", …)`. Record every request URL. Reply by URL:
  - URL contains `/routed-bike/` → **BIKE3** (below).
  - URL contains `/routed-foot/` → **FOOT1**.
  - URL contains `/routed-car/` → **CAR1**.
- Fixtures (OSRM JSON, coordinates are `[lng, lat]`):
  - **BIKE3**: `{"code":"Ok","routes":[{"distance":1850,"duration":420,"geometry":{"coordinates":[[2.3522,48.8566],[2.3622,48.8666]]}},{"distance":2100,"duration":540,"geometry":{"coordinates":[[2.3522,48.8566],[2.3522,48.8666],[2.3622,48.8666]]}},{"distance":2300,"duration":600,"geometry":{"coordinates":[[2.3522,48.8566],[2.3622,48.8566],[2.3622,48.8666]]}}]}`
  - **BIKE1**: BIKE3 with only its first route.
  - **FOOT1**: `{"code":"Ok","routes":[{"distance":1850,"duration":1500,"geometry":{"coordinates":[[2.3522,48.8566],[2.3622,48.8666]]}}]}`
  - **CAR1**: `{"code":"Ok","routes":[{"distance":2000,"duration":300,"geometry":{"coordinates":[[2.3522,48.8566],[2.3622,48.8666]]}}]}`
- "Choose the destination" means: type `Test Place` in the "Search a place" box, click "Go", then click the result button "Test Place".
- `#status` is the status line. Route buttons are the buttons in the list "Route options".

## Scenario 1: Bike option in the mode selector
### Setup
Common setup. Do not choose a destination.
### Steps
1. Open http://localhost:8000.
2. Read the radio buttons in the radiogroup "Travel mode", in DOM order.
3. Focus the "Walk" radio, then press `ArrowRight` two times.
4. Read the status line and the "Route options" list.
### Expected
- [ ] The radiogroup "Travel mode" holds exactly three radios, labelled "Walk", "Car", "Bike", in this order.
- [ ] Before step 3, "Walk" is checked and "Car" and "Bike" are not checked.
- [ ] After step 3, the "Bike" radio is checked (keyboard selection works).
- [ ] After step 4, the "Route options" list is empty and no request URL contains `/routed-bike/` (nothing is computed without a destination).

## Scenario 2: Bike shows up to 3 cycling routes with distance and duration
### Setup
Common setup. Delay each `/routed-bike/` reply by 2 seconds.
### Steps
1. Open http://localhost:8000 and wait until the user position marker is on the map.
2. Choose the destination.
3. Wait until the status line ends with "on foot" (walking routes are shown).
4. Click the "Bike" radio.
5. Read the status line within 1 second.
6. Wait until the "Route options" list holds route buttons and the status line no longer starts with "Computing".
7. Read every route button text and the status line.
### Expected
- [ ] At step 5, the status line is exactly "Computing cycling routes…".
- [ ] At step 7, the list holds 3 route buttons with these texts in order: "Route 1 · 1.85 km · 7 min", "Route 2 · 2.10 km · 9 min", "Route 3 · 2.30 km · 10 min".
- [ ] At step 7, the status line is exactly "3 cycling routes · fastest 1.85 km · 7 min".
- [ ] The map shows 3 route polylines (3 SVG `path` elements with stroke `#888` or `#1a73e8`, not counting the user marker).
- [ ] No route button holds an element with class `pleasure`, and no button text contains "Pleasure" or "most pleasant".
- [ ] Every recorded `/routed-bike/` URL contains `/route/v1/bike/2.3522,48.8566;2.3622,48.8666?` and `alternatives=3`.
- [ ] The search box was not used again between step 2 and step 7 (one click on "Bike" was the only action, SC-001).

## Scenario 3: Select a cycling route in the panel and on the map
### Setup
Common setup.
### Steps
1. Open http://localhost:8000, wait for the position marker, choose the destination.
2. Click the "Bike" radio and wait until 3 route buttons are shown.
3. Click the route button whose text starts with "Route 2".
4. Read the `aria-pressed` value of each route button.
5. Find the map polyline of route 3: among the `path.leaflet-interactive` elements whose `d` attribute has exactly 3 points (`M x0 y0 L x1 y1 L x2 y2`), it is the one with `y1 == y0` (it goes east first; route 2 has `x1 == x0`). Dispatch a `click` event on it: `locator.dispatchEvent("click")`.
6. Read the `aria-pressed` value of each route button.
### Expected
- [ ] After step 4, only the "Route 2" button has `aria-pressed="true"`, and its polyline has stroke `#1a73e8`.
- [ ] After step 6, only the "Route 3" button has `aria-pressed="true"`, and its polyline has stroke `#1a73e8`.
- [ ] After step 6, no "Add stop here" popup is open.

## Scenario 4: Switch from Walk and Car to Bike and back, same destination
### Setup
Common setup.
### Steps
1. Open http://localhost:8000, wait for the position marker, choose the destination.
2. Wait until the status line is "1.85 km · 25 min on foot".
3. Click "Car". Wait until the status line is "2.00 km · 5 min by car".
4. Click "Bike". Wait until the status line starts with "3 cycling routes".
5. Click "Walk". Wait until the status line is "1.85 km · 25 min on foot".
6. Click "Car". Wait until the status line changes.
### Expected
- [ ] At step 2, the status line is exactly "1.85 km · 25 min on foot", and the route button holds a `pleasure` element.
- [ ] At step 3, the status line is exactly "2.00 km · 5 min by car" and no route button holds a `pleasure` element.
- [ ] At step 4, the status line is exactly "3 cycling routes · fastest 1.85 km · 7 min", and the search box was not used again (no new Nominatim request after step 1).
- [ ] Every `/routed-bike/` URL ends its coordinates with `;2.3622,48.8666` (same destination).
- [ ] At step 5, the status line is exactly "1.85 km · 25 min on foot" and the route button holds a `pleasure` element again.
- [ ] At step 6, the status line is exactly "2.00 km · 5 min by car" and no route button holds a `pleasure` element.

## Scenario 5: Single cycling route, no forced detours
### Setup
Common setup, but reply **BIKE1** to `/routed-bike/` requests.
### Steps
1. Open http://localhost:8000, wait for the position marker, choose the destination.
2. Wait until the status line ends with "on foot". Clear the list of recorded request URLs.
3. Click "Bike". Wait until the status line no longer starts with "Computing".
4. Wait 3 more seconds.
5. Read the route buttons, the status line and the recorded request URLs.
### Expected
- [ ] Exactly 1 route button is shown, with text "Route 1 · 1.85 km · 7 min".
- [ ] The status line is exactly "1.85 km · 7 min by bike".
- [ ] Exactly 1 request URL contains `/routed-bike/`, and its coordinate part has exactly 2 points (no via waypoint).
- [ ] No route button holds a `pleasure` element.

## Scenario 6: No cycling route, routing failure, stale result
### Setup
Common setup. The reply to `/routed-bike/` is set per step below.
### Steps
1. Open http://localhost:8000, wait for the position marker, choose the destination, wait until the status line ends with "on foot".
2. Set the `/routed-bike/` reply to `{"code":"NoRoute","routes":[]}`. Click "Bike". Wait 2 seconds. Read the status line, the route buttons and the checked radio.
3. Set the `/routed-bike/` reply to HTTP 500 with an empty body. Click "Walk", wait until the status ends with "on foot", then click "Bike". Wait 2 seconds. Read the status line.
4. Set the `/routed-bike/` reply to **BIKE3**, delayed by 3 seconds. Click "Walk", wait until the status ends with "on foot". Click "Bike", then click "Walk" within 0.5 seconds. Wait 5 seconds. Read the status line and the route buttons.
### Expected
- [ ] At step 2, the status line is exactly "No cycling route found.", the "Route options" list is empty, and "Bike" is still checked (no automatic change to Walk, no "Try Walk" text).
- [ ] At step 3, the status line is exactly "Routing failed: Request failed (500)".
- [ ] At step 4, the status line is exactly "1.85 km · 25 min on foot" and the only route button text is "Route 1 · 1.85 km · 25 min" (the late bike reply is discarded).

## Scenario 7: Live check, bike is faster than walking (SC-002)
### Setup
Start the app with `npm start`. Do NOT mock routing. Mock Nominatim as in the common setup, but return the destination given per trip. Network access to `routing.openstreetmap.de` and `tile.openstreetmap.org` is required; if it is blocked, record the scenario as "not run: no network" and do not mark it failed.
Trips (start → destination, lat,lng), Paris, each 1–10 km:
1. 48.8566,2.3522 → 48.8738,2.2950
2. 48.8566,2.3522 → 48.8867,2.3431
3. 48.8566,2.3522 → 48.8350,2.3700
4. 48.8462,2.3371 → 48.8606,2.3376
5. 48.8530,2.3499 → 48.8800,2.3550
### Steps
1. For each trip: open a new context with the trip start as geolocation, open http://localhost:8000, choose the destination.
2. Wait until the status line ends with "on foot" or contains "walking routes". Read the fastest duration from the status line.
3. Click "Bike". Wait until the status line ends with "by bike" or contains "cycling routes". Read the fastest duration from the status line.
### Expected
- [ ] For each of the 5 trips, the bike status line shows a distance and a duration (formats "N m" / "N.NN km" and "N min" / "N h N min").
- [ ] For each of the 5 trips, the fastest bike duration is shorter than the fastest walking duration.
- [ ] Every bike route button text matches `Route N · <distance> · <duration>` (SC-003).
