# US3: Cycling routes with stops
Covers: FR-007, US3 scenario 1, 2

Setup for all scenarios: see `tests/ai/README.md`.

## Scenario 1: bike route through two stops added from the map, kept across mode switches
### Setup
`openApp()`. Wait until the blue position marker is drawn.
### Steps
1. Click the map about 150 px left of the position marker. Click "Add stop here" (see README).
2. Click the map about 150 px below the position marker. Click `Add stop here`.
3. Select Bike.
4. Search `Jardin des Plantes`. Wait until routes are ready.
5. Read the last `routing.openstreetmap.de` URL in `log`, the `#stops li` texts and `#status`.
6. Select Car. Wait until routes are ready and `#status` contains `driving`.
7. Select Bike. Wait until routes are ready and `#status` contains `cycling`.
8. Take a screenshot `us3-s1-stops.png`.
### Expected
- [ ] In step 5, the URL starts with `https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.3522,48.8566;`. Next come the coordinates of stop 1 then stop 2, in list order (`#stops li` shows them as `Point on map (lat, lng)`, while the URL puts longitude first). The URL then ends the coordinates with `2.3596,48.844`.
- [ ] `#status` contains `via 2 stops` and `cycling` (or `by bike`).
- [ ] The map shows two numbered stop markers (`1`, `2`), and `#stops li` has 2 items after step 7.
- [ ] After step 7, the last URL is a `routed-bike` URL with the same two stop coordinates in the same order.
