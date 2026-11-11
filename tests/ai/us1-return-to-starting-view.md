# US1: Return to the starting view in one click
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-007, FR-008, FR-010, SC-001, SC-002, SC-003, US1 scenario 1, 2, 3, 4, 5, Edge cases (live updates, quick presses, during animation, reset before first fix, small screens, location fails after first fix, resize, computation in progress, pan before first fix, destination before first fix)

## Common setup (used by every scenario below)

1. Serve the app from the repo root: `npm start` (http://localhost:8000). Leaflet loads from `unpkg.com`;
   if the VM cannot reach it, report the run as an environment failure, not an app failure.
2. Headless Chromium with Playwright, viewport 1280×800, `hasTouch: false`, unless a scenario says otherwise.
3. Stub the network with `page.route` before `page.goto`, so results do not depend on live services:
   - `**/tile.openstreetmap.org/**` → status 200, `content-type: image/png`, body = base64
     `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC` (1×1 white PNG).
   - `**/nominatim.openstreetmap.org/search**` → status 200, JSON
     `[{"display_name":"Parc de la Tête d'Or, Lyon","lat":"45.7772","lon":"4.8550"},{"display_name":"Place Bellecour, Lyon","lat":"45.7578","lon":"4.8320"}]`
   - `**/routing.openstreetmap.de/**` → status 200, JSON
     `{"code":"Ok","routes":[{"distance":2100,"duration":1500,"geometry":{"coordinates":[[4.8357,45.764],[4.845,45.77],[4.855,45.7772]]}},{"distance":2400,"duration":1750,"geometry":{"coordinates":[[4.8357,45.764],[4.84,45.775],[4.855,45.7772]]}}]}`
4. Add this probe with `page.addInitScript` before `page.goto`. It replaces the browser geolocation with a
   controllable fake (no position until the test calls `__fix`) and exposes the Leaflet map as `window.__map`:

   ```js
   window.__geo = { calls: 0, ok: [], err: [] };
   const fakeGeo = {
     watchPosition(ok, err) { __geo.calls++; __geo.ok.push(ok); __geo.err.push(err); return __geo.calls; },
     getCurrentPosition(ok, err) { __geo.calls++; __geo.ok.push(ok); __geo.err.push(err); },
     clearWatch() {},
   };
   Object.defineProperty(navigator, "geolocation", { configurable: true, get: () => fakeGeo });
   window.__fix = (lat, lng) =>
     __geo.ok.forEach((f) => f({ coords: { latitude: lat, longitude: lng, accuracy: 5 } }));
   window.__fixError = () => __geo.err.forEach((f) => f && f({ code: 1, message: "denied" }));
   let _L;
   Object.defineProperty(window, "L", {
     configurable: true,
     get: () => _L,
     set(v) { _L = v; v.Map.addInitHook(function () { window.__map = this; }); },
   });
   // true when the map is at exactly this zoom and its center is within 1 screen pixel of (lat, lng)
   window.__at = (lat, lng, zoom) => {
     const m = window.__map, z = m.getZoom();
     return z === zoom && m.project(m.getCenter(), z).distanceTo(m.project([lat, lng], z)) <= 1;
   };
   ```
5. After `page.goto("http://localhost:8000")`, wait until `window.__map` exists and `__geo.calls >= 1`.
6. Collect `console` messages of type `error` and `pageerror` events for the whole scenario.
7. Names used below:
   - **Reset** = `page.getByRole("button", { name: "Reset view" })`, clicked with `.click()`.
   - **FIX** = (45.764, 4.8357) Lyon; **FIX2** = (43.2965, 5.3698) Marseille; **PARIS** = (48.8566, 2.3522).
   - **Pan away** = `page.mouse.move(900, 400)`, `page.mouse.down()`, `page.mouse.move(600, 250, { steps: 10 })`,
     `page.mouse.up()`, then `page.mouse.wheel(0, -300)` over (900, 400), then wait 600 ms.
   - **Wait at start(lat, lng, z)** = `page.waitForFunction(([a, b, c]) => __at(a, b, c), [lat, lng, z], { timeout: 1000 })`,
     with the time measured from just before the click to when it resolves.

## Scenario 1: Reset after panning returns to the first-fix view (location found)
Covers US1 scenario 1, 4, FR-002, FR-003, SC-001, SC-002
### Setup
Common setup.
### Steps
1. `page.evaluate(() => __fix(45.764, 4.8357))`.
2. Wait until `__at(45.764, 4.8357, 15)` is true.
3. Pan away.
4. Evaluate `__at(45.764, 4.8357, 15)` and record it.
5. Click Reset, then Wait at start(45.764, 4.8357, 15).
### Expected
- [ ] Step 4 returned `false` (the map really moved away).
- [ ] After step 5, `__map.getZoom()` is 15 and `__at(45.764, 4.8357, 15)` is `true`.
- [ ] The wait in step 5 resolved in ≤ 1000 ms.
- [ ] No console error or page error was recorded.

## Scenario 2: Location denied → reset goes to Paris at zoom 13
Covers US1 scenario 5, FR-003
### Setup
Common setup.
### Steps
1. `page.evaluate(() => __fixError())`.
2. Pan away.
3. Click Reset, then Wait at start(48.8566, 2.3522, 13).
### Expected
- [ ] `__at(48.8566, 2.3522, 13)` is `true` after step 3, reached in ≤ 1000 ms.
- [ ] `#status` text is "Location unavailable. Allow location access to get directions." both before and after step 3.

## Scenario 3: Reset when already at the starting view changes nothing
Covers US1 scenario 2, FR-001 (always enabled), FR-005
### Setup
Common setup.
### Steps
1. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)`.
2. Record: `#panel` `outerHTML`, `#search-input` value, number of `.leaflet-marker-icon`, number of `.leaflet-overlay-pane path`.
3. Check the Reset button's `disabled` property.
4. Click Reset; wait 500 ms.
5. Record the same values as in step 2.
### Expected
- [ ] In step 3, `disabled` is `false`.
- [ ] After step 4, `__at(45.764, 4.8357, 15)` is `true`.
- [ ] Every value from step 5 equals the value from step 2.
- [ ] No console error or page error was recorded.

