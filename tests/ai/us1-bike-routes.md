# US1: Get cycling routes to a destination
Covers: FR-001, FR-002, FR-003, FR-004, FR-007, FR-008, FR-009, FR-010, US1 scenario 1, 2, 3, 4, 5, edge cases (no route, routing failure, single route, long ride, car without pleasure)

## Common setup (all scenarios)

1. From the repository root, run `npm start` (serves http://localhost:8000).
2. Start headless Chromium with Playwright. Create a context with `geolocation: { latitude: 48.85, longitude: 2.35 }`, `permissions: ["geolocation"]`, viewport 1280×800.
3. Install these `page.route` mocks before `page.goto("http://localhost:8000")`. Record every request URL to `routing.openstreetmap.de` in a list `routingRequests`.
   - `https://nominatim.openstreetmap.org/search**` → JSON
     `[{"display_name":"Test Park, Paris","lat":"48.86","lon":"2.36"},{"display_name":"Far Village","lat":"49.0","lon":"2.35"}]`
   - `https://tile.openstreetmap.org/**` → `tests/ai/fixtures/green-tile.png`, content type `image/png` (a 256×256 green tile: every pixel counts as green).
   - `https://routing.openstreetmap.de/routed-foot/**` → `{"code":"Ok","routes":[R(1850,1500,A),R(1900,1700,B)]}`
   - `https://routing.openstreetmap.de/routed-bike/**` → `{"code":"Ok","routes":[R(1850,420,A),R(1900,480,B)]}`
   - `https://routing.openstreetmap.de/routed-car/**` → `{"code":"Ok","routes":[R(1850,300,A)]}`
   - where `R(d,t,P)` = `{"distance":d,"duration":t,"geometry":{"type":"LineString","coordinates":P}}`,
     `A` = `[[2.35,48.85],[2.35,48.86],[2.36,48.86]]`, `B` = `[[2.35,48.85],[2.36,48.85],[2.36,48.86]]`
     (two different paths with almost the same length, so both are kept).
   - A scenario below may replace one of these mocks; it says so in its Setup.
4. To choose the destination: type `Test Park` in the search box (`#search-input`), press Enter, click the result button whose text is `Test Park, Paris` (not "Add as stop").

## Scenario 1: Segmented selector with three icon segments
### Setup
Common setup only.
### Steps
1. Open http://localhost:8000.
2. Read the radios in `#mode` in DOM order with `page.getByRole("radio")`.
3. Take a screenshot of `#panel`.
4. Focus the radio named `Walk`. Press `ArrowRight` once, then `ArrowRight` again.
### Expected
- [ ] `#mode` has `role="radiogroup"` and accessible name `Travel mode`.
- [ ] The radios in order have accessible names `Walk`, `Car`, `Bike` (no emoji in the names).
- [ ] The visible text of the three segments in order is `🚶 Walk`, `🚗 Car`, `🚲 Bike`.
- [ ] Before step 4, only `Walk` is checked.
- [ ] The three segments are on one horizontal line, inside one shared border (screenshot).
- [ ] Before step 4, the computed background color of the `Walk` label is `rgb(232, 240, 254)` and the other two labels have a different background.
- [ ] After the first `ArrowRight`, `Car` is checked; after the second, `Bike` is checked, and only one radio is checked.
- [ ] After step 4, the `Bike` label has background `rgb(232, 240, 254)` and a visible outline (computed `outline-style` is not `none`).
- [ ] No native radio circle is visible in the screenshot.

## Scenario 2: Cycling routes with cycling wording
### Setup
Common setup only.
### Steps
1. Open the app. Wait until the user position marker is shown (status is not "Waiting for your location…").
2. Choose the destination `Test Park, Paris`. Wait for the route list (`#routes li`).
3. Click the `Bike` segment.
4. Read `#status` as soon as it changes (poll every 50 ms).
5. Wait until `#routes li` has 2 items. Read `#status` and the text of each route button.
### Expected
- [ ] After step 3, `#status` shows `Computing cycling routes…` at some point.
- [ ] After step 3, at least one entry of `routingRequests` starts with `https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86`.
- [ ] `#routes` has exactly 2 items: `Route 1 · 1.85 km · 7 min` and `Route 2 · 1.90 km · 8 min`.
- [ ] `#status` is `2 cycling routes · fastest 1.85 km · 7 min`.
- [ ] `#status` does not contain `walking`, `driving`, `on foot` or `by car`.
- [ ] Two route polylines are drawn on the map (two `path.leaflet-interactive` elements with a stroke, not counting markers).

## Scenario 3: Select a cycling route in the panel and on the map
### Setup
Common setup only. Bike mode with the 2 routes from Scenario 2.
### Steps
1. Do Scenario 2 steps 1–5.
2. Click the button of `Route 2` in `#routes`.
3. Click the button of `Route 1` in `#routes`.
4. Click on the map on the polyline of route B (map point lat 48.85, lng 2.355; convert with Leaflet `map.latLngToContainerPoint` or click the second route path element).
### Expected
- [ ] After step 2, the `Route 2` button has `aria-pressed="true"` and `Route 1` has `aria-pressed="false"`.
- [ ] After step 3, `Route 1` has `aria-pressed="true"`.
- [ ] After step 4, `Route 2` has `aria-pressed="true"` and the route B polyline has stroke `#1a73e8`.
- [ ] After step 4, no "Add stop here" popup is open.

## Scenario 4: Pleasure indicator on cycling routes
### Setup
Common setup only.
### Steps
1. Do Scenario 2 steps 1–5.
2. Wait up to 10 s until no `.pleasure` element contains `…`.
3. Read the text of every `#routes .pleasure` element.
### Expected
- [ ] There are exactly 2 `.pleasure` elements, one in each route button.
- [ ] Each one matches `Pleasure: <number> green px`, with a number greater than 0.
- [ ] Exactly one of them ends with `· most pleasant` and has the class `best`.
- [ ] The route marked `most pleasant` has the highest number of the two (on a tie, it is `Route 1`).
- [ ] The `title` of the pleasure elements contains `along this route` and does not contain `walk`.

## Scenario 5: Single cycling route, no detours
### Setup
Common setup, but `routed-bike/**` returns `{"code":"Ok","routes":[R(1850,420,A)]}`.
### Steps
1. Open the app, choose the destination `Test Park, Paris`, wait for the walking routes.
2. Clear `routingRequests`. Click the `Bike` segment.
3. Wait 3 s after `#routes li` appears.
### Expected
- [ ] `#routes` has exactly 1 item: `Route 1 · 1.85 km · 7 min`.
- [ ] `#status` is `1.85 km · 7 min by bike`.
- [ ] `routingRequests` has exactly 1 entry, and it contains `/routed-bike/` (no detour request through a side waypoint).

## Scenario 6: No cycling route found
### Setup
Common setup, but `routed-bike/**` returns `{"code":"NoRoute","routes":[]}`.
### Steps
1. Open the app, choose the destination `Test Park, Paris`, wait until walking routes are shown (2 items).
2. Click the `Bike` segment. Wait 2 s.
### Expected
- [ ] `#status` is `No cycling route found.`
- [ ] `#routes` has 0 items (the walking routes are gone).
- [ ] No route polyline is drawn on the map.

## Scenario 7: Cycling routing service fails
### Setup
Common setup, but `routed-bike/**` returns HTTP 500 with an empty body.
### Steps
1. Open the app, choose the destination `Test Park, Paris`, wait for walking routes.
2. Click the `Bike` segment. Wait 2 s. Read `#status` and count `#routes li`.
3. Click the `Car` segment. Wait for `#routes li`.
### Expected
- [ ] After step 2, `#status` is `Routing failed: Request failed (500)`.
- [ ] After step 2, `#routes` has 0 items.
- [ ] After step 3, `#routes` has 1 item and `#status` is `1.85 km · 5 min by car`.

## Scenario 8: Long ride, pleasure unavailable
### Setup
Common setup, but `routed-bike/**` returns `{"code":"Ok","routes":[R(16700,3600,[[2.35,48.85],[2.35,49.0]])]}`.
### Steps
1. Open the app. Search `Far`, click the result `Far Village`.
2. Click the `Bike` segment. Wait 3 s after `#routes li` appears.
### Expected
- [ ] `#routes` has 1 item: `Route 1 · 16.7 km · 1 h`.
- [ ] Its `.pleasure` text is `Pleasure unavailable`.
- [ ] The route stays visible: 1 route polyline is drawn on the map.

## Scenario 9: Car routes have no pleasure indicator
### Setup
Common setup only.
### Steps
1. Open the app, choose the destination `Test Park, Paris`.
2. Click the `Car` segment. Wait for `#routes li`.
### Expected
- [ ] `#routes` has 1 item and it has no `.pleasure` element.
- [ ] `#status` is `1.85 km · 5 min by car`.
