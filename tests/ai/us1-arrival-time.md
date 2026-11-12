# US1: See when I will arrive on each route
Covers: FR-001, FR-002, FR-003, FR-004, FR-006, FR-007, FR-008, FR-009, FR-011, SC-001, SC-002, SC-004, US1 scenario 1, 2, 3, 4

## Common setup (all scenarios)
- Start the app from the repo root: `python3 -m http.server 8000`. Open `http://localhost:8000/` in headless Playwright (Chromium).
- Create the browser context with `geolocation: { latitude: 48.85, longitude: 2.35 }`, `permissions: ["geolocation"]`, `timezoneId: "Europe/Paris"`, `locale: "en-GB"`.
- Fix the clock before the page loads: `await page.clock.install({ time: <departure> })`, then `await page.clock.pauseAt(<departure>)`. `<departure>` is given per scenario as local Europe/Paris time on 2026-11-12.
- Stub the network with `page.route`:
  - `**/search?**` returns JSON `[{"display_name":"Destination Place","lat":"48.86","lon":"2.36"},{"display_name":"Stop Place","lat":"48.853","lon":"2.362"}]`.
  - `**/route/v1/**` returns the OSRM fixture given per scenario: `{"code":"Ok","routes":[{"distance":D,"duration":S,"geometry":{"type":"LineString","coordinates":[[2.35,48.85],[LNG,LAT],[2.36,48.86]]}}, ...]}`. Use middle points `[2.355,48.855]`, `[2.36,48.85]` and `[2.35,48.86]` for routes 1, 2 and 3.
  - `https://tile.openstreetmap.org/**` returns status 503. The map stays grey, and walking routes show "Pleasure unavailable".
- The route entries are the `button` elements in `#routes`. The route title is the first `span` in each button.

## Scenario 1: one route, 14:07 + 25 min (US1 scenario 1)
### Setup
- `<departure>` = 2026-11-12 14:07:00. OSRM fixture: two routes, (D, S) = (2100, 1500) and (2200, 1800). Two routes keep the app from sending walking detour requests.
### Steps
1. Load `http://localhost:8000/`.
2. Fill `#search-input` with `Destination` and press Enter.
3. Click the button with text `Destination Place` in `#results`.
4. Wait until `#routes button` count is 2.
5. Read the text of each `#routes button > span:first-child`.
### Expected
- [ ] The first title is exactly `Route 1 · 2.10 km · 25 min, arrive 14:32`.
- [ ] The second title is exactly `Route 2 · 2.20 km · 30 min, arrive 14:37`.
- [ ] Each title is one text node inside the route button: the arrival is not in a separate element.

## Scenario 2: three car routes, each with its own arrival (US1 scenario 2, SC-001, FR-011)
### Setup
- `<departure>` = 2026-11-12 14:07:00. OSRM fixture: three routes, (D, S) = (2100, 1500), (2200, 1800), (2300, 2100).
### Steps
1. Load the page.
2. Click the radio `input[name=mode][value=car]`.
3. Search for `Destination` and click `Destination Place`.
4. Wait until `#routes button` count is 3.
5. Read the title text of each route and the text of `#status`.
6. For each route title span, evaluate `getComputedStyle(el).fontWeight`.
### Expected
- [ ] The titles are `Route 1 · 2.10 km · 25 min, arrive 14:32`, `Route 2 · 2.20 km · 30 min, arrive 14:37` and `Route 3 · 2.30 km · 35 min, arrive 14:42`, in this order.
- [ ] `#status` reads exactly `3 driving routes · fastest 2.10 km · 25 min`, with no `arrive` text.
- [ ] No route button contains the words `first`, `earliest` or a tag/badge element in addition to the title span.
- [ ] The three title spans have the same `fontWeight` value.

## Scenario 3: walking route with a stop keeps the pleasure line (US1 scenario 2, FR-006)
### Setup
- `<departure>` = 2026-11-12 14:07:00. OSRM fixture: two routes, (2100, 2400) and (2200, 2700).
### Steps
1. Load the page (Walk is selected by default).
2. Search for `Destination`. In `#results`, click the `Add as stop` button on the `Stop Place` row.
3. Search for `Destination` again and click `Destination Place`.
4. Wait until `#routes button` count is 2.
5. Read the full text of each route button and of its `span.pleasure`.
### Expected
- [ ] The intercepted OSRM request URL contains 3 coordinate pairs (start;stop;destination).
- [ ] Route 1 title is exactly `Route 1 · 2.10 km · 40 min, arrive 14:47`.
- [ ] Route 2 title is exactly `Route 2 · 2.20 km · 45 min, arrive 14:52`.
- [ ] Each route button still has a `span.pleasure` whose text starts with `Pleasure` and does not contain `arrive`.
- [ ] `#status` contains `via 1 stop` and does not contain `arrive`.

