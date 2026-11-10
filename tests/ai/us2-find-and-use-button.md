# US2: Find and use the button with any input method
Covers: FR-001, FR-006, FR-007, FR-009, SC-005, SC-006, US2 scenario 1, 2, 3

## Common setup (all scenarios)

- From the repository root, start the static server with `python3 -m http.server 8000` (or `npm start`). Open `http://localhost:8000/` in headless Chromium with Playwright, at the default text size.
- Leaflet is loaded from unpkg.com, so that host must be reachable.
- Before `page.goto`, mock these with `page.route`:
  - Tiles (`https://tile.openstreetmap.org/**`): one 256×256 PNG.
  - Nominatim (`https://nominatim.openstreetmap.org/search**`): a JSON array of **10** results, `{"display_name":"Rue n°<i>, Paris","lat":"48.85<i>","lon":"2.34<i>"}` for i = 0..9.
  - Routing (`https://routing.openstreetmap.de/**`): the 2-route JSON from `tests/ai/us1-reset-to-starting-view.md`.
- Geolocation is denied unless the scenario says otherwise.
- **The Reset view button** is `page.getByRole('button', { name: 'Reset view' })`. **Zoom in/out** are `getByRole('button', { name: 'Zoom in' })` and `getByRole('button', { name: 'Zoom out' })`. Leaflet renders them as `a[role=button]`.
- **The starting view check**: record and compare the centre tile as in `tests/ai/us1-reset-to-starting-view.md`, Common setup.
- **"Pan away"**: drag the map from (x = W−100, y = H/2) by 200 px left, where W×H is the viewport.

## Scenario 1: Placement and look on desktop and phones (US2 scenario 1, FR-001, FR-007, FR-009)
### Setup
Run the steps once at each viewport: 1280×800, 360×640, 320×568, 320×320 and 568×320.
### Steps
1. Set the viewport, go to `http://localhost:8000/` and wait 1500 ms.
2. Record the bounding boxes of:
   - the Reset view button;
   - Zoom in and Zoom out;
   - `.leaflet-control-attribution`;
   - `#panel`;
   - `#map`.
3. Record the button's `textContent`, its `title`, its computed `color` and `background-color`, and the computed `border-color` of its parent `.leaflet-bar`.
4. Hover the Reset view button and record its computed `background-color`.
5. Hover Zoom in and record its computed `background-color`.
### Expected
- [ ] The Reset view box lies fully inside the `#map` box (visible).
- [ ] The Reset view box does not intersect `#panel`.
- [ ] The Zoom in and Zoom out boxes lie fully inside `#map` and do not intersect `#panel`.
- [ ] The vertical order, from top to bottom, is Reset view, then Zoom in, then Zoom out, then the attribution. Reset view's bottom ≤ Zoom in's top, and Zoom out's bottom ≤ the attribution's top.
- [ ] All four are right-aligned in the bottom-right corner: each box's right edge is within 15 px of `#map`'s right edge.
- [ ] The Reset view box is at least 30×30 px, and its width equals Zoom in's width within 2 px.
- [ ] `textContent.trim()` is `⌂`, and `title` is `Reset view`.
- [ ] The contrast ratio of the button's `color` against its `background-color` is ≥ 3. Compute it with the WCAG relative luminance formula.
- [ ] The computed `color` is #333 (rgb(51, 51, 51)) or darker.
- [ ] The hover `background-color` of Reset view equals the hover `background-color` of Zoom in.

## Scenario 2: Keyboard use, Enter and Space, focus stays (US2 scenario 2, FR-006, SC-005)
### Setup
1280×800, geolocation denied.
### Steps
1. Go to `http://localhost:8000/` and wait 1500 ms.
2. Record the starting tile.
3. Pan away.
4. Press Tab repeatedly, up to 30 times, until `document.activeElement` has `aria-label` "Reset view".
5. Take a screenshot of the button. Record its computed `outline-style` and `outline-width`, which must come from `:focus-visible`.
6. Press Enter and wait 1000 ms.
7. Pan away again, re-focus the button with `button.focus()`, press Space and wait 1000 ms.
### Expected
- [ ] Step 4 reaches the button within 30 Tab presses.
- [ ] At step 5, the outline style is not `none`, and the outline width is ≥ 1 px.
- [ ] After step 6, the map is at the starting view, and `document.activeElement` is still the Reset view button.
- [ ] After step 7, the map is at the starting view, and `document.activeElement` is still the Reset view button.
- [ ] `#status` text is the same before step 6 and after step 7.

