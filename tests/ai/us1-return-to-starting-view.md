# US1: Return the map to its starting view
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-009, FR-010, SC-001, SC-002, SC-004, US1 scenario 1, 2, 3, 4, 5

Helper for all scenarios: read the map view with `page.evaluate` on the page's Leaflet map instance if exposed, otherwise read the centre from the URL-less state by zooming the visible scale bar / tile coordinates in the DOM (`.leaflet-tile` `src` z/x/y of the centre tile). Zoom is read from the tile `z` value.

## Scenario 1: Reset from a panned/zoomed map, location denied
### Setup
`npm start` (http://localhost:8000). Headless Playwright Chromium, geolocation permission NOT granted (denied). Wait for the map tiles to load.
### Steps
1. Open http://localhost:8000.
2. Record map centre and zoom (expected default 48.8566, 2.3522, zoom 13).
3. Confirm a button with visible text "Reset view" exists inside `.leaflet-top.leaflet-right`.
4. Drag the map 300 px left and scroll-zoom in two levels.
5. Click "Reset view" and note the time of the click; wait until `moveend` / tiles stop changing.
6. Click "Reset view" two more times.
### Expected
- [ ] Step 3: the button is visible and its text is exactly "Reset view"
- [ ] Step 2: centre is 48.8566, 2.3522 and zoom is 13
- [ ] After step 5 the centre is 48.8566, 2.3522 and zoom is 13
- [ ] The map stopped moving less than 1 s after the click
- [ ] After step 6 the centre and zoom are unchanged and no console error was logged

## Scenario 2: Reset returns to the start-up location view, not the current position
### Setup
Playwright context with geolocation permission granted and geolocation set to 51.5000, -0.1200. Start the app as above.
### Steps
1. Open the app and wait for the map to centre on the user; record centre and zoom (expected 51.5, -0.12, zoom 15).
2. Drag and zoom the map away.
3. Change the context geolocation to 40.7128, -74.0060 so a new position update arrives; wait 2 s.
4. Click "Reset view".
5. Wait until the map stops moving.
### Expected
- [ ] Step 1: zoom is 15 and centre is 51.5, -0.12
- [ ] After step 5 the centre is 51.5, -0.12 and zoom is 15 (not 40.7128, -74.006)
- [ ] The user position marker is still shown at its latest position

## Scenario 3: A late first fix sets the start view once, even after the map was moved
### Setup
Geolocation permission granted but the fix is delayed: set the geolocation only after step 3.
### Steps
1. Open the app (no fix yet), drag the map elsewhere.
2. Click "Reset view" and note the view.
3. Provide a fix at 51.5, -0.12; wait for the map to auto-centre.
4. Drag/zoom away, then click "Reset view".
### Expected
- [ ] After step 2 the map shows 48.8566, 2.3522, zoom 13
- [ ] After step 3 the map is centred on 51.5, -0.12 at zoom 15
- [ ] After step 4 the map shows 51.5, -0.12 at zoom 15

## Scenario 4: Only the map view changes (search, routes, mode, status, popup)
### Setup
App running with geolocation granted at 48.8566, 2.3522. Network monitoring on (Playwright `page.on("request")`).
### Steps
1. Type a place name in the search input, pick a result so a destination marker and routes appear; open the destination popup; select a non-default route and a non-default travel mode.
2. Record: search input value, number of routes, selected route, selected mode, status message text, popup open or not, user marker position.
3. Pan the map away; clear the recorded request list.
4. Click "Reset view".
5. Wait 2 s and compare with the records from step 2.
### Expected
- [ ] The search input value is unchanged
- [ ] The same number of routes is shown and the same route is selected
- [ ] The travel mode is unchanged
- [ ] The status message text is unchanged
- [ ] The user marker position is unchanged
- [ ] The popup is still open, or was closed only because its marker moved out of view
- [ ] No network request was made after step 3 other than map tile requests

## Scenario 5: Pressed mid-animation, and clicks do not reach the map
### Setup
As scenario 4 up to selecting a place.
### Steps
1. Select a search result so the map starts fitting to the routes.
2. Immediately (within 200 ms) click "Reset view".
3. Wait until the map stops moving.
4. Double-click "Reset view" quickly.
### Expected
- [ ] After step 3 the map shows the start view centre and zoom
- [ ] Step 3 ends less than 1 s after the click in step 2
- [ ] After step 4 the map zoom has not increased (the double-click did not zoom the map)