## Scenario 4: long trip and rounding (US1 scenario 3, FR-002, FR-003)
### Setup
- `<departure>` = 2026-11-12 09:55:00. OSRM fixture: routes (2100, 4200) and (2200, 4800).
### Steps
1. Load the page, search for `Destination`, click `Destination Place`.
2. Wait until `#routes button` count is 2 and read the titles.
3. Open a new page in a new context with `<departure>` = 2026-11-12 14:07:40 and an OSRM fixture of (2100, 1490) and (2200, 1800). Repeat step 1. Read the titles.
### Expected
- [ ] After step 2, route 1 title is exactly `Route 1 · 2.10 km · 1 h 10 min, arrive 11:05`.
- [ ] After step 2, route 2 title is exactly `Route 2 · 2.20 km · 1 h 20 min, arrive 11:15`.
- [ ] After step 3, route 1 title is exactly `Route 1 · 2.10 km · 25 min, arrive 14:33` (14:07:40 + 24 min 50 s = 14:32:30, which rounds up).

## Scenario 5: arrival after midnight (US1 scenario 4, FR-004)
### Setup
- `<departure>` = 2026-11-12 23:50:00. OSRM fixture: routes (2100, 1500) and (2200, 94000).
### Steps
1. Load the page, search for `Destination`, click `Destination Place`.
2. Wait until `#routes button` count is 2 and read the titles.
### Expected
- [ ] Route 1 title is exactly `Route 1 · 2.10 km · 25 min, arrive 00:15 (+1 day)`.
- [ ] Route 2 title ends with `, arrive 01:57 (+2 days)` (23:50 + 26 h 6 min 40 s = 2026-11-14 01:56:40, which rounds to 01:57).

## Scenario 6: no route and routing error show no arrival (FR-007)
### Setup
- `<departure>` = 2026-11-12 14:07:00. OSRM stub returns `{"code":"NoRoute","routes":[]}` for the first scenario run and HTTP 500 for the second run.
### Steps
1. Load the page, search for `Destination`, click `Destination Place`.
2. Wait until `#status` text contains `No walking route found.`
3. Read the text of `#panel`.
4. Change the OSRM stub to return HTTP 500. Click the radio `input[name=mode][value=car]`.
5. Wait until `#status` text starts with `Routing failed`.
6. Read the text of `#panel`.
### Expected
- [ ] After step 3, `#routes` has 0 buttons and `#panel` text does not contain `arrive`.
- [ ] After step 6, `#routes` has 0 buttons and `#panel` text does not contain `arrive`.

## Scenario 7: accessible name and wrapping in a narrow panel (FR-008, FR-009)
### Setup
- `<departure>` = 2026-11-12 23:50:00. Viewport 320 × 640. OSRM fixture: routes (2100, 1500) and (2200, 1800). Walk mode.
### Steps
1. Load the page, search for `Destination`, click `Destination Place`.
2. Wait until `#routes button` count is 2.
3. Read `await page.locator("#routes").ariaSnapshot()`.
4. On the first route button, evaluate `getComputedStyle(el).whiteSpace`, `getComputedStyle(el).textOverflow`, `el.scrollWidth`, `el.clientWidth` and `el.getAttribute("aria-label")`. Do the same `whiteSpace` and `textOverflow` reads on its first `span`.
5. Take a screenshot of `#panel`.
### Expected
- [ ] The first route button's accessible name in the aria snapshot contains `25 min, arrive 00:15 (+1 day)`.
- [ ] The route button has no `aria-label` attribute.
- [ ] On the button and on the span, `whiteSpace` is not `nowrap` and `textOverflow` is not `ellipsis`.
- [ ] The button's `scrollWidth` is less than or equal to its `clientWidth` + 1, so no text is cut off.
- [ ] In the screenshot, the full text `arrive 00:15 (+1 day)` is visible, on the same or the next line, with no `…`.

## Scenario 8: the earliest arrival is easy to read (SC-004, FR-011)
### Setup
- Same as scenario 2 (three car routes at 14:07).
### Steps
1. Do scenario 2 steps 1–4.
2. Read the visible text of `#routes` with `locator.innerText()`.
3. For each route button, count its child elements, and evaluate `getComputedStyle(span).fontWeight` for each title span.
### Expected
- [ ] `innerText` contains the three arrival times `arrive 14:32`, `arrive 14:37` and `arrive 14:42`, visible without hover, scroll or click.
- [ ] The first route entry has the earliest arrival time of the three.
- [ ] Each route button has exactly 1 child element (the title span; car mode has no pleasure span).
- [ ] The three title spans have the same `fontWeight` value.