## Scenario 3: Accessible name and role (US2 scenario 3, FR-006)
### Setup
1280×800.
### Steps
1. Go to `http://localhost:8000/` and wait 1500 ms.
2. Run `page.accessibility.snapshot()`, or `locator.ariaSnapshot()` on the bottom-right control corner `.leaflet-bottom.leaflet-right`.
### Expected
- [ ] The snapshot contains exactly one node with role `button` and name `Reset view`.
- [ ] The snapshot still contains buttons named `Zoom in` and `Zoom out`.
- [ ] No node has the name `⌂`, because the glyph is hidden from assistive technology.

## Scenario 4: Touch tap and double-tap never zoom the map (FR-006)
### Setup
- Context with `hasTouch: true` and `isMobile: true`, at 360×640.
- Geolocation denied.
### Steps
1. Go to `http://localhost:8000/` and wait 1500 ms.
2. Record the starting tile.
3. Pan away by dispatching a touch drag with `page.touchscreen`, or a mouse drag as a fallback.
4. Tap the Reset view button with `locator.tap()` and wait 1000 ms.
5. Tap it twice more within 250 ms and wait 1000 ms.
6. Double-click it with `locator.dblclick()` and wait 1000 ms.
### Expected
- [ ] After step 4, the map is at the starting view (zoom 13).
- [ ] After step 5, the map is at the starting view, and the centre tile's zoom is still 13 (no double-tap zoom).
- [ ] After step 6, the map is at the starting view, and the zoom is still 13.

## Scenario 5: Narrow screens, panel capped above the controls and only the lists scroll (FR-007, SC-006)
### Setup
- Run once at 320×568 and once at 320×320.
- Geolocation granted at `{ latitude: 48.85, longitude: 2.35 }`.
### Steps
1. Set the viewport, go to `http://localhost:8000/` and wait 2000 ms.
2. Type `rue` into "Search a place" and press Enter. Wait for 10 result buttons in `#results`.
3. Record the bounding boxes of `#panel`, the Reset view button, `#search-input`, the Go button, `#mode`, `#status` (if shown) and `#results`. Also record `#results.scrollHeight` and `#results.clientHeight`.
4. Scroll `#results` to the bottom with `el.scrollTop = el.scrollHeight`, or with the mouse wheel over it. Record `#results.scrollTop` and the bounding box of `#search-input`.
5. Record the starting tile, then use the mouse wheel over `#results` (deltaY 500, three times) and wait 500 ms.
6. Press Tab from `#search-input` until the 10th result button has focus.
7. Click the 10th result, wait 1500 ms for the routes, then click the travel-mode radio "Car" and wait 1500 ms.
8. Record the bounding boxes of `#panel`, `#routes`, the Reset view button and `#status`.
9. At 1280×800, reload, search `rue`, and record the computed `max-height` of `#panel`.
### Expected
- [ ] At step 3, the bottom of `#panel` is at least 10 px above the top of the Reset view button.
- [ ] At step 3, `#results.scrollHeight` > `#results.clientHeight` (the list scrolls).
- [ ] At step 3, the boxes of `#search-input`, Go and `#mode` are fully inside the `#panel` box.
- [ ] At 320×568, `#results.clientHeight` is ≥ 3 × the height of one result row (`#results li`).
- [ ] At 320×320, `#results.clientHeight` > 0.
- [ ] At step 4, `#results.scrollTop` > 0, and `#search-input` has the same `y` as at step 3 (the search box did not scroll away).
- [ ] After step 5, the centre tile is unchanged: wheel scrolling over the panel did not zoom or pan the map.
- [ ] At step 6, the focused 10th result's box lies inside the `#results` box (scrolled into view).
- [ ] At step 8, the bottom of `#panel` is at least 10 px above the top of the Reset view button.
- [ ] At step 8, `#status` is fully inside `#panel` and shows a one-line route summary.
- [ ] At step 8, `#routes.scrollTop` is 0.
- [ ] At step 8, the Reset view button and Zoom in/out are fully inside the viewport and not covered by `#panel`. Check that `document.elementFromPoint` at each button's centre returns that button or a child of it.
- [ ] At step 9, the computed `max-height` of `#panel` is `none` (wide screens unchanged).

## Scenario 6: Reset keeps the lists' scroll positions (FR-005, FR-007)
### Setup
320×568, geolocation granted at `{ latitude: 48.85, longitude: 2.35 }`.
### Steps
1. Go to `http://localhost:8000/` and wait 2000 ms.
2. Search `rue` and wait for 10 results.
3. Set `#results.scrollTop = 60` and record the actual value.
4. Pan away.
5. Click the Reset view button and wait 1000 ms.
### Expected
- [ ] After step 5, `#results.scrollTop` equals the value recorded in step 3.
- [ ] After step 5, `#results` still holds 10 result buttons.
