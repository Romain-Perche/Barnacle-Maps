# Quickstart: validation

1. `npm test` — new tests in `test/geo.test.js` must pass: viewbox present only with position, no `bounded=1`; sort ascending; ties stable; null position unchanged.
2. `npm start`, open http://localhost:8000, allow location (or use browser devtools Sensors to set a position, e.g. Paris).
3. Search "bakery": nearest result first, distances non-decreasing, each shown right of the name before "Add as stop" (SC-001/002, US2).
4. Type 3+ characters: suggestions are sorted and show distances too (FR-002).
5. Search a far unique place (e.g. "Eiffel Tower" from another country): still returned (FR-008).
6. Deny location and search: original order, no distances (FR-004/009).
7. Click a row's name and "Add as stop" on a non-first row: route/stop matches that row (FR-005).
