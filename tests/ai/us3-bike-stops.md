# US3: Cycling routes with stops
Covers: FR-008, FR-009, US3 scenario 1, 2

Common setup: same as `tests/ai/us1-cycling-routes.md` (`npm start`, headless Chromium on http://localhost:8000, geolocation 52.5219, 13.4132 granted, wait until `#status` no longer contains "Waiting"). In Playwright, log every request URL that contains `/route/v1/`.

## Scenario 1: Bike route goes through two stops in order
### Setup
Common setup.
### Steps
1. Type "Rotes Rathaus, Berlin" in `#search-input`, wait for `#results`, click "Add as stop" on the first result.
2. Type "Museumsinsel, Berlin" in `#search-input`, wait for `#results`, click "Add as stop" on the first result.
3. Read the `#stops li` names in order.
4. Click the label that contains "Bike".
5. Search "Brandenburger Tor, Berlin" and click the first result (not "Add as stop").
6. Wait until `#status` contains "cycling" or "by bike" (at most 20 s).
7. Read the last logged `/route/v1/` URL and `#status`.
### Expected
- [ ] The last URL contains `/routed-bike/route/v1/bike/`.
- [ ] Its coordinate list has 4 points: the position (13.4132,52.5219), stop 1, stop 2, the destination, in that order (stop coordinates are those of the stops listed at step 3).
- [ ] `#status` contains "via 2 stops".

## Scenario 2: Stops are kept when switching to and from Bike
### Setup
Continue from scenario 1.
### Steps
1. Click the label that contains "Walk". Wait until `#status` contains "walking" or "on foot".
2. Read the `#stops li` names.
3. Click the label that contains "Bike". Wait until `#status` contains "cycling" or "by bike".
4. Read the `#stops li` names and the last logged `/route/v1/` URL.
### Expected
- [ ] At step 2 and step 4, the stop names are the same as in scenario 1 step 3, in the same order.
- [ ] At step 4, the URL contains `/routed-bike/route/v1/bike/` and has 4 coordinate points with the stops in the same order.
- [ ] At step 4, `#status` contains "via 2 stops".
