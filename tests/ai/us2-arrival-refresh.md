# US2: Arrival time refreshes when routes are recomputed
Covers: FR-002, FR-005, FR-010, SC-003, US2 scenario 1, 2

## Common setup (all scenarios)
- Start the app from the repo root: `python3 -m http.server 8000`. Open `http://localhost:8000/` in headless Playwright (Chromium).
- Create the browser context with `geolocation: { latitude: 48.85, longitude: 2.35 }`, `permissions: ["geolocation"]`, `timezoneId: "Europe/Paris"`, `locale: "en-GB"`.
- Fix the clock before the page loads: `await page.clock.install({ time: "2026-11-12T14:07:00+01:00" })`, then `await page.clock.pauseAt("2026-11-12T14:07:00+01:00")`. To move the clock later, use `page.clock.setFixedTime(...)`.
- Stub the network with `page.route`:
  - `**/search?**` returns JSON `[{"display_name":"Destination Place","lat":"48.86","lon":"2.36"},{"display_name":"Stop Place","lat":"48.853","lon":"2.362"},{"display_name":"Other Place","lat":"48.857","lon":"2.352"}]`.
  - `**/route/v1/**` returns an OSRM fixture. The duration depends on the request: walking (`routed-foot`) with 2 points → routes with S = 1500 and 1800; car (`routed-car`) with 2 points → S = 600 and 720; walking with 3 points (one stop) → S = 2400 and 2700; walking with 4 points (two stops) → S = 3000 and 3300. Use distances 2100 and 2200 and the geometry described in `tests/ai/us1-arrival-time.md`. Count every OSRM request.
  - `https://tile.openstreetmap.org/**` returns status 503.
- Route titles are the first `span` in each `#routes button`.

## Scenario 1: switching the travel mode (US2 scenario 1)
### Setup
- Common setup.
### Steps
1. Load the page, search for `Destination`, click `Destination Place`.
2. Wait until `#routes button` count is 2. Read the titles.
3. Set the clock to `2026-11-12T14:12:00+01:00`.
4. Click the radio `input[name=mode][value=car]`.
5. Wait until `#status` contains `driving routes`. Read the titles.
### Expected
- [ ] After step 2, the titles end with `25 min, arrive 14:32` and `30 min, arrive 14:37`.
- [ ] After step 5, the titles are exactly `Route 1 · 2.10 km · 10 min, arrive 14:22` and `Route 2 · 2.20 km · 12 min, arrive 14:24`.
- [ ] After step 5, no title contains `14:32` or `14:37`.

## Scenario 2: adding, reordering, removing and clearing stops (US2 scenario 2)
### Setup
- Common setup.
### Steps
1. Load the page, search for `Destination`, click `Destination Place`. Wait for 2 route buttons.
2. Set the clock to `2026-11-12T14:15:00+01:00`.
3. Search for `Destination`. Click `Add as stop` on the `Stop Place` row. Wait until `#status` contains `via 1 stop`. Read the titles.
4. Set the clock to `2026-11-12T14:20:00+01:00`. In `#stops`, click the button with aria-label `Remove stop 1`. Wait until `#status` does not contain `via`. Read the titles.
5. Set the clock to `2026-11-12T14:25:00+01:00`. Search for `Destination`. Click `Add as stop` on `Stop Place`, then search again and click `Add as stop` on `Other Place`. Set the clock to `2026-11-12T14:30:00+01:00`. Click `Move stop 2 up`. Wait for the routes. Read the titles.
6. Set the clock to `2026-11-12T14:35:00+01:00`. Click `#clear-stops`. Wait until `#status` does not contain `via`. Read the titles.
### Expected
- [ ] After step 3, route 1 title is exactly `Route 1 · 2.10 km · 40 min, arrive 14:55`.
- [ ] After step 4, route 1 title is exactly `Route 1 · 2.10 km · 25 min, arrive 14:45`.
- [ ] After step 5, route 1 title is exactly `Route 1 · 2.10 km · 50 min, arrive 15:20`.
- [ ] After step 6, route 1 title is exactly `Route 1 · 2.10 km · 25 min, arrive 15:00`.

## Scenario 3: new destination and location becoming available (FR-005)
### Setup
- Common setup. Also hold back the position with `page.addInitScript(() => { navigator.geolocation.watchPosition = (ok) => { window.__deliverPosition = () => ok({ coords: { latitude: 48.85, longitude: 2.35 } }); return 1; }; })`.
### Steps
1. Load the page, search for `Destination`, click `Destination Place`.
2. Check that `#status` reads `Waiting for your location to compute a route…` and `#routes` has 0 buttons.
3. Set the clock to `2026-11-12T14:20:00+01:00`. Run `await page.evaluate(() => window.__deliverPosition())`.
4. Wait for 2 route buttons. Read the titles.
5. Set the clock to `2026-11-12T14:30:00+01:00`. Search for `Destination` and click `Other Place`. Wait for 2 route buttons. Read the titles.
### Expected
- [ ] After step 4, route 1 title ends with `25 min, arrive 14:45` (when the position arrived).
- [ ] After step 5, route 1 title ends with `25 min, arrive 14:55`.

## Scenario 4: no refresh from time or later position changes (FR-010, edge "passage of time alone")
### Setup
- Common setup.
### Steps
1. Load the page, search for `Destination`, click `Destination Place`. Wait for 2 route buttons. Note the OSRM request count N.
2. Advance the clock with `page.clock.runFor("10:00")` (10 minutes).
3. Call `context.setGeolocation({ latitude: 48.852, longitude: 2.352 })`. Wait 2 seconds (real time) with `page.waitForTimeout(2000)`.
4. Read the titles and the OSRM request count.
### Expected
- [ ] The titles still end with `25 min, arrive 14:32` and `30 min, arrive 14:37`.
- [ ] The OSRM request count is still N.

## Scenario 5: no leftover arrival during and after a recomputation (SC-003)
### Setup
- Common setup. Make the `routed-car` OSRM stub wait 3 seconds (real time) before it answers.
### Steps
1. Load the page, search for `Destination`, click `Destination Place`. Wait for 2 route buttons.
2. Set the clock to `2026-11-12T14:12:00+01:00`. Click the radio `input[name=mode][value=car]`.
3. Within 500 ms, read the number of `#routes button` elements and the text of `#routes`.
4. Click the radio `input[name=mode][value=foot]` before the car answer arrives.
5. Wait 4 seconds (real time). Read the titles and `#status`.
### Expected
- [ ] At step 3, `#routes` has 0 buttons and its text does not contain `arrive`.
- [ ] After step 5, the titles are walking routes (`25 min, arrive 14:37` and `30 min, arrive 14:42`), based on 14:12.
- [ ] After step 5, no title contains `10 min` or `12 min` (the superseded car answer is not shown).
