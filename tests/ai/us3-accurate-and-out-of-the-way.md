# US3: Card stays accurate and out of the way
Covers: FR-007, FR-008, FR-010, FR-011, US3 scenario 1, 2, 3, 4, SC-004, SC-005

## Scenario 1: Hidden while a new request loads
### Setup
Shared setup in [README.md](README.md) (en-GB, 14:10). Make the `**/routed-car/**` route handler wait 3 s before it fulfils with [fixtures/car-1-route.json](fixtures/car-1-route.json). Search `Louvre` and pick the result.
### Steps
1. Check that `#route-card` is visible.
2. Click the `Car` radio button.
3. Within 1 s, read whether `#route-card` is visible and read `#status`.
4. Wait until the panel lists 1 route.
5. Read `#route-card` parts.
### Expected
- [ ] At step 3, `#route-card` is not visible and `#status` is `Computing driving routes…`.
- [ ] At step 5, `#route-card` is visible with `.rc-duration` `10 min`, `.rc-distance` `4.10 km`, `.rc-arrival` `Arrive 14:20`.

## Scenario 2: Routing fails or finds no route
### Setup
Shared setup. Search `Louvre` and pick the result (walking).
### Steps
1. Change the `**/routed-car/**` handler to fulfil with HTTP 500.
2. Click the `Car` radio button and wait 1 s.
3. Read whether `#route-card` is visible and read `#status`.
4. Click `Walk`, wait for 3 routes, then change the `**/routed-car/**` handler to fulfil with JSON `{"code":"NoRoute","routes":[]}`.
5. Click `Car` and wait 1 s.
6. Read whether `#route-card` is visible and read `#status`.
### Expected
- [ ] At step 3, `#route-card` is not visible and `#status` starts with `Routing failed`.
- [ ] At step 6, `#route-card` is not visible and `#status` is `No driving route found.`

## Scenario 3: Arrival time refreshes each minute
### Setup
Shared setup. Search `Louvre` and pick the result.
### Steps
1. Read `.rc-arrival` and `#route-card-live`.
2. Advance the page clock 61 s (`page.clock.runFor(61000)`).
3. Read `.rc-arrival` and `#route-card-live`.
4. Advance the page clock another 60 s.
5. Read `.rc-arrival`.
### Expected
- [ ] Step 1: `.rc-arrival` is `Arrive 14:35`.
- [ ] Step 3: `.rc-arrival` is `Arrive 14:36`, and `#route-card-live` text is the same as at step 1.
- [ ] Step 5: `.rc-arrival` is `Arrive 14:37`.

## Scenario 4: New figures after a mode change and after a stop edit
### Setup
Shared setup. Search `Louvre` and pick the result.
### Steps
1. Click `Car` and wait for 1 route.
2. Read the bar parts and the panel route text.
3. Click `Walk` and wait for 3 routes. Change the `**/routed-foot/**` handler to fulfil with [fixtures/foot-via-stop.json](fixtures/foot-via-stop.json).
4. Click an empty point on the map (away from routes and markers), then click the popup button `Add stop here`.
5. Wait until the stops list shows 1 stop and the panel lists 1 route.
6. Read the bar parts and the panel route text.
7. Click the stop's remove button (`Remove stop 1`), after changing the `**/routed-foot/**` handler back to [fixtures/foot-3-routes.json](fixtures/foot-3-routes.json). Wait for 3 routes.
8. Read the bar parts.
### Expected
- [ ] Step 2: bar shows `10 min`, `4.10 km`, `Arrive 14:20`; the panel route text contains `4.10 km · 10 min`.
- [ ] Step 6: bar shows `40 min`, `3.20 km`, `Arrive 14:50`; the panel route text contains `3.20 km · 40 min`.
- [ ] Step 8: bar shows `25 min`, `2.35 km`, `Arrive 14:35`.
