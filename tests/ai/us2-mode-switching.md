# US2: Switch between modes without losing context
Covers: FR-005, FR-006, FR-010, FR-011, US2 scenario 1, 2, 3

## Common setup (all scenarios)

Same as the common setup in `tests/ai/us1-bike-routes.md` (server, geolocation 48.85, 2.35, mocks for Nominatim, tiles, `routed-foot`, `routed-bike`, `routed-car`, the `routingRequests` list, and how to choose `Test Park, Paris`).

To add a stop at a map point: click the map at that lat/lng (convert with `map.latLngToContainerPoint`, or click an empty map area), then click the `Add stop here` button in the popup. The stop is added at the clicked point; the scenario then checks the coordinates in the request URL.

## Scenario 1: Walk → Bike keeps the destination
### Setup
Common setup only.
### Steps
1. Open the app, choose the destination `Test Park, Paris`. Wait for 2 walking routes.
2. Read `#search-input` value and the destination marker position.
3. Click the `Bike` segment. Wait for `#status` to start with `2 cycling routes`.
### Expected
- [ ] Before step 3, `#status` is `2 walking routes · fastest 1.85 km · 25 min`.
- [ ] After step 3, `#search-input` still contains `Test Park, Paris`.
- [ ] After step 3, the destination marker is still at lat 48.86, lng 2.36.
- [ ] After step 3, the route list shows `Route 1 · 1.85 km · 7 min` (cycling durations, not 25 min).

## Scenario 2: Cycling routes go through the stops in list order
### Setup
Common setup only.
### Steps
1. Open the app, choose the destination `Test Park, Paris`.
2. Add a stop at a map point P1, then a stop at a different map point P2 (at least 300 px apart on screen).
3. Read the coordinates of the two stops from the `#stops` list (`Point on map (lat, lng)`).
4. Clear `routingRequests`. Click the `Bike` segment. Wait for `#routes li`.
5. Click the `Move stop 2 up` button. Wait for `#routes li`.
### Expected
- [ ] After step 4, the last entry of `routingRequests` starts with `https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;` followed by P1 (`lng,lat`), then P2, then `2.36,48.86`.
- [ ] After step 4, `#stops` still lists 2 stops, in the order P1, P2.
- [ ] After step 4, `#status` contains `via 2 stops`.
- [ ] After step 5, the last `routed-bike` request lists P2 before P1.

## Scenario 3: Walk → Bike → Car → Bike keeps destination and stops
### Setup
Common setup only.
### Steps
1. Open the app, choose the destination `Test Park, Paris`, add two map stops P1 and P2 (as in Scenario 2).
2. Click `Bike`, wait for routes. Click `Car`, wait for routes. Click `Bike`, wait for routes.
3. After each click, record the last routing request URL, the number of `#stops li`, and `#search-input` value.
### Expected
- [ ] The three recorded request URLs contain `/routed-bike/`, `/routed-car/`, `/routed-bike/` in that order.
- [ ] All three recorded URLs list the same coordinates: start, P1, P2, destination.
- [ ] `#stops li` count is 2 after every click.
- [ ] `#search-input` is `Test Park, Paris` after every click.

## Scenario 4: Late results from a previous mode are ignored
### Setup
Common setup, but `routed-bike/**` waits 3 s before it returns its normal response.
### Steps
1. Open the app, choose the destination `Test Park, Paris`, wait for walking routes.
2. Click `Bike`. Within 200 ms, click `Car`.
3. Wait for the car route. Then wait 4 s more (the delayed bike response arrives during this time).
### Expected
- [ ] At the end, `#routes` has exactly 1 item: `Route 1 · 1.85 km · 5 min`.
- [ ] At the end, `#status` is `1.85 km · 5 min by car`.
- [ ] At the end, the `Car` radio is checked and no text in `#panel` contains `cycling`.
- [ ] At the end, exactly 1 route polyline is drawn on the map.
