# US1: Return to the starting view in one click
Covers: FR-002, FR-003, FR-004, FR-005, FR-008, FR-010, FR-011, SC-001, SC-002, SC-003, SC-004, US1 scenario 1, 2, 3, 4, 5

## Common setup (all scenarios)

- Start the static server from the repository root: `python3 -m http.server 8000` (or `npm start`). Open the page at `http://localhost:8000/`.
- Use headless Chromium with Playwright, viewport 1280×800, default text size.
- Leaflet is loaded from unpkg.com, so that host must be reachable.
- Make the app deterministic with `page.route` before `page.goto`:
  - `https://tile.openstreetmap.org/**`: fulfill every tile with the same 256×256 PNG (any solid colour) and status 200.
  - `https://nominatim.openstreetmap.org/search**`: fulfill with JSON `[{"display_name":"Louvre Museum, Paris","lat":"48.8606","lon":"2.3376"},{"display_name":"Musée d'Orsay, Paris","lat":"48.86","lon":"2.3266"}]`.
  - `https://routing.openstreetmap.de/**`: fulfill with JSON `{"code":"Ok","routes":[{"distance":1000,"duration":700,"geometry":{"type":"LineString","coordinates":[[2.35,48.85],[2.35,48.8606],[2.3376,48.8606]]}},{"distance":1100,"duration":800,"geometry":{"type":"LineString","coordinates":[[2.35,48.85],[2.3376,48.85],[2.3376,48.8606]]}}]}`. Scenario 5 delays this response instead; see there.
- **Starting tile**: right after the app settles (see each scenario), run `page.evaluate` to find the `img.leaflet-tile` whose bounding box contains the centre point of `#map`. Record its `src` and its `getBoundingClientRect()` (`x`, `y`). The zoom level is the first path number after the host in `src`, e.g. `/13/4150/2818.png` is zoom 13.
- **"Back at the starting view"** means all of the following:
  - an `img.leaflet-tile` with the recorded `src` exists;
  - its bounding box `x` and `y` are each within 1 px of the recorded values;
  - the tile under the centre of `#map` has the same zoom number.

  This means the same centre to within 1 CSS px and exactly the same zoom. The numeric 5 m check of SC-002 is done by `test/reset-view.test.js`, because one pixel is about 12 m at zoom 13.
- **The Reset view button** is `page.getByRole('button', { name: 'Reset view' })`.
- **"Pan and zoom away"** means:
  1. Drag the map with the mouse from the centre of `#map` 300 px left and 200 px up, using `page.mouse.down` / `move` / `up` at a point not covered by `#panel`, e.g. x=900, y=500.
  2. Press the "Zoom in" button twice.
  3. Wait 500 ms.

## Scenario 1: Location blocked, reset goes back to central Paris at zoom 13 (US1 scenario 5)
### Setup
Create the browser context with no geolocation permission. Do not call `grantPermissions`, so geolocation is denied.
### Steps
1. Go to `http://localhost:8000/` and wait 1500 ms.
2. Record the starting tile. Its zoom must be 13.
3. Pan and zoom away.
4. Click the Reset view button.
5. Wait 1000 ms.
### Expected
- [ ] The starting tile's zoom number is 13.
- [ ] After step 3, the tile under the map centre has a zoom number other than 13 (the map really moved).
- [ ] After step 5, the map is back at the starting view: same tile `src`, position within 1 px, zoom 13.
- [ ] The browser console shows no error after step 4.

## Scenario 2: Located, reset goes back to the first fix at zoom 15 (US1 scenario 1, 4)
### Setup
Create the browser context with `permissions: ['geolocation']` and `geolocation: { latitude: 52.52, longitude: 13.405 }` (Berlin).
### Steps
1. Go to `http://localhost:8000/` and wait 2000 ms, until `path.leaflet-interactive` (the blue position dot) is present.
2. Record the starting tile.
3. Record the position dot's bounding box centre.
4. Pan and zoom away.
5. Click the Reset view button.
6. Wait 1000 ms.
### Expected
- [ ] The starting tile's zoom number is 15.
- [ ] Before step 4, the blue dot's centre is within 2 px of the centre of `#map`.
- [ ] After step 6, the map is back at the starting view: same tile `src`, within 1 px, zoom 15.
- [ ] After step 6, the blue dot's centre is again within 2 px of the centre of `#map`.

