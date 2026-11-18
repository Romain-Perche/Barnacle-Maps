# US2: See how far each result is
Covers: FR-006, US2 scenario 1, 2

## Scenario 1: distance column in Design A
### Setup
Same as `tests/ai/us1-nearest-first.md` scenario 1 (Paris position, canned Nominatim data).
### Steps
1. Search "bakery".
2. For each row read the text of the distance element (`#results .distance`) and compare the horizontal positions of the name button, the distance and the "Add as stop" button.
### Expected
- [ ] Every row has a distance text.
- [ ] Texts match the app's format: metres under 1000 ("1234 m" style, e.g. "130 m"), otherwise km with 2 decimals under 10 km and 1 decimal above (e.g. "8.89 km", "131.6 km" style).
- [ ] The first row's text is about "130 m" to "2.00 km" for Vendome, and the distances never decrease down the list.
- [ ] In each row the distance sits to the right of the name and to the left of "Add as stop".
- [ ] The distance x-positions are aligned in one column across rows (right edges equal within 2 px).

## Scenario 2: no distance without position
### Setup
Geolocation denied.
### Steps
1. Search "bakery".
### Expected
- [ ] Rows are listed.
- [ ] `#results .distance` matches zero elements.
