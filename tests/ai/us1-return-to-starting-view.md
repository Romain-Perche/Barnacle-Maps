# US1: Return the map to its starting view
Covers: FR-001, FR-002, FR-003, FR-004, FR-010, FR-014, FR-015, FR-018 (no console errors), SC-001, SC-002, US1 scenario 1, 2, 3

## Common setup (all scenarios)
- Start the app from the repo root: `npm start` (serves http://localhost:8000). It needs network access to unpkg.com (Leaflet) and tile.openstreetmap.org.
- Headless Chromium with Playwright, viewport 1280×800 unless a scenario says otherwise.
- Before `page.goto`, add this init script. It exposes the Leaflet map as `window.__map` for reading the view; the app's code is unchanged:
  ```js
  let _L;
  Object.defineProperty(window, "L", { configurable: true, get: () => _L,
    set(v) { _L = v; v.Map.addInitHook(function () { window.__map = this; }); } });
  ```
- "Read the view" means `page.evaluate(() => ({ lat: __map.getCenter().lat, lng: __map.getCenter().lng, zoom: __map.getZoom() }))`.
- "Matches the view V" means the zoom is equal and lat and lng are each within 0.000001 of V (SC-002).
- "Press Reset view" means `page.getByRole("button", { name: "Reset view" }).click()`, then wait for `__map`'s `moveend` (or 1500 ms if no move was needed).
- Collect `page.on("console")` messages of type `error` and `page.on("pageerror")` events during the whole run.

## Scenario 1: Location denied, reset returns to central Paris at zoom 13
### Setup
Browser context with no geolocation permission (`permissions: []`), so the app's location request is denied.
### Steps
1. Go to http://localhost:8000 and wait until `.leaflet-tile-loaded` exists and `#status` contains "Location unavailable".
2. Read the view and keep it as V0.
3. Drag the map from (900, 600) to (500, 300) with `page.mouse` (down, move in 10 steps, up).
4. Scroll the mouse wheel over (900, 500) by `deltaY: -600` twice, and wait 500 ms.
5. Read the view and keep it as V1.
6. Press Reset view.
7. Read the view and keep it as V2.
### Expected
- [ ] V0 matches lat 48.8566, lng 2.3522, zoom 13
- [ ] V1 doesn't match V0 (the map really moved)
- [ ] V2 matches lat 48.8566, lng 2.3522, zoom 13
- [ ] The button's box (`boundingBox()`) is in the bottom-right quarter of the viewport, and its bottom edge is above the top edge of `.leaflet-control-attribution`
- [ ] No console error and no page error were recorded

## Scenario 2: Location allowed, reset returns to the first fix at zoom 15, not to later positions
### Setup
Browser context with `permissions: ["geolocation"]` and `geolocation: { latitude: 48.8584, longitude: 2.2945 }`.
### Steps
1. Go to http://localhost:8000 and wait until the view's zoom is 15 (poll the view every 100 ms, up to 10 s).
2. Read the view and keep it as V0.
3. Call `context.setGeolocation({ latitude: 48.8530, longitude: 2.3499 })` and wait 2 s.
4. Drag the map from (900, 600) to (400, 300), then scroll the wheel over (900, 500) by `deltaY: 600` once, and wait 500 ms.
5. Press Reset view.
6. Read the view and keep it as V1.
7. Read the blue position marker's position: `page.evaluate(() => { let p; __map.eachLayer(l => { if (l instanceof L.CircleMarker) p = l.getLatLng(); }); return p; })`.
### Expected
- [ ] V0 matches lat 48.8584, lng 2.2945, zoom 15
- [ ] V1 matches lat 48.8584, lng 2.2945, zoom 15 (the first fix, not the new position)
- [ ] The position marker is within 0.000001 of lat 48.8530, lng 2.3499 (it follows the user)
- [ ] No console error and no page error were recorded

## Scenario 3: At the starting view, repeated presses change nothing
### Setup
Same as Scenario 1 (location denied).
### Steps
1. Go to http://localhost:8000 and wait until `#status` contains "Location unavailable".
2. Keep `#status` text as S0 and read the view as V0.
3. Click the Reset view button 5 times in a row with no wait between clicks (`click({ clickCount: 1 })` five times), then wait 1500 ms.
4. Read the view as V1 and `#status` text as S1.
5. Check the button's `disabled` property and `aria-disabled` attribute.
### Expected
- [ ] V1 matches V0 (lat 48.8566, lng 2.3522, zoom 13)
- [ ] S1 equals S0
- [ ] `disabled` is false and `aria-disabled` is absent
- [ ] No console error and no page error were recorded

## Scenario 4: The reset finishes in under 1 s (SC-001)
### Setup
Same as Scenario 1. After the page loads, open a CDP session and send `Emulation.setCPUThrottlingRate` with `{ rate: 4 }`.
### Steps
1. Go to http://localhost:8000 and wait until `#status` contains "Location unavailable".
2. Drag the map from (900, 600) to (600, 400) and scroll the wheel over (900, 500) by `deltaY: -600`; wait 1 s.
3. In one `page.evaluate`, register `__map.once("moveend", …)` that stores `performance.now()` as T1, then store `performance.now()` as T0 and call `document.querySelector('button[aria-label="Reset view"]').click()`.
4. Wait until T1 is set (up to 3 s) and compute T1 − T0.
### Expected
- [ ] T1 is set (a `moveend` happened)
- [ ] T1 − T0 is less than 1000 ms
- [ ] The view then matches lat 48.8566, lng 2.3522, zoom 13

## Scenario 5: Reduced motion gives an instant reset (FR-015)
### Setup
Same as Scenario 1, plus `page.emulateMedia({ reducedMotion: "reduce" })` before loading.
### Steps
1. Go to http://localhost:8000 and wait until `#status` contains "Location unavailable".
2. Drag the map from (900, 600) to (500, 300) and wait 1 s.
3. In one `page.evaluate`, click `button[aria-label="Reset view"]` and, in the same synchronous code right after the click, read the view.
### Expected
- [ ] The view read right after the click (no waiting) already matches lat 48.8566, lng 2.3522, zoom 13

## Scenario 6: Using the button never moves the map by itself (FR-002)
### Setup
Same as Scenario 1.
### Steps
1. Go to http://localhost:8000 and wait until `#status` contains "Location unavailable".
2. Double-click the Reset view button and wait 1 s. Read the view as V1.
3. Move the mouse over the button and scroll the wheel by `deltaY: -600` three times; wait 1 s. Read the view as V2.
4. Press the mouse down on the button's center, move it 150 px left and 150 px up in 10 steps, release it, and wait 1 s. Read the view as V3.
5. Right-click the button, press Escape, and wait 500 ms. Read the view as V4.
### Expected
- [ ] V1, V2, V3 and V4 each match lat 48.8566, lng 2.3522, zoom 13

## Scenario 7: A reset during a glide interrupts it and ends at the starting view (FR-014)
### Setup
Same as Scenario 1.
### Steps
1. Go to http://localhost:8000 and wait until `#status` contains "Location unavailable".
2. Fling the map: mouse down at (900, 500), move to (300, 300) in 3 steps within about 50 ms, release.
3. Within 100 ms of the release, click the Reset view button.
4. Wait 2 s, then read the view.
### Expected
- [ ] The view matches lat 48.8566, lng 2.3522, zoom 13
- [ ] No console error and no page error were recorded

## Scenario 8: A reload starts over; a back/forward restore keeps the starting view (FR-003)
### Setup
Browser context with `permissions: ["geolocation"]` and `geolocation: { latitude: 48.8584, longitude: 2.2945 }`.
### Steps
1. Go to http://localhost:8000 and wait until the view's zoom is 15.
2. Go to `about:blank`, then `page.goBack()`, and wait until `button[aria-label="Reset view"]` is visible.
3. Drag the map from (900, 600) to (400, 300), press Reset view, and read the view as V1.
4. Call `context.setGeolocation({ latitude: 48.8738, longitude: 2.2950 })`, then `page.reload()`, and wait until the zoom is 15.
5. Drag the map away, press Reset view, and read the view as V2.
### Expected
- [ ] V1 matches lat 48.8584, lng 2.2945, zoom 15
- [ ] V2 matches lat 48.8738, lng 2.2950, zoom 15 (the reload took the new first fix)
