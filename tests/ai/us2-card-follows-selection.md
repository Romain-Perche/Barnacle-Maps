# US2: Card follows the route the user picks
Covers: FR-006, FR-010, US2 scenario 1, 2, 3, SC-002

## Scenario 1: Select route 2 in the panel
### Setup
Shared setup in [README.md](README.md) (en-GB, 14:10, walking fixture with 3 routes). Search `Louvre` and pick the result.
### Steps
1. Click the panel button whose text starts with `Route 2`.
2. Read `.rc-duration`, `.rc-distance`, `.rc-arrival` and `#route-card-live`.
### Expected
- [ ] `.rc-duration` is `29 min`, `.rc-distance` is `2.60 km`, `.rc-arrival` is `Arrive 14:39`.
- [ ] `#route-card-live` text starts with `Route 2:` and contains `29 min` and `2.60 km`.
- [ ] `#route-card-live` has `aria-live="polite"`.
- [ ] `document.activeElement` is the `Route 2` panel button (focus was not moved to the bar).

## Scenario 2: Click route 3 on the map
### Setup
Same as scenario 1, after step 2.
### Steps
1. Find the drawn route lines (`path.leaflet-interactive` inside `#map`) that are grey (stroke `#888`).
2. Click a point on the diagonal line between start and destination (route 3: through 48.855, 2.355). Use `map.latLngToContainerPoint` via `page.evaluate` if needed, or click the grey path that is not the one for route 1.
3. Read `.rc-duration`, `.rc-distance`, `.rc-arrival` and the selected panel button.
### Expected
- [ ] The panel button `Route 3` has `aria-pressed="true"`.
- [ ] `.rc-duration` is `35 min`, `.rc-distance` is `3.00 km`, `.rc-arrival` is `Arrive 14:45`.
- [ ] No "Add stop here" popup is open.

## Scenario 3: Re-select the same route
### Setup
Same as scenario 1, after step 2.
### Steps
1. Read the text of `#route-card`.
2. Click the `Route 2` panel button again.
3. Read the text of `#route-card`.
### Expected
- [ ] The texts at steps 1 and 3 are identical.
- [ ] `#route-card` is still visible.
