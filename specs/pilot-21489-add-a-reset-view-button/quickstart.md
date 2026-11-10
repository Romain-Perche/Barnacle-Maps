# Quickstart: Validate Reset View

**Prerequisites**: Node 18+, Python 3 (static server), browser.

1. `npm test` — includes `test/view.test.js` (start view defaults, settles once, ignores later updates, returns copies).
2. `npm start`, open http://localhost:8000.
3. **Location denied**: pan/zoom away, click "Reset view" → returns to Paris default (48.8566, 2.3522, z13). Repeat clicks: no change/errors.
4. **Location allowed**: map centres on you at z15; pan/zoom away, click → returns to that view. Move/simulate a new position, click → still the start-up view (not the new position).
5. **Preserved state**: search a place, select a route, switch mode; pan away and click → only the map view changes; input, routes, selection, markers, status unchanged; no new requests in the network tab.
6. **Mid-animation**: select a place (route fit animation) and click immediately → ends at start view within 1 s.
7. **Keyboard/AT**: Tab to the button (visible focus), Enter/Space resets; screen reader announces "Reset view, button".
8. **Mobile width** (~360 px): button visible top-right, not overlapping panel, zoom controls, or attribution.
