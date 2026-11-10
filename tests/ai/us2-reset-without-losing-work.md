# US2: Reset the view without losing work
Covers: FR-004, FR-005, FR-014, SC-003, US2 scenario 1, 2

## Common setup (all scenarios)
- Start the app from the repo root: `npm start` (http://localhost:8000). It needs network access to unpkg.com and tile.openstreetmap.org.
- Headless Chromium with Playwright, viewport 1280×800, `permissions: ["geolocation"]`, `geolocation: { latitude: 48.8584, longitude: 2.2945 }`.
- Use the same `window.__map` init script, "Read the view" and "Press Reset view" as in `tests/ai/us1-return-to-starting-view.md`.
- Stub the network with `page.route` so the results don't depend on live services:
  - `https://nominatim.openstreetmap.org/search**` → 200, JSON `[{"display_name":"Louvre Museum, Rue de Rivoli, Paris","lat":"48.8606","lon":"2.3376"},{"display_name":"Louvre - Rivoli, Paris","lat":"48.8609","lon":"2.3409"},{"display_name":"Place du Louvre, Paris","lat":"48.8597","lon":"2.3412"}]`
  - `https://routing.openstreetmap.de/**` → 200, JSON `{"code":"Ok","routes":[R1,R2,R3]}`, where each route is `{"distance":D,"duration":T,"geometry":{"type":"LineString","coordinates":[[2.2945,48.8584],M,[2.3376,48.8606]]}}` with (D, T, M) = (3300, 2400, [2.31605,48.8595]), (3600, 2600, [2.31605,48.8695]), (3700, 2700, [2.31605,48.8495])
- "Snapshot" means this object, taken with `page.evaluate`:
  `{ input: #search-input value, results: #results innerHTML, routes: #routes innerHTML, status: #status textContent, mode: value of the checked input[name=mode], userMarker: CircleMarker getLatLng(), destMarker: Marker getLatLng(), popupOpen: !!document.querySelector(".leaflet-popup"), popupText: .leaflet-popup-content textContent or null, polylines: number of L.Polyline layers on __map }`.
  (Find markers and polylines with `__map.eachLayer` and `instanceof L.CircleMarker` / `L.Marker` / `L.Polyline`.)

## Scenario 1: Routes, selected route, mode and panel are unchanged after a reset (US2 scenario 1, SC-003)
### Setup
Common setup.
### Steps
1. Go to http://localhost:8000 and wait until the view's zoom is 15. Read the view as START.
2. Fill `#search-input` with "Louvre" and press Enter.
3. Click the first button in `#results` ("Louvre Museum, Rue de Rivoli, Paris").
4. Wait until `#routes` contains 3 buttons.
5. Click the `Car` radio, then wait until `#status` contains "driving".
6. Wait until `#routes` contains at least 2 buttons, then click the second one ("Route 2 …").
7. Scroll the wheel over (1000, 650) by `deltaY: -300` twice to zoom in; wait 1 s.
8. Take a snapshot S0 (no route request is in flight now).
9. Press Reset view.
10. Read the view as V1 and take a snapshot S1.
### Expected
- [ ] V1 matches START (lat 48.8584, lng 2.2945, zoom 15)
- [ ] S1 equals S0 in every field
- [ ] In S1, the second `#routes` button has `aria-pressed="true"` and the others `"false"`
- [ ] In S1, the checked mode is `car`
- [ ] No console error and no page error were recorded

## Scenario 2: Position marker, destination marker and an open popup stay as they were (US2 scenario 2)
### Setup
Common setup.
### Steps
1. Go to http://localhost:8000 and wait until the view's zoom is 15.
2. Call `context.setGeolocation({ latitude: 48.8530, longitude: 2.3499 })` and wait 2 s.
3. Search "Louvre" and click the first result; wait until `#routes` contains 3 buttons, then wait until no `.pleasure` span reads "Pleasure: …" any more (up to 25 s; the walking pleasure score finishes or becomes "Pleasure unavailable"), so nothing changes on its own between the snapshots.
4. Click the destination marker (`.leaflet-marker-icon`) and wait until `.leaflet-popup` exists.
5. Drag the map from (1000, 650) to (700, 450); wait 1 s.
6. Take a snapshot S0.
7. Press Reset view.
8. Read the view as V1 and take a snapshot S1.
### Expected
- [ ] V1 matches lat 48.8584, lng 2.2945, zoom 15 (the first fix, not the current position)
- [ ] S1.userMarker is within 0.000001 of lat 48.8530, lng 2.3499
- [ ] S1.destMarker is within 0.000001 of lat 48.8606, lng 2.3376
- [ ] S1.popupOpen is true and S1.popupText is "Louvre Museum, Rue de Rivoli, Paris"
- [ ] S1 equals S0 in every field

## Scenario 3: A reset while routes are loading doesn't cancel them (FR-014)
### Setup
Common setup, but the routing stub waits 3000 ms before it fulfils (`await new Promise(r => setTimeout(r, 3000))` inside the `page.route` handler). Count calls to the routing stub.
### Steps
1. Go to http://localhost:8000 and wait until the view's zoom is 15.
2. Search "Louvre" and click the first result. Note the time T0.
3. Wait 300 ms (`#status` should say "Computing walking routes…"), then press Reset view and read the view as V1.
4. Wait until `#routes` contains 3 buttons (up to 10 s), then wait 1 s more.
5. Read the view as V2 and `#status` text as S2. Read the routes' bounds: `L.featureGroup(polylines).getBounds()`.
### Expected
- [ ] V1 matches lat 48.8584, lng 2.2945, zoom 15 (the reset happened right away)
- [ ] `#routes` ends up with 3 buttons and S2 contains "walking routes"
- [ ] The routing stub was called, and no request to it was aborted (`request.failure()` is null for each)
- [ ] V2's center is inside the routes' bounds and V2 doesn't match V1 (the app fitted the view to the routes after the reset)
