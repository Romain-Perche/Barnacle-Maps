# US3: Accessible and discoverable control
Covers: FR-001, FR-006, FR-007, FR-008, FR-009, FR-011, FR-012, FR-013, FR-016, FR-017, SC-004, SC-005, SC-006, SC-007, US3 scenario 1, 2, 3, 4

## Common setup (all scenarios)
- Start the app from the repo root: `npm start` (http://localhost:8000). It needs network access to unpkg.com and tile.openstreetmap.org.
- Headless Chromium with Playwright, no geolocation permission (location denied) unless a scenario says otherwise.
- Use the same `window.__map` init script, "Read the view" and "Press Reset view" as in `tests/ai/us1-return-to-starting-view.md`.
- `BTN` is `page.getByRole("button", { name: "Reset view" })`.
- "Gap(A, B)" for two boxes is `max(B.x − (A.x + A.width), A.x − (B.x + B.width), B.y − (A.y + A.height), A.y − (B.y + B.height))`. A negative or zero value means the boxes touch or intersect.

## Scenario 1: Keyboard reaches and activates the button; focus stays on it (US3 scenario 1, 3; FR-006)
### Setup
Common setup, viewport 1280×800.
### Steps
1. Go to http://localhost:8000 and wait until `#status` contains "Location unavailable".
2. Press Tab repeatedly (at most 15 times). After each press, record `document.activeElement`'s `aria-label`, `id` and tag name.
3. Stop when the focused element's `aria-label` is "Reset view".
4. Drag the map from (900, 600) to (500, 300) with the mouse, then focus BTN again with `BTN.focus()`.
5. Press Enter, wait 1500 ms, and read the view as V1. Record the focused element's `aria-label`.
6. Drag the map away again, call `BTN.focus()`, press Space, wait 1500 ms, and read the view as V2. Record the focused element's `aria-label`.
7. Press Tab once and record the focused element.
### Expected
- [ ] The button got focus in step 3, before any element inside `#panel` (`#search-input` was not focused earlier in the Tab sequence)
- [ ] V1 and V2 each match lat 48.8566, lng 2.3522, zoom 13
- [ ] After Enter and after Space, the focused element's `aria-label` is still "Reset view"
- [ ] After the Tab in step 7, the focused element is an attribution link (`.leaflet-control-attribution a`) or an element inside `#panel`
- [ ] While focused by keyboard, BTN's computed `outline-style` is `solid`, `outline-width` is `2px`, `outline-color` is `rgb(26, 115, 232)` and `outline-offset` is `-2px`

## Scenario 2: Role, name and tooltip (US3 scenario 2, 4; FR-007; SC-004)
### Setup
Common setup, viewport 1280×800.
### Steps
1. Go to http://localhost:8000 and wait for BTN to be visible.
2. Count `page.getByRole("button", { name: "Reset view", exact: true })`.
3. Read BTN's accessibility node with `page.accessibility.snapshot({ root: await BTN.elementHandle() })`.
4. Hover BTN and read its `title` attribute.
5. Read BTN's `textContent`, and check whether it contains an `svg` element with `aria-hidden="true"`.
### Expected
- [ ] The count is 1
- [ ] The accessibility node has role "button" and name "Reset view"
- [ ] `title` is "Reset view"
- [ ] `textContent.trim()` is empty, and an `svg[aria-hidden="true"]` is inside the button
- [ ] Manual spot check (not automated, done once by a person): NVDA with Chrome/Firefox on Windows, or VoiceOver with Safari on macOS, announces "Reset view, button"

## Scenario 3: Size, look and contrast (FR-009, FR-011, FR-013, SC-006)
### Setup
Common setup, viewport 1280×800.
### Steps
1. Go to http://localhost:8000 and wait for BTN to be visible.
2. Read BTN's `boundingBox()` and the `boundingBox()` of the `svg` inside it.
3. Read BTN's computed `background-color` and `color`, and the computed `border` and `border-radius` of its parent `.leaflet-bar`.
4. Hover BTN and read its computed `background-color` again.
5. Click BTN with the mouse, then read its computed `outline-style`.
### Expected
- [ ] BTN's box is at least 44×44
- [ ] The svg's box is 22×22 (±1 px)
- [ ] Default `background-color` is `rgb(255, 255, 255)` and `color` is `rgb(0, 0, 0)`
- [ ] The parent `.leaflet-bar` has a `2px solid rgba(0, 0, 0, 0.2)` border and a `4px` radius
- [ ] Hover `background-color` is `rgb(244, 244, 244)`
- [ ] After a mouse click (no keyboard), `outline-style` is `none` (the focus ring shows only for keyboard focus) and the look is the same as before the click, apart from hover

## Scenario 4: Placement never overlaps the panel or controls (FR-008, FR-012, SC-005, SC-006)
### Setup
Common setup. Stub `https://nominatim.openstreetmap.org/search**`: for the query "Louvre" return 5 results with short names; for "Rue" return 5 results whose `display_name` is 120 characters long (they wrap to two lines); for "Offline" return HTTP 500. Stub `https://routing.openstreetmap.de/**` with the 3 routes from `tests/ai/us2-reset-without-losing-work.md`, and use `geolocation: { latitude: 48.8584, longitude: 2.2945 }` with permission granted for the routes state.
### Steps
1. For each viewport in 360×640, 375×667, 667×375 and 1280×800, and each panel state in (a) 5 results for "Louvre", (b) 3 routes (pick the first "Louvre" result and wait for 3 route buttons), (c) the error status (search "Offline", wait until `#status` contains "Search failed"), (d) 5 long wrapping results for "Rue":
   1. Set the viewport, go to http://localhost:8000, and bring the panel to that state.
   2. Read the boxes of BTN, `#panel`, `.leaflet-control-attribution` and `.leaflet-control-zoom`.
2. Then at 375×667 in state (b), call `page.setViewportSize({ width: 667, height: 375 })` with no reload, wait 500 ms, and read the boxes again.
### Expected
- [ ] In every case, BTN's box is fully inside the viewport
- [ ] In every case, Gap(BTN, #panel) ≥ 8, Gap(BTN, attribution) ≥ 8 and Gap(BTN, zoom control) ≥ 8
- [ ] In every case, `#panel`'s bottom edge (y + height) is ≤ viewport height − 96
- [ ] When the panel's content is taller than its box, `#panel` has `scrollHeight > clientHeight` and its computed `overflow-y` is `auto` or `scroll`
- [ ] After the rotation in step 2, all three checks above still hold

## Scenario 5: The panel scrolls inside and focus scrolls into view (FR-012)
### Setup
Common setup, viewport 667×375, the "Rue" stub from Scenario 4.
### Steps
1. Go to http://localhost:8000, search "Rue", and wait for 5 buttons in `#results`.
2. Scroll the wheel over the panel's center by `deltaY: 400`, and read `#panel.scrollTop` as A.
3. Set `#panel.scrollTop = 0`. Focus `#search-input` and press Tab until the fifth `#results` button is focused.
4. Read the focused button's box and `#panel`'s box.
### Expected
- [ ] A > 0 (the wheel scrolls the panel)
- [ ] The focused fifth result's box is fully inside `#panel`'s box
- [ ] The map view didn't change during the wheel scroll (still lat 48.8566, lng 2.3522, zoom 13)

## Scenario 6: Forced-colors mode (FR-016, SC-007)
### Setup
Common setup, viewport 1280×800, `page.emulateMedia({ forcedColors: "active" })` before loading.
### Steps
1. Go to http://localhost:8000 and wait for BTN to be visible.
2. Add a reference element: `<span id="ref" style="color: ButtonText; background: ButtonFace; outline: 2px solid Highlight">x</span>` to `document.body`, and read its computed `color`, `background-color` and `outline-color`.
3. Read BTN's computed `color` and `background-color`, and the svg's computed `stroke` (or `color`).
4. Focus BTN with Tab (press Tab until it is focused) and read its computed `outline-color` and `outline-style`.
### Expected
- [ ] BTN's `color` equals the reference ButtonText, and its `background-color` equals the reference ButtonFace
- [ ] The svg's stroke color equals the reference ButtonText (the icon is visible)
- [ ] With keyboard focus, `outline-style` is `solid` and `outline-color` equals the reference Highlight

## Scenario 7: 200% browser zoom (FR-017, SC-007)
### Setup
Common setup. Stand in for 200% zoom at 1280×800 with a 640×400 viewport and `deviceScaleFactor: 2`. Use the "Louvre" 5-results stub from Scenario 4.
### Steps
1. Go to http://localhost:8000, search "Louvre", and wait for 5 buttons in `#results`.
2. Read the boxes of BTN, `#panel`, `.leaflet-control-attribution` and `.leaflet-control-zoom`.
3. Set `#panel.scrollTop` to `#panel.scrollHeight` and check that the last `#results` button's box is inside `#panel`'s box.
4. Drag the map from (500, 250) to (300, 150), click BTN, wait 1500 ms, and read the view as V1.
5. Drag the map away again, focus BTN, press Enter, wait 1500 ms, and read the view as V2.
### Expected
- [ ] BTN's box is fully inside the viewport
- [ ] Gap(BTN, #panel) > 0, Gap(BTN, attribution) > 0 and Gap(BTN, zoom control) > 0 (no intersection; no minimum gap at 200%)
- [ ] The last result is reachable: after scrolling, its box is inside `#panel`'s box
- [ ] V1 and V2 each match lat 48.8566, lng 2.3522, zoom 13
