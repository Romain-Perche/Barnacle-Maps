# US2: Use the button with keyboard and assistive technology
Covers: FR-006, FR-008, SC-004, US2 scenario 1, 2

Common setup: `npm start` (http://localhost:8000), headless Playwright with Chromium, denied-location context, load the page and wait 3 s.

## Scenario 1: Reach the button by Tab with a visible focus indicator
### Setup
Fresh page load. Click on an empty part of `#map` is not allowed; start with focus on `<body>`.
### Steps
1. Press Tab repeatedly (at most 25 times) until `document.activeElement` is the "Reset view" button, recording each focused element.
2. Read the button's `aria-label`, `title`, and the accessibility snapshot (`page.accessibility.snapshot()` or `getByRole('button', {name: 'Reset view'})`).
3. Take a screenshot of the focused button and read its computed `outline-style` and `outline-width`.
### Expected
- [ ] The button becomes the active element within 25 Tab presses.
- [ ] `aria-label` is exactly "Reset view".
- [ ] The accessibility tree exposes a button with the name "Reset view".
- [ ] The computed outline is not `none` / width 0 while the button has focus (default focus outline kept).

## Scenario 2: Activate with Enter and Space
### Setup
Fresh page load, location denied.
### Steps
1. Drag the map 300 px and zoom in twice; record the center tile and zoom as MOVED.
2. Tab to the "Reset view" button (as Scenario 1).
3. Press Enter, wait 1.5 s, read the center tile and zoom as AFTER_ENTER.
4. Drag the map away again, focus the button with Tab, press Space, wait 1.5 s, read as AFTER_SPACE.
### Expected
- [ ] AFTER_ENTER shows zoom 13 and the default (Paris) center tile, different from MOVED.
- [ ] AFTER_SPACE shows zoom 13 and the same center tile as AFTER_ENTER.
- [ ] The page did not scroll and the search input did not gain focus.
