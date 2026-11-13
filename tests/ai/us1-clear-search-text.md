# US1: Clear the search text in one tap
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-010, FR-011, US1 scenario 1, 2, 3, 4, 5

## Scenario 1: Button follows the box content
### Setup
Run `npm start` (serves http://localhost:8000). Open it in headless Playwright with a 390x844 viewport.
### Steps
1. Load the page. Read whether `#search-clear` is visible.
2. Type "E" into `#search-input`.
3. Press Backspace once.
4. Paste "   " (3 spaces) into the box.
### Expected
- [ ] After step 1, `#search-clear` is not visible.
- [ ] After step 2, `#search-clear` is visible and shows "×".
- [ ] After step 3, `#search-clear` is not visible.
- [ ] After step 4, `#search-clear` is visible.

## Scenario 2: Clear after suggestions appear
### Setup
Same as scenario 1. Nominatim must be reachable; if it is not, route `**/nominatim.openstreetmap.org/**` in Playwright to return a JSON array with 3 places.
### Steps
1. Type "Eiffel" into `#search-input`. Wait up to 5 s for `#results li` to appear.
2. Click `#search-clear`.
3. Without clicking the box, type "Lou".
### Expected
- [ ] After step 1, `#results li` count is 1 or more.
- [ ] After step 2, `#search-input` value is "".
- [ ] After step 2, `#results li` count is 0.
- [ ] After step 2, `#search-clear` is not visible.
- [ ] After step 2, `document.activeElement` is `#search-input`.
- [ ] After step 3, `#search-input` value is "Lou".

## Scenario 3: Clear cancels a pending or in-flight search
### Setup
Same as scenario 1. Route the Nominatim search URL in Playwright to answer after a 3 s delay with 3 places.
### Steps
1. Type "Eiffel". Wait 600 ms (the request is now in flight).
2. Click `#search-clear`.
3. Wait 4 s.
4. Type "Ei", then click `#search-clear` within 200 ms (before the 500 ms typing pause ends). Wait 4 s.
### Expected
- [ ] After step 3, `#results li` count is 0.
- [ ] After step 4, `#results li` count is 0.
- [ ] After step 4, `#status` text is "".

## Scenario 4: Clear removes the status message
### Setup
Same as scenario 1. Route the Nominatim search URL to return `[]`.
### Steps
1. Type "zzzzzz" and press Enter (submit the form). Wait for `#status` to show text.
2. Click `#search-clear`.
### Expected
- [ ] After step 1, `#status` text is "No results.".
- [ ] After step 2, `#status` text is "".
- [ ] After step 2, `#search-input` value is "".

## Scenario 5: Long text and one clear control
### Setup
Same as scenario 1. Run it once each in Chromium, Firefox and WebKit if installed.
### Steps
1. Type 80 characters of "a" into `#search-input`.
2. Read the bounding boxes of `#search-clear` and `#search-input`.
3. Count visible clear controls in the search box (`#search-clear` plus any native control; screenshot the box).
### Expected
- [ ] `#search-clear` width and height are each 24 px or more.
- [ ] `#search-clear` is fully inside the `#search-input` bounding box.
- [ ] The input has a right padding of 28 px or more (`getComputedStyle`).
- [ ] The screenshot shows exactly one ×.
- [ ] Clicking `#search-clear` does not reload the page and does not call the search URL.