## Scenario 4: Reset with routes shown changes only the view
Covers US1 scenario 3, FR-005, SC-003
### Setup
Common setup.
### Steps
1. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)`.
2. Fill `#search-input` with "Tete d'Or", press Enter, wait until `#results button` count is 2.
3. Click the `#results` button "Parc de la Tête d'Or, Lyon".
4. Wait until `#routes button` count is 2 and every `.pleasure` text no longer ends with "…".
5. Click the second `#routes button` ("Route 2 …").
6. Click the destination marker (`.leaflet-marker-icon`) and wait until `.leaflet-popup` is visible.
7. Pan away.
8. Record: `#search-input` value, `#panel` `outerHTML`, checked `input[name=mode]` value, `aria-pressed` of each `#routes button`,
   `#status` text, number of `.leaflet-marker-icon`, number of `.leaflet-popup`, list of `stroke` attributes of `.leaflet-overlay-pane path`.
9. Click Reset, then Wait at start(45.764, 4.8357, 15).
10. Record the same values as in step 8.
### Expected
- [ ] `__at(45.764, 4.8357, 15)` is `true` after step 9.
- [ ] Every value from step 10 equals the value from step 8.
- [ ] After step 10, the second `#routes button` has `aria-pressed="true"` and the first has `"false"`.
- [ ] After step 10, `#search-input` value is "Parc de la Tête d'Or, Lyon", the checked mode is `foot`, and one `.leaflet-popup` containing "Parc de la Tête d'Or, Lyon" is shown.

