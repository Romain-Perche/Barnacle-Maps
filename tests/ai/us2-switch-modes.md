# US2: Switch between walk, bike and car
Covers: FR-006, US2 scenario 1, 2, 3

Setup for all scenarios: see `tests/ai/README.md`.

## Scenario 1: Walk -> Bike -> Car -> Bike on the real map, without a new search
### Setup
`openApp()`.
### Steps
1. Search `Jardin des Plantes` (Walk is selected). Wait until routes are ready. Note the number of `nominatim` URLs in `log`.
2. Select Bike. Wait until routes are ready and `#status` contains `cycling`.
3. Select Car. Wait until routes are ready and `#status` contains `driving`.
4. Select Bike. Wait until routes are ready and `#status` contains `cycling`.
5. After each of steps 1–4: count the route lines (`path.leaflet-interactive` with stroke `#888` or `#1a73e8`), count the `#routes .pleasure` elements, and read the position of the `.leaflet-marker-icon` (its style transform).
### Expected
- [ ] The `routing.openstreetmap.de` URLs in `log` start, in order, with `routed-foot`, `routed-bike`, `routed-car`, `routed-bike`. All of them have the same destination, `2.3596,48.844`.
- [ ] The number of `nominatim` URLs does not change after step 1.
- [ ] After each step, the map has as many route lines as there are `#routes button` elements (old lines are removed).
- [ ] The destination marker stays at the same place in steps 1–4, and `#search-input` still reads `Jardin des Plantes, Paris, France`.
- [ ] After step 3 there is no `.pleasure` element. After steps 2 and 4 there is one per route.

## Scenario 2: quick clicks keep only the last mode
### Setup
`openApp({ osrmDelayMs: 800 })`.
### Steps
1. Search `Jardin des Plantes`. Wait until routes are ready.
2. Click Bike, Car, Bike, Car, each within 100 ms of the previous click.
3. Wait 4 s.
### Expected
- [ ] `#mode input:checked` is `car` and only the Car segment is highlighted.
- [ ] `#status` starts with `3 driving routes` or ends with `by car`.
- [ ] There is no `.pleasure` element, and the map has as many route lines as there are `#routes button` elements.
