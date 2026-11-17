# US2: Switch to and from Bike for the current destination
Covers: FR-008, FR-010, US2 scenario 1, 2, 3, edge case "routing service unreachable"

Common setup: same as `tests/ai/us1-cycling-routes.md` (`npm start`, headless Chromium on http://localhost:8000, geolocation 52.5219, 13.4132 granted, wait until `#status` no longer contains "Waiting").

## Scenario 1: Walk → Bike → Walk keeps the destination
### Setup
Common setup. In Playwright, log every request URL that contains `/route/v1/`.
### Steps
1. Keep Walk selected. Search "Brandenburger Tor, Berlin" and click the first result.
2. Wait until `#status` contains "walking" or "on foot". Record the `#routes` texts.
3. Click the label that contains "Bike".
4. Wait until `#status` contains "cycling" or "by bike". Record the `#routes` texts and the value of `#search-input`.
5. Click the label that contains "Walk".
6. Wait until `#status` contains "walking" or "on foot". Record the `#routes` texts.
### Expected
- [ ] At step 4, the first logged URL after step 3 contains `/routed-bike/route/v1/bike/` and ends its coordinate list with the same destination coordinates as the walking request of step 1.
- [ ] At step 4, `#search-input` still contains the destination name chosen at step 1.
- [ ] At step 4, the `#routes` texts are different from step 2 (the walking routes are replaced).
- [ ] At step 6, the first logged URL after step 5 contains `/routed-foot/route/v1/foot/`.
- [ ] At step 6, `#status` contains "walking" or "on foot".

## Scenario 2: Car → Bike replaces car routes
### Setup
Common setup.
### Steps
1. Click the label that contains "Car". Search "Brandenburger Tor, Berlin" and click the first result.
2. Wait until `#status` contains "driving" or "by car".
3. Click the label that contains "Bike".
4. Wait until `#status` contains "cycling" or "by bike".
### Expected
- [ ] At step 4, every `#routes li` has a `.pleasure` element (car routes had none).
- [ ] At step 4, `#status` contains no "driving" and no "by car".

## Scenario 3: Quick switching shows only the last mode
### Setup
Common setup. In Playwright, delay every `**/routed-foot/**` response by 3 s and every `**/routed-bike/**` response by 2 s (`route.continue()` after a timer). Do not delay `routed-car`.
### Steps
1. Keep Walk selected. Search "Brandenburger Tor, Berlin" and click the first result.
2. Within 300 ms, click "Bike", then within 300 ms click "Car".
3. Wait 5 s.
4. Read `#status`, the checked `input[name=mode]` and the `#routes .pleasure` count.
### Expected
- [ ] The checked input has value `car`.
- [ ] `#status` contains "driving" or "by car", and does not contain "walking", "cycling", "on foot" or "by bike".
- [ ] The `#routes .pleasure` count is 0.

## Scenario 4: Bike routing service fails
### Setup
Common setup. Show walking routes to "Brandenburger Tor, Berlin" first. Then, in Playwright, abort every `**/routed-bike/**` request (`route.abort()`).
### Steps
1. Click the label that contains "Bike".
2. Wait until `#status` stops containing "Computing" (at most 10 s).
### Expected
- [ ] `#status` starts with "Routing failed:".
- [ ] `#routes` has no `li` (no walking routes left on screen).
- [ ] The map has no route polylines: `document.querySelectorAll('#map path.leaflet-interactive').length` is 0.
