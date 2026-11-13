# US2: Clear the box after choosing a destination
Covers: FR-002, FR-008, US2 scenario 1, 2

## Scenario 1: Destination, routes and stops stay
### Setup
Run `npm start` (serves http://localhost:8000). Open it in headless Playwright with a 390x844 viewport.
Route the Nominatim search URL to return 2 places (one named "Tour Eiffel"), and the OSRM route URLs (`routing.openstreetmap.de`) to return one route each. Allow geolocation with a fixed position near Paris.
### Steps
1. Type "Eiffel". Wait for `#results li`. Click the first place button.
2. Wait for `#routes li` to appear. Note the count of `#routes li`, whether one is selected, and the marker count on the map.
3. Read whether `#search-clear` is visible and the value of `#search-input`.
4. Click `#search-clear`.
### Expected
- [ ] After step 3, `#search-input` value is "Tour Eiffel" (the destination name) and `#search-clear` is visible.
- [ ] After step 4, `#search-input` value is "" and `#search-clear` is not visible.
- [ ] After step 4, the `#routes li` count and the selected route are the same as in step 2.
- [ ] After step 4, the destination marker is still on the map.
- [ ] After step 4, the checked travel-mode radio is the same as before.

## Scenario 2: Stops stay after clearing
### Setup
Run `npm start` (serves http://localhost:8000). Open it in headless Playwright with a 390x844 viewport.
Same routes as scenario 1.
### Steps
1. Choose a destination as in scenario 1.
2. Type "Eiffel" again, wait for results, click "Add as stop" on the first result.
3. Read whether `#search-clear` is visible. Note the `#stops li` count.
4. Type "Lou" and click `#search-clear`.
### Expected
- [ ] After step 3, `#search-input` value is "" and `#search-clear` is not visible (the app emptied the box).
- [ ] After step 3, `#stops li` count is 1.
- [ ] After step 4, `#stops li` count is still 1 and `#stops-box` is still visible.