## Scenario 5: Search results stay listed after a reset
Covers US1 scenario 3 (search results), FR-005
### Setup
Common setup.
### Steps
1. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)`.
2. Fill `#search-input` with "Lyon", press Enter, wait until `#results button` count is 2.
3. Pan away.
4. Record `#results` `innerHTML` and `#search-input` value.
5. Click Reset, then Wait at start(45.764, 4.8357, 15).
### Expected
- [ ] After step 5, `#results` `innerHTML` and `#search-input` value equal the values from step 4.
- [ ] After step 5, `#results button` count is 2.

## Scenario 6: Later location updates do not move the starting view
Covers FR-004, Edge case "location found again later"
### Setup
Common setup.
### Steps
1. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)`.
2. `__fix(43.2965, 5.3698)`; wait 300 ms.
3. Pan away.
4. Click Reset, then Wait at start(45.764, 4.8357, 15).
### Expected
- [ ] After step 2, `__at(45.764, 4.8357, 15)` is still `true` (the live update did not move the map).
- [ ] After step 4, `__at(45.764, 4.8357, 15)` is `true` and `__at(43.2965, 5.3698, 15)` is `false`.

## Scenario 7: Location fails after a successful first fix
Covers FR-004, Edge case "location fails after a first fix"
### Setup
Common setup.
### Steps
1. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)`.
2. `__fixError()`.
3. Pan away.
4. Click Reset, then Wait at start(45.764, 4.8357, 15).
### Expected
- [ ] After step 4, `__at(45.764, 4.8357, 15)` is `true`.

## Scenario 8: Reset during the route zoom animation and 5 quick presses
Covers Edge cases "several times quickly", "while the map is still animating", SC-001
### Setup
Common setup.
### Steps
1. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)`.
2. Fill `#search-input` with "Tete d'Or", press Enter, wait for 2 `#results button`.
3. Click "Parc de la Tête d'Or, Lyon", then wait until `#routes button` count is 2 and click Reset immediately (no extra wait).
4. Wait at start(45.764, 4.8357, 15), with timeout 1500 ms.
5. Pan away.
6. Click Reset 5 times in a row with `{ delay: 0 }` and no wait between clicks.
7. Wait at start(45.764, 4.8357, 15), then wait 500 ms more.
### Expected
- [ ] Step 4 resolves (the map ends at the starting view, not at the routes' bounds).
- [ ] After step 7, `__at(45.764, 4.8357, 15)` is still `true`.
- [ ] No console error or page error was recorded.

## Scenario 9: Reset never requests a location fix
Covers FR-008
### Setup
Common setup.
### Steps
1. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)`.
2. Record `__geo.calls`.
3. Pan away, click Reset, pan away, click Reset; wait 500 ms.
4. Record `__geo.calls` again.
### Expected
- [ ] The value from step 4 equals the value from step 2.

## Scenario 10: Reset before the first fix, then the fix arrives
Covers FR-003, Edge case "presses Reset before the user location is known"
### Setup
Common setup.
### Steps
1. Without calling `__fix`, pan away.
2. Click Reset, then Wait at start(48.8566, 2.3522, 13).
3. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)` (timeout 2000 ms).
4. Pan away.
5. Click Reset, then Wait at start(45.764, 4.8357, 15).
### Expected
- [ ] Step 2 resolves: the map is at Paris, zoom 13.
- [ ] Step 3 resolves: the first fix still centers the map on the user at zoom 15.
- [ ] Step 5 resolves: the reset now goes to the first-fix view.

