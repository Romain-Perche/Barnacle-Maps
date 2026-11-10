# US1: Return the map to its starting view
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-007, FR-008, FR-009, SC-001, SC-002, SC-003, US1 scenario 1, 2, 3, 4

Common setup: `npm start` (serves http://localhost:8000), headless Playwright with Chromium. "Zoom and center tile" means: the zoom `z` and the `x`,`y` of the `img.leaflet-tile` (URL `.../{z}/{x}/{y}.png`) whose box contains the center of `#map`.

## Scenario 1: Default view when location is denied
### Setup
Open a new Playwright context with no geolocation permission (permissions: []). Load http://localhost:8000 and wait 3 s.
### Steps
1. Read the zoom `z` and center tile `x`,`y` of the tile layer (`img.leaflet-tile` closest to the center of `#map`). Record them as START.
2. Drag the map by 300 px left and 200 px up with the mouse, then double-click the map twice to zoom in.
3. Click the button with accessible name "Reset view" (`page.getByRole('button', {name: 'Reset view'})`).
4. Wait 1.5 s and read the center tile and zoom again.
### Expected
- [ ] The button exists, is visible and enabled before any interaction.
- [ ] After step 3 the zoom `z` equals START's zoom (13).
- [ ] After step 3 the center tile `x`,`y` equals START's.
- [ ] The view settled within 2 seconds of the click.

## Scenario 2: First position at zoom 15, fixed afterwards
### Setup
New context with permissions ['geolocation'] and geolocation {latitude: 45.764, longitude: 4.835}. Load the app, wait 3 s.
### Steps
1. Record the zoom and center tile: it must be zoom 15 around Lyon. Record as START.
2. Pan and zoom the map away (drag 400 px, scroll-zoom out 3 steps).
3. Call `context.setGeolocation({latitude: 43.296, longitude: 5.37})` (Marseille) and wait 2 s.
4. Click "Reset view", wait 1.5 s, read zoom and center tile.
### Expected
- [ ] START zoom is 15.
- [ ] After step 4 the zoom is 15 and the center tile equals START's (Lyon), not Marseille.

## Scenario 3: Reset leaves search, routes and mode untouched
### Setup
Context with geolocation Lyon (as above). Load the app.
### Steps
1. Select the "Car" radio in the Travel mode group.
2. Type "Place Bellecour" into "Search a place", submit, click the first result, wait until `#routes` has at least one item (up to 30 s).
3. Record: the text of `#status`, the number of `#routes li`, which route button is selected, the checked mode radio, and whether a destination marker (`.leaflet-marker-icon`) exists.
4. Pan the map away by 500 px, click "Reset view", wait 1.5 s.
5. Read the same five values again.
### Expected
- [ ] The map center tile is Lyon at zoom 15 again.
- [ ] `#routes li` count, selected route, checked mode (Car), and destination marker presence are identical to step 3.
- [ ] The text of `#status` is identical to step 3.
- [ ] The search input value is unchanged.

## Scenario 4: Pressing at the starting view and repeatedly
### Setup
Denied-location context (as Scenario 1). Listen for `pageerror` and console errors.
### Steps
1. Click "Reset view" once without moving the map.
2. Pan away, then click "Reset view" 5 times quickly (about 100 ms apart).
3. Wait 1.5 s and read the zoom and center tile.
### Expected
- [ ] After step 1 the view is unchanged (same zoom and center tile).
- [ ] After step 3 the view equals START (zoom 13, same center tile).
- [ ] No page error and no console error was reported.

## Scenario 5: Button layout and look at 320 px and desktop
### Setup
Denied-location context, viewport 320x640, then 1280x800.
### Steps
1. At each viewport, get the bounding boxes of the "Reset view" button, `#panel`, `.leaflet-control-zoom`, `.leaflet-control-attribution`.
2. Check the button's computed `width` and `height`; repeat with `hasTouch: true` and `isMobile: true` emulation.
3. Click the center of the button with `page.mouse.click` and confirm the map's view changes after a pan (button is not covered).
### Expected
- [ ] The button box does not intersect the boxes of `#panel`, the zoom control or the attribution, at both viewports.
- [ ] The button lies in the top-right half of the map (its center x is greater than 50% of the viewport width, y is less than 25% of the height).
- [ ] The button is at least 30x30 CSS px on desktop and at least 34x34 on the touch emulation.
- [ ] The button has no visible text (its `innerText` is empty) and its `title` is "Reset view".
- [ ] The mouse click at its center resets the view.
