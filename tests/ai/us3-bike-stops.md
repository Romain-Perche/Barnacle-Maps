# US3: Cycling routes with stops
Covers: FR-008, FR-009, US3 scenario 1, 2

Setup: the common setup in `tests/ai/README.md`, with `installFakes(page)`.

## Scenario 1: Bike route through 2 stops in list order, stops kept across mode changes
Covers: FR-009, FR-008, US3 scenario 1, 2
### Setup
Common setup.
### Steps
1. Type "Tour Eiffel" in `#search-input`, press Enter, and click the "Add as stop" button of the first result.
2. Click the map at viewport point (900, 450) (the map is centred on the start at zoom 15; the panel is top-left),
   then click "Add stop here" in the popup.
3. Read the text of every `#stops li .stop-name`.
4. Click the "Bike" label, then choose "Jardin du Luxembourg". Wait for `#routes li`.
5. Read the last `log.osrm` entry with `server: "bike"`, and `#status`.
6. Click the "Walk" label, wait for `#routes li`, then click the "Bike" label and wait for `#routes li`.
7. Read the text of every `#stops li .stop-name` again.
### Expected
- [ ] At step 3, there are 2 stops: the first starts with "1. Tour Eiffel", the second starts with "2. Point on map".
- [ ] At step 5, the request coordinates are, in this order: the start `[2.3499, 48.853]`, the Tour Eiffel
      `[2.2945, 48.8584]`, the map point (equal, to 5 decimals, to the `(lat, lng)` in the second stop's name, as `[lng, lat]`), then the destination `[2.3372, 48.8462]`.
- [ ] At step 5, `#status` contains "by bike via 2 stops" or "cycling routes via 2 stops".
- [ ] At step 7, the stop names are the same as at step 3, in the same order.
- [ ] No `log.osrm` bike request has more coordinates than 4 (no forced detour with stops).