## Scenario 11: User pans before the first fix
Covers FR-003, Edge case "pans or zooms before the first location fix"
### Setup
Common setup.
### Steps
1. Without calling `__fix`, pan away.
2. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)` (timeout 2000 ms).
3. Pan away.
4. Click Reset, then Wait at start(45.764, 4.8357, 15).
### Expected
- [ ] Step 2 resolves: the fix overrides the manual view and centers on the user at zoom 15.
- [ ] Step 4 resolves.

## Scenario 12: Destination picked before the first fix
Covers FR-003, Edge case "picks a destination before the first location fix"
### Setup
Common setup.
### Steps
1. Without calling `__fix`, fill `#search-input` with "Tete d'Or", press Enter, wait for 2 `#results button`.
2. Click "Parc de la Tête d'Or, Lyon"; wait until `__at(45.7772, 4.855, 15)`.
3. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)` (timeout 2000 ms).
4. Pan away.
5. Click Reset, then Wait at start(45.764, 4.8357, 15).
### Expected
- [ ] Step 2 resolves (the map is on the destination).
- [ ] Step 3 resolves (the first fix moves the map to the user at zoom 15).
- [ ] Step 5 resolves (the reset goes to the first-fix view, not the destination).
- [ ] After step 5, one `.leaflet-marker-icon` (the destination marker) is still shown.

## Scenario 13: A route computation in progress is not cancelled
Covers FR-005, Edge case "route or pleasure computation still in progress"
### Setup
Common setup, but the `**/routing.openstreetmap.de/**` stub waits 1500 ms before it fulfills.
### Steps
1. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)`.
2. Fill `#search-input` with "Tete d'Or", press Enter, wait for 2 `#results button`.
3. Click "Parc de la Tête d'Or, Lyon".
4. While `#status` reads "Computing walking routes…", click Reset.
5. Wait until `#routes button` count is 2 (timeout 5000 ms).
### Expected
- [ ] In step 4, `#status` text was "Computing walking routes…" when Reset was clicked.
- [ ] Step 5 resolves: 2 routes are listed, and `#status` starts with "2 walking routes".

## Scenario 14: Reduced motion → reset jumps with no animation
Covers FR-010
### Setup
Common setup, then `page.emulateMedia({ reducedMotion: "reduce" })` before `page.goto`.
### Steps
1. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)`.
2. Pan away.
3. In one `page.evaluate`: `let anim = 0; __map.on("zoomanim", () => anim++); document.querySelector(".reset-view-control button").click(); return { at: __at(45.764, 4.8357, 15), anim, panning: !!document.querySelector(".leaflet-pan-anim, .leaflet-zoom-anim") };`
### Expected
- [ ] Step 3 returns `at: true` (the view was reached synchronously, with no animation).
- [ ] Step 3 returns `anim: 0` and `panning: false`.

## Scenario 15: Placement on desktop and small screens; resize keeps the starting view
Covers FR-001, FR-007, Edge cases "small screens", "viewport resized or rotated"
### Setup
Common setup. Run the steps three times: viewport 1280×800, 360×640, 320×568.
### Steps
1. `__fix(45.764, 4.8357)`; wait until `__at(45.764, 4.8357, 15)`.
2. Fill `#search-input` with "Tete d'Or", press Enter, wait for 2 `#results button`; click "Parc de la Tête d'Or, Lyon"; wait for 2 `#routes button`.
3. Get bounding boxes of: the Reset button, `.leaflet-control-attribution`, `#panel`, `.leaflet-control-zoom`, `#map`.
4. Get the Reset button's visible text and the `title` attribute.
5. `page.setViewportSize` to the same size rotated (e.g. 640×360), pan away, click Reset, Wait at start(45.764, 4.8357, 15).
### Expected
- [ ] The Reset button box lies fully inside the viewport and inside `#map`.
- [ ] The Reset button's right edge is within 20 px of `#map`'s right edge and its center is in the bottom half of `#map`.
- [ ] The Reset button's bottom edge is ≤ the attribution's top edge, and the button is horizontally over the attribution's right part (button right edge within 20 px of attribution right edge).
- [ ] The Reset button box does not intersect `#panel`'s box and does not intersect `.leaflet-control-zoom`'s box.
- [ ] `page.locator(".reset-view-control button").isVisible()` is `true` and `document.elementFromPoint(<button center>)` is the button or inside it.
- [ ] Step 4: the visible text, trimmed, is "⌂" and the `title` is "Reset view".
- [ ] Step 5 resolves: same center and zoom after the resize.
