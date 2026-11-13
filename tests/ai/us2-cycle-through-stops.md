# US2: Cycle through stops
Covers: FR-002, FR-006, FR-009, US2 scenario 1, 2

Common setup for every scenario below:

- Start the app: `npm start` from the repository root (serves http://localhost:8000).
- Network access to `unpkg.com` is required (Leaflet). Map tiles may fail to load; this does not change any expected result.
- Use headless Chromium with Playwright: `browser.newContext({ geolocation: { latitude: 48.8566, longitude: 2.3522 }, permissions: ["geolocation"] })`.
- Mock the search with `page.route("https://nominatim.openstreetmap.org/search**", …)`. Reply by the `q` parameter:
  - `Stop A` → `[{"display_name": "Stop A", "lat": "48.8600", "lon": "2.3550"}]`
  - `Stop B` → `[{"display_name": "Stop B", "lat": "48.8630", "lon": "2.3590"}]`
  - `Stop C` → `[{"display_name": "Stop C", "lat": "48.8650", "lon": "2.3500"}]`
  - any other query → `[{"display_name": "Test Place", "lat": "48.8666", "lon": "2.3622"}]`
- Mock the routing with `page.route("https://routing.openstreetmap.de/**", …)`. Record every request URL. For any URL, reply one route through the points of the URL in URL order: parse the coordinate part `lng,lat;lng,lat;…`, and return
  `{"code":"Ok","routes":[{"distance": 1000 * (pointCount - 1), "duration": 300 * (pointCount - 1), "geometry":{"coordinates": <the points as [lng, lat]>}}]}`.
  So 2 stops (4 points) give "3.00 km · 15 min", 1 stop gives "2.00 km · 10 min", 3 stops give "4.00 km · 20 min".
- "Add stop X" means: type `Stop X` in the "Search a place" box, click "Go", then click the button "Add Stop X as stop".
- "Choose the destination" means: type `Test Place`, click "Go", then click the result button "Test Place".

## Scenario 1: Bike route through 2 stops, in order
### Setup
Common setup.
### Steps
1. Open http://localhost:8000 and wait until the user position marker is on the map.
2. Add stop A. Add stop B.
3. Choose the destination. Wait until the status line ends with "on foot via 2 stops".
4. Clear the recorded URLs. Click the "Bike" radio.
5. Wait until the status line no longer starts with "Computing". Read the status line, the "Stops" list and the recorded URLs.
### Expected
- [ ] The status line is exactly "3.00 km · 15 min by bike via 2 stops".
- [ ] Exactly 1 recorded URL contains `/routed-bike/`, and its coordinates are `2.3522,48.8566;2.355,48.86;2.359,48.863;2.3622,48.8666` (position, Stop A, Stop B, destination, in this order).
- [ ] The "Stops" list still shows "1. Stop A" then "2. Stop B".
- [ ] One route button is shown, with text "Route 1 · 3.00 km · 15 min", and it holds no `pleasure` element.

## Scenario 2: Reorder, add and remove stops in bike mode
### Setup
Common setup.
### Steps
1. Open http://localhost:8000, wait for the position marker, add stop A, add stop B, choose the destination.
2. Click "Bike". Wait until the status line is "3.00 km · 15 min by bike via 2 stops".
3. Clear the recorded URLs. Click the button "Move stop 2 up". Wait until the status line no longer starts with "Computing". Read the last `/routed-bike/` URL.
4. Clear the recorded URLs. Add stop C. Wait until the status line no longer starts with "Computing". Read the last `/routed-bike/` URL and the status line.
5. Clear the recorded URLs. Click the button "Remove stop 1". Wait until the status line no longer starts with "Computing". Read the last `/routed-bike/` URL and the status line.
6. Click "Clear stops". Wait until the status line no longer starts with "Computing". Read the status line.
### Expected
- [ ] After step 3, the URL coordinates are `2.3522,48.8566;2.359,48.863;2.355,48.86;2.3622,48.8666` (Stop B before Stop A), and the "Stops" list shows "1. Stop B" then "2. Stop A".
- [ ] After step 4, the URL has 5 points, Stop C (`2.35,48.865`) is the fourth, and the status line is exactly "4.00 km · 20 min by bike via 3 stops".
- [ ] After step 5, the URL coordinates are `2.3522,48.8566;2.355,48.86;2.35,48.865;2.3622,48.8666`, and the status line is exactly "3.00 km · 15 min by bike via 2 stops".
- [ ] After step 6, the status line is exactly "1.00 km · 5 min by bike".
- [ ] "Bike" stays checked during all steps.

## Scenario 3: No cycling route with stops
### Setup
Common setup, but reply `{"code":"NoRoute","routes":[]}` to every URL containing `/routed-bike/` until step 4 changes it.
### Steps
1. Open http://localhost:8000, wait for the position marker, add stop A, choose the destination.
2. Click "Bike". Wait 2 seconds.
3. Read the status line, the route buttons and the "Stops" list.
4. Switch the bike reply to HTTP 503. Click "Walk", wait until the status line ends with "on foot via 1 stop", then click "Bike". Wait 2 seconds. Read the status line.
### Expected
- [ ] At step 3, the status line is exactly "No cycling route found. Try removing a stop.", the "Route options" list is empty, and the "Stops" list still shows "1. Stop A".
- [ ] At step 4, the status line is exactly "No cycling route found. (Request failed (503))".
