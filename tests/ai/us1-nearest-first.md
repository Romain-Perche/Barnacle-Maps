# US1: Nearest place listed first
Covers: FR-001, FR-002, FR-003, FR-005, FR-008, FR-009, US1 scenario 1, 2, 4, 5, 6

## Scenario 1: results sorted with a known position
### Setup
Run `npm start` (http://localhost:8000). Open it in headless Playwright with geolocation granted and set to lat 48.8566, lng 2.3522 (Paris). Record every request to `nominatim.openstreetmap.org/search`. If Nominatim is not reachable, route those requests to a canned `jsonv2` array of 3 places: Reims (49.2583, 4.0317), Saint-Denis (48.9362, 2.3574), Vendome (48.8675, 2.3294), in that order.
### Steps
1. Wait until the map shows the user's position.
2. Type "bakery" in the search box and press Enter.
3. Read the result rows' names and distance texts.
### Expected
- [ ] The request URL for the search contains a `viewbox=` parameter and does not contain `bounded=1`.
- [ ] The request URL still contains `limit=5`.
- [ ] With the canned data, the rows are in the order Vendome, Saint-Denis, Reims.
- [ ] No more than 5 rows are listed.

## Scenario 2: suggestions while typing are sorted too
### Setup
Same as scenario 1.
### Steps
1. Type "bak" (3+ characters) without pressing Enter and wait 1 second.
2. Read the rows.
### Expected
- [ ] Rows appear without submitting.
- [ ] The suggestion request contains `viewbox=`.
- [ ] Rows are in the same nearest-first order as scenario 1.

## Scenario 3: actions apply to the clicked row after sorting
### Setup
Same as scenario 1 (canned data, so Reims is first in the service order but last on screen).
### Steps
1. Search "bakery".
2. Click "Add as stop" on the last row (Reims).
### Expected
- [ ] The stops list shows "Reims" (the clicked row's place), not the first service result.
- [ ] The result list is cleared.

## Scenario 4: no known position
### Setup
Open the app with geolocation denied (Playwright permissions empty).
### Steps
1. Search "bakery".
### Expected
- [ ] The search request URL has no `viewbox` parameter.
- [ ] Rows appear in the service's original order (Reims, Saint-Denis, Vendome with canned data).
- [ ] Search still works and no row shows a distance.
