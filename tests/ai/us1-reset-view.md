# US1: Return the map to its starting view
Covers: FR-001, FR-002, FR-002a, FR-003, FR-003a, FR-003b, FR-006, FR-007, SC-001, SC-002, SC-004, US1 scenarios 1, 2, 3, 4, 5, 6, edge cases (before first fix, live updates, repeated presses, mid-animation, reduced motion, open popup)

## Common setup (all scenarios)

- From the repo root, start the app: `npm start` (serves http://localhost:8000). The page loads
  Leaflet from unpkg.com; that host must be reachable.
- Use headless Playwright (Chromium) with a 1280 × 800 viewport unless a scenario says otherwise.
- **Location allowed**: `browser.newContext({ geolocation: { latitude: 45.764, longitude: 4.8357 }, permissions: ["geolocation"] })` (Lyon).
- **Location blocked**: `browser.newContext({ permissions: [] })`. Do not grant geolocation. Wait until
  `#status` contains "Location unavailable" (up to 10 s). If the browser never answers, the map
  stays on the default view, which is fine for these checks.
- **Center tile check** ("the map is centered on tile Z/X/Y"): wait 1 s for the map to settle. Run
  ```js
  const r = document.getElementById("map").getBoundingClientRect();
  document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    .filter(e => e.matches("img.leaflet-tile")).map(e => e.src)
  ```
  The check passes when one of the returned URLs ends with `/Z/X/Y.png`. Tiles have `src` set even
  when tile.openstreetmap.org can't be reached, so this works offline.
  - Starting view with location (Lyon, zoom 15): `/15/16824/11688.png`
  - Fixed default view (Paris, zoom 13): `/13/4149/2818.png`
- **Pan away**: drag the map with the mouse from the map center 300 px left and 200 px up
  (`mouse.move`, `mouse.down`, `mouse.move` in 10 steps, `mouse.up`).
- **Zoom away**: click the Leaflet zoom-out button (`a.leaflet-control-zoom-out`) 3 times, waiting 400 ms between clicks.
- **Press Reset view**: `page.getByRole("button", { name: "Reset view" }).click()`.
- Collect console errors with `page.on("pageerror")` and `page.on("console")` (type "error"), but
  ignore failed tile and network requests.

## Scenario 1: Location found: pan and zoom away, then reset (US1 scenarios 1, 2, 3)
### Setup
Location allowed (Lyon). Open http://localhost:8000.
### Steps
1. Wait until the center tile check passes for `/15/16824/11688.png` (the app centers on Lyon). Wait at most 10 s.
2. Pan away.
3. Zoom away.
4. Check that the center tile check for `/15/16824/11688.png` now fails (the map really moved).
5. Press Reset view and note the time.
6. Run the center tile check for `/15/16824/11688.png`.
### Expected
- [ ] After step 4, the center tile is not `/15/16824/11688.png`
- [ ] After step 6, the center tile is `/15/16824/11688.png` (first fix, zoom 15)
- [ ] No console errors

## Scenario 2: Location blocked: reset goes to Paris, zoom 13 (US1 scenario 4)
### Setup
Location blocked. Open http://localhost:8000.
### Steps
1. Wait until the center tile check passes for `/13/4149/2818.png`.
2. Pan away.
3. Zoom away.
4. Press Reset view.
5. Run the center tile check for `/13/4149/2818.png`.
### Expected
- [ ] After step 5, the center tile is `/13/4149/2818.png`
- [ ] The text of `#status` is the same before and after step 4
- [ ] No console errors

## Scenario 3: Already at the starting view, pressed twice (US1 scenario 5, FR-007)
### Setup
Location blocked. Open http://localhost:8000. Wait until the center tile check passes for `/13/4149/2818.png`.
### Steps
1. Press Reset view.
2. Press Reset view again right away.
3. Run the center tile check for `/13/4149/2818.png`.
### Expected
- [ ] The center tile is `/13/4149/2818.png`
- [ ] No console errors

## Scenario 4: Live position updates don't change the target (FR-002a)
### Setup
Location allowed (Lyon). Open http://localhost:8000. Wait until the center tile check passes for `/15/16824/11688.png`.
### Steps
1. `context.setGeolocation({ latitude: 43.2965, longitude: 5.3698 })` (Marseille). Wait 2 s.
2. Pan away.
3. Press Reset view.
4. Run the center tile check.
### Expected
- [ ] The center tile is `/15/16824/11688.png` (Lyon, the first fix), not `/15/16872/12003.png` (Marseille)

## Scenario 5: Routes, markers and panel are unchanged after reset (US1 scenario 6, FR-003, SC-004)
### Setup
Location allowed (Lyon). Before opening the page, stub the network with `page.route`:
- `https://nominatim.openstreetmap.org/search**` → status 200, JSON
  `[{"display_name":"Parc de la Tête d'Or, Lyon","lat":"45.7772","lon":"4.8550"}]`
- `https://routing.openstreetmap.de/**` → status 200, JSON
  `{"code":"Ok","routes":[{"distance":2100,"duration":1500,"geometry":{"coordinates":[[4.8357,45.764],[4.845,45.770],[4.855,45.7772]]}},{"distance":2400,"duration":1700,"geometry":{"coordinates":[[4.8357,45.764],[4.840,45.775],[4.855,45.7772]]}}]}`
- `https://tile.openstreetmap.org/**` → abort (so that pleasure shows "Pleasure unavailable" and stays fixed)

Open http://localhost:8000. Wait until the center tile check passes for `/15/16824/11688.png`.
### Steps
1. Type "Parc" into `#search-input` and press Enter.
2. Click the first button in `#results`.
3. Wait until `#routes` has 2 `button` elements and each `.pleasure` text no longer contains "…" (at most 25 s).
4. Click the second button in `#routes` (Route 2).
5. Click the destination marker (`.leaflet-marker-icon`) so that its popup opens.
6. Record: `#search-input` value; `#results` innerHTML; `#routes` innerHTML; `#status` text; the checked `input[name=mode]` value; the number of `path.leaflet-interactive` elements, with each one's `stroke` attribute; the number of `.leaflet-marker-icon` elements; whether a `.leaflet-popup` is present and its text.
7. Pan away.
8. Press Reset view.
9. Wait 1 s, then record the same values again.
10. Run the center tile check for `/15/16824/11688.png`.
### Expected
- [ ] Every value recorded in step 9 is the same as in step 6 (search input, results, route list including `aria-pressed="true"` on Route 2, status, mode, route lines and their colours, markers, popup present with the same text)
- [ ] The center tile is `/15/16824/11688.png`

## Scenario 6: Reset is quick, even after repeated presses and mid-animation (SC-001, SC-002, CHK027)
### Setup
Location allowed (Lyon). Open http://localhost:8000. Wait until the center tile check passes for `/15/16824/11688.png`.
### Steps
1. Pan away.
2. Press Reset view 5 times in a row with no wait.
3. Wait 1 s after the last press, then run the center tile check.
4. Move the mouse to the map center and send `mouse.wheel(0, -500)` (zoom in), then press Reset view immediately, with no wait.
5. Wait 1 s, then run the center tile check.
6. Pan away. Press Reset view. Every 100 ms for 1.5 s, read the CSS `transform` of `.leaflet-map-pane` and note the first moment it stops changing.
### Expected
- [ ] After step 3, the center tile is `/15/16824/11688.png`
- [ ] After step 5, the center tile is `/15/16824/11688.png`
- [ ] In step 6, the transform stops changing within 1000 ms of the press
- [ ] No console errors

## Scenario 7: Reset before the first fix, then the fix arrives (edge case, FR-003b, CHK016)
### Setup
Location allowed (Lyon). Before opening the page, hold back location fixes with
`page.addInitScript`:
```js
const real = navigator.geolocation.watchPosition.bind(navigator.geolocation);
let held = [];
window.__releaseFix = () => { held.forEach(f => f()); held = null; };
navigator.geolocation.watchPosition = (ok, err, opts) =>
  real((pos) => (held ? held.push(() => ok(pos)) : ok(pos)), err, opts);
```
Open http://localhost:8000. Wait until the center tile check passes for `/13/4149/2818.png`.
### Steps
1. Pan away.
2. Press Reset view, wait 1 s, and run the center tile check for `/13/4149/2818.png`.
3. Run `window.__releaseFix()` in the page. Wait 1 s and run the center tile check for `/15/16824/11688.png`.
4. Pan away.
5. Press Reset view.
6. Wait 1 s and run the center tile check for `/15/16824/11688.png`.
### Expected
- [ ] After step 2, the center tile is `/13/4149/2818.png` (no fix yet → default view)
- [ ] After step 3, the center tile is `/15/16824/11688.png` (the map still jumps to the first fix)
- [ ] After step 6, the center tile is `/15/16824/11688.png` (the first fix is now the target)

## Scenario 8: Gestures on the button don't act on the map (FR-003a, CHK024)
### Setup
Use Scenario 5's setup and its steps 1–3 (two routes drawn, Route 1 selected). Then press Reset view once and wait 1 s.
### Steps
1. Read `aria-pressed` of the two `#routes button` elements, and the center tile `src` (center tile check).
2. Double-click the Reset view button. Wait 1 s.
3. Move the mouse over the Reset view button and send `mouse.wheel(0, -300)`. Wait 1 s.
4. Press the mouse on the button, move it 100 px left, release. Wait 1 s.
5. Read the `aria-pressed` values and the center tile `src` again.
### Expected
- [ ] The `aria-pressed` values in step 5 are the same as in step 1 (Route 1 still selected)
- [ ] The center tile `src` in step 5 is the same as in step 1 (no zoom or pan)

## Scenario 9: Reduced motion: the map jumps without animation (CHK030)
### Setup
Location blocked. Create the page with `reducedMotion: "reduce"` (`browser.newContext({ reducedMotion: "reduce", permissions: [] })`). Open http://localhost:8000 and wait until the center tile check passes for `/13/4149/2818.png`.
### Steps
1. Click the zoom-out button 2 times, waiting 500 ms between clicks.
2. Press Reset view. 50 ms after the press, read whether `#map` or `.leaflet-map-pane` has the class `leaflet-zoom-anim`.
3. Run the center tile check for `/13/4149/2818.png` 100 ms after the press (no 1 s wait).
### Expected
- [ ] In step 2, neither `#map` nor `.leaflet-map-pane` has the class `leaflet-zoom-anim`
- [ ] In step 3, the center tile is `/13/4149/2818.png`