## Scenario 3: A later position update does not move the reset target (FR-003, FR-004)
### Setup
Same as Scenario 2 (Berlin).
### Steps
1. Go to `http://localhost:8000/` and wait 2000 ms.
2. Record the starting tile.
3. Call `context.setGeolocation({ latitude: 52.53, longitude: 13.42 })` (about 1.4 km away) and wait 1000 ms.
4. Pan and zoom away.
5. Click the Reset view button.
6. Wait 1000 ms.
### Expected
- [ ] After step 6, the map is back at the starting view recorded in step 2: same tile `src`, within 1 px, zoom 15.
- [ ] After step 6, the blue dot's centre is NOT within 10 px of the centre of `#map` (it follows the live position, not the reset target).

## Scenario 4: Pressing at the starting view does nothing visible (US1 scenario 2, FR-008)
### Setup
Same as Scenario 1 (location blocked).
### Steps
1. Go to `http://localhost:8000/` and wait 1500 ms.
2. Record the starting tile.
3. Click the Reset view button.
4. Immediately record the tile position again.
5. Wait 300 ms and record the tile position again.
6. Click the Reset view button two more times, 200 ms apart.
7. Wait 500 ms.
### Expected
- [ ] At steps 4, 5 and 7, the recorded tile exists, its `x` and `y` are within 1 px of the step 2 values, and the centre zoom is still 13.
- [ ] At no time during steps 3–7 does `.leaflet-tile-pane` contain zero `img.leaflet-tile` elements. Sample the count every 50 ms.
- [ ] The browser console shows no error.

## Scenario 5: Reset while routes load wins; search, routes and selection unchanged (US1 scenario 3, FR-005, FR-011)
### Setup
- Context with geolocation granted at `{ latitude: 48.85, longitude: 2.35 }`.
- Route the routing host so that the FIRST request is held until the test releases it: keep the `route` object and call `route.fulfill(...)` with the JSON above later. All later routing requests are fulfilled immediately.
### Steps
1. Go to `http://localhost:8000/` and wait 2000 ms.
2. Record the starting tile (zoom 15).
3. Type `museum` into the "Search a place" box and press Enter.
4. Wait for the "Louvre Museum, Paris" result button and click it.
5. Wait until `#status` contains "Computing walking routes".
6. Pan and zoom away.
7. Click the Reset view button.
8. Release the held routing request(s) and wait 1500 ms.
9. Record:
   - the text of `#search-input`;
   - the text of every `#routes button`;
   - the `aria-pressed` values;
   - the checked travel-mode radio;
   - the text of `#status`;
   - the number of `.leaflet-marker-icon` elements.
10. Click the button whose text starts with "Route 2".
11. Pan and zoom away.
12. Click the Reset view button and wait 1000 ms.
13. Record the same values as in step 9.
14. Click the travel-mode radio "Car" and wait 1500 ms.
### Expected
- [ ] After step 8, `#routes` lists 2 route buttons ("Route 1 …", "Route 2 …"), and the map is still at the starting view (same tile `src`, within 1 px, zoom 15). The map did NOT zoom to the routes.
- [ ] After step 12, the map is at the starting view again.
- [ ] The values recorded at step 13 equal those from step 9, except `aria-pressed`. At step 13 that reads `["false","true"]` (Route 2 still selected).
- [ ] The search box still reads "Louvre Museum, Paris".
- [ ] One destination marker is still shown.
- [ ] After step 14, the tile under the map centre has a different `src` from the starting tile: the car routes were zoomed to as usual.

## Scenario 6: Reduced motion makes the reset instant (FR-010, SC-003)
### Setup
Same as Scenario 1, plus `page.emulateMedia({ reducedMotion: 'reduce' })` before `goto`.
### Steps
1. Go to `http://localhost:8000/` and wait 1500 ms.
2. Record the starting tile.
3. Pan and zoom away.
4. Click the Reset view button.
5. After 50 ms, check whether `#map` or any element inside it has the class `leaflet-zoom-anim`, and record the tile position.
6. Run `page.emulateMedia({ reducedMotion: 'no-preference' })`.
7. Pan and zoom away.
8. Click the Reset view button.
9. Wait 1000 ms.
### Expected
- [ ] At step 5, neither `#map` nor any element inside it has the class `leaflet-zoom-anim`, and the map is already at the starting view (recorded tile within 1 px, zoom 13).
- [ ] After step 9, the map is at the starting view.
- [ ] Throughout, measured from the click in step 8, the tile under the centre has the starting zoom within 1000 ms. Poll every 50 ms.
