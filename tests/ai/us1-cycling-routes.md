# US1: Get cycling routes to a destination
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, SC-002, US1 scenario 1, 2, 3, 4, 5, 6

Common setup for every scenario:
- Run `npm start` in the repository root. Open http://localhost:8000 in headless Playwright (Chromium).
- Grant the `geolocation` permission and set the geolocation to Alexanderplatz, Berlin: latitude 52.5219, longitude 13.4132.
- Wait until the text of `#status` no longer contains "Waiting".
- Network access to routing.openstreetmap.de, nominatim.openstreetmap.org, tile.openstreetmap.org and unpkg.com is required.

## Scenario 1: Selector shows Walk, Car and Bike as segmented buttons (design C)
### Setup
Common setup.
### Steps
1. Read the visible text of every `#mode label`, in order.
2. Read which `input[name=mode]` is checked.
3. Read the bounding box of each `#mode label`.
4. Take a screenshot of `#mode`.
5. Press Tab until `input[name=mode][value=foot]` has focus, then press ArrowRight two times.
6. Read which `input[name=mode]` is checked, and the computed `background-color` of the `span` after each input.
### Expected
- [ ] The label texts are exactly "🚶 Walk", "🚗 Car", "🚲 Bike", in that order.
- [ ] At step 2, the checked input has value `foot`.
- [ ] The three labels have the same `y` (one row) and touch each other horizontally (gap ≤ 2 px).
- [ ] At step 6, the checked input has value `bike`.
- [ ] At step 6, the bike span background is `rgb(232, 240, 254)` and the walk and car span backgrounds are different from it.
- [ ] The accessibility snapshot of `#mode` (`page.accessibility.snapshot` or `getByRole('radio', { name: /Bike/ })`) shows a radio named "Bike" with `checked: true`.

## Scenario 2: Bike routes for a destination
### Setup
Common setup.
### Steps
1. Click the label that contains "Bike".
2. Type "Brandenburger Tor, Berlin" in `#search-input` and press Enter.
3. Click the first `#results` entry button (not "Add as stop").
4. Read `#status` right after the click, then every 200 ms for at most 3 s.
5. Wait until `#routes li` exists or `#status` contains "No cycling route found." (at most 20 s).
6. Read the text of every `#routes li button`, and the text of `#status`.
7. Read which `#routes button` has `aria-pressed="true"`.
### Expected
- [ ] At step 4, `#status` showed "Computing cycling routes…" at least once.
- [ ] There are 1, 2 or 3 entries in `#routes`.
- [ ] Each entry text matches `Route N · <distance> · <duration>` (for example "Route 1 · 2.31 km · 9 min").
- [ ] The first route button has `aria-pressed="true"`.
- [ ] If there are 2 or more routes, `#status` matches `N cycling routes · fastest …`; if there is 1 route, `#status` ends with "by bike".
- [ ] The duration of Route 1, in minutes, is less than its distance in km × 12 (faster than walking at 5 km/h).

## Scenario 3: Bike route durations are shorter than walking (SC-002)
### Setup
Common setup.
### Steps
1. Keep Walk selected. Search "Brandenburger Tor, Berlin" and click the first result.
2. Wait for `#routes li`. Read the duration of Route 1 (minutes).
3. Click the label that contains "Bike".
4. Wait until `#status` contains "cycling" or "by bike". Read the duration of Route 1 (minutes).
### Expected
- [ ] The bike duration at step 4 is smaller than the walking duration at step 2.

## Scenario 4: Select a bike route from the panel and from the map
### Setup
Common setup. Select Bike and show routes to "Brandenburger Tor, Berlin" as in scenario 2. If only 1 route is shown, use "Potsdamer Platz, Berlin" instead.
### Steps
1. Click the second `#routes button`.
2. Read which `#routes button` has `aria-pressed="true"`.
3. Click a point in the middle of the first route's line on the map (a `path.leaflet-interactive` element: use the point at half the path length, `getPointAtLength(getTotalLength()/2)`). Do this only if the first route line is not under the second one.
4. Read which `#routes button` has `aria-pressed="true"`.
### Expected
- [ ] After step 1, the second route button has `aria-pressed="true"` and the first has `aria-pressed="false"`.
- [ ] After step 3, the first route button has `aria-pressed="true"`.
- [ ] No "Add stop here" popup is open after step 3.

## Scenario 5: Pleasure indicator on bike routes
### Setup
Common setup. Select Bike and show routes to "Brandenburger Tor, Berlin".
### Steps
1. Wait until no `.pleasure` element contains "Pleasure: …" (at most 20 s).
2. Read the text and the `title` attribute of every `#routes .pleasure`.
3. Click the label that contains "Car". Wait until `#status` contains "driving" or "by car".
4. Count the `#routes .pleasure` elements.
### Expected
- [ ] At step 2, each route has exactly one `.pleasure` element.
- [ ] Each text is either "Pleasure: N green px" (with or without " · most pleasant") or "Pleasure unavailable".
- [ ] If the texts are not "Pleasure unavailable", exactly one contains "most pleasant" and has the class `best`.
- [ ] If the texts are not "Pleasure unavailable", the `title` is "Green pixels (parks, grass, woods) on the map along this route; more is more pleasant".
- [ ] At step 4, the count is 0.

## Scenario 6: No cycling route found
### Setup
Common setup. In Playwright, route `**/routed-bike/**` to fulfil with status 200 and body `{"code":"NoRoute","message":"Impossible route between points","routes":[]}`.
### Steps
1. Click the label that contains "Bike".
2. Search "Brandenburger Tor, Berlin" and click the first result.
3. Wait until `#status` stops containing "Computing" (at most 10 s).
### Expected
- [ ] `#status` is exactly "No cycling route found.".
- [ ] `#routes` has no `li`.

## Scenario 7: No forced detours for bike (FR-006)
### Setup
Common setup. In Playwright, log every request URL that contains `routed-bike`. Fulfil every `**/routed-bike/**` request with one route: `{"code":"Ok","routes":[{"distance":1200,"duration":300,"geometry":{"type":"LineString","coordinates":[[13.4132,52.5219],[13.40,52.52],[13.3777,52.5163]]}}]}`.
### Steps
1. Click the label that contains "Bike".
2. Search "Brandenburger Tor, Berlin" and click the first result.
3. Wait for `#routes li` (at most 10 s), then wait 2 s more.
4. Count the `#routes li` entries and the logged `routed-bike` requests.
### Expected
- [ ] There is exactly 1 entry in `#routes`.
- [ ] There is exactly 1 logged `routed-bike` request, and it contains `alternatives=3`.
- [ ] `#status` ends with "1.20 km · 5 min by bike".
