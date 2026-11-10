# US2: Use the button with keyboard and assistive technology
Covers: FR-002, FR-007, FR-008, SC-005, US2 scenario 1, 2, 3

## Scenario 1: Keyboard focus and activation
### Setup
`npm start`, open http://localhost:8000 in headless Playwright Chromium, geolocation denied. Pan/zoom the map away from the default view.
### Steps
1. Press Tab repeatedly until the "Reset view" button has focus (at most 30 presses); record the order in which focused elements were visited.
2. Take a screenshot and read the computed `outline` / `box-shadow` of the focused button.
3. Press Enter; wait for the map to stop moving.
4. Pan the map away again, focus the button again, press Space; wait for the map to stop moving.
### Expected
- [ ] The button receives focus within 30 Tab presses
- [ ] The focused button has a non-empty, non-`none` outline or box-shadow
- [ ] The tab order follows page order (search panel controls come before the map controls)
- [ ] After Enter the map shows 48.8566, 2.3522 at zoom 13
- [ ] After Space the map shows 48.8566, 2.3522 at zoom 13

## Scenario 2: Accessible name, role and size
### Setup
Same as scenario 1.
### Steps
1. Read the accessibility tree entry of the button (`page.accessibility.snapshot()` or `getByRole("button", { name: "Reset view" })`).
2. Read its `title`, `aria-label`, visible text and bounding box.
3. Set the viewport to 320 x 640 and read the bounding boxes of the button, the search panel, the zoom control and the attribution.
### Expected
- [ ] `getByRole("button", { name: "Reset view" })` finds exactly one element
- [ ] `title`, `aria-label` and visible text are all exactly "Reset view"
- [ ] The button height is at least 44 px
- [ ] At 320 px wide the button is fully inside the viewport and its box does not intersect the panel, zoom control or attribution boxes
- [ ] Contrast between the button text colour and its background is at least 4.5:1
