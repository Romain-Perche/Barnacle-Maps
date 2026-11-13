# US1: See the selected route's key figures on the map
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-009, FR-010, US1 scenario 1, 2, 3, edge cases "small screens", "walking routes", "card must not intercept map interactions"

## Scenario 1: Bar appears with route 1's figures
### Setup
Shared setup in [README.md](README.md), steps 1–4 (en-GB, 14:10, walking fixture). Viewport 1280×800.
### Steps
1. Open http://localhost:8000.
2. Read whether `#route-card` is visible.
3. Type `Louvre` in the search box, press Go, and click the `Louvre` result.
4. Wait until the panel lists 3 routes.
5. Read the text of `.rc-duration`, `.rc-distance` and `.rc-arrival`, and take a screenshot.
### Expected
- [ ] At step 2, `#route-card` is not visible.
- [ ] After step 4, `#route-card` is visible.
- [ ] `.rc-duration` is `25 min`, `.rc-distance` is `2.35 km`, `.rc-arrival` is `Arrive 14:35`.
- [ ] The visible text order in the bar is duration, distance, arrival.
- [ ] The bar contains no "Pleasure" text.

## Scenario 2: Bar figures equal the panel entry
### Setup
Same as scenario 1, after step 4.
### Steps
1. Read the panel text of the selected route button (`#routes button[aria-pressed="true"]`).
2. Read `.rc-duration` and `.rc-distance`.
### Expected
- [ ] The panel text contains `2.35 km · 25 min`.
- [ ] `.rc-distance` is exactly the panel's distance string and `.rc-duration` is exactly the panel's duration string.

## Scenario 3: Arrival follows the device clock format
### Setup
Shared setup, but create the context with `locale: "en-US"`.
### Steps
1. Search `Louvre` and pick the result.
2. Read `.rc-arrival`.
### Expected
- [ ] `.rc-arrival` is `Arrive 2:35 PM` (any whitespace before `PM`).

## Scenario 4: Next-day arrival
### Setup
Shared setup, but install the clock at `2026-11-13T23:50:00+01:00`.
### Steps
1. Search `Louvre` and pick the result.
2. Read `.rc-arrival`.
### Expected
- [ ] `.rc-arrival` is `Arrive 00:15 +1 day`.

## Scenario 5: Placement and map clicks (Design A)
### Setup
Same as scenario 1, after step 4.
### Steps
1. Get the bounding boxes of `#map`, `#route-card`, `.leaflet-control-attribution` and `.leaflet-control-zoom`.
2. Click the map 60 px left of the bar's left edge, at the bar's vertical centre (no route or marker is there: the map is fitted with extra bottom padding).
3. Read whether a Leaflet popup with the button "Add stop here" is open; close it with Escape.
4. Click the centre of `#route-card`.
5. Read whether a Leaflet popup is open.
### Expected
- [ ] The bar's horizontal centre is within 2 px of the map's horizontal centre.
- [ ] The bar's bottom edge is between 12 px and 60 px above the map's bottom edge.
- [ ] The bar's box does not intersect the attribution box or the zoom control box.
- [ ] `.rc-duration` has computed colour `rgb(26, 115, 232)`.
- [ ] At step 3, the "Add stop here" popup is open.
- [ ] At step 5, no popup is open.

## Scenario 6: Small screen
### Setup
Shared setup with viewport 360×640.
### Steps
1. Search `Louvre` and pick the result.
2. Take a screenshot. Get the bounding boxes of `#route-card`, `.leaflet-control-attribution`, and the destination marker (`.leaflet-marker-icon`).
3. Read the full text of `.rc-duration`, `.rc-distance` and `.rc-arrival`, and their `scrollWidth` and `clientWidth`.
### Expected
- [ ] The bar's left edge is ≥ 0 and its right edge is ≤ 360.
- [ ] For each part, `scrollWidth <= clientWidth` (no figure truncated), and the texts are `25 min`, `2.35 km`, `Arrive 14:35`.
- [ ] The bar does not intersect the attribution box.
- [ ] The bar does not intersect the destination marker box.

## Scenario 7: Readable by assistive technology
### Setup
Same as scenario 1, after step 4.
### Steps
1. Get the ARIA snapshot of the bar: `page.locator('#route-card').ariaSnapshot()`.
2. Read the focused element (`document.activeElement`) before and after the routes appear.
### Expected
- [ ] The snapshot contains a group named `Selected route` that contains the texts `25 min`, `2.35 km` and `Arrive 14:35`.
- [ ] The focused element is not `#route-card` or any element inside it.
