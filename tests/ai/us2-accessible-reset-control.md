# US2: Accessible reset control
Covers: FR-001, FR-005 (nothing announced), FR-006, FR-009, US2 scenario 1, 2

## Common setup (used by every scenario below)

1. Serve the app from the repo root: `npm start` (http://localhost:8000). Leaflet loads from `unpkg.com`;
   if the VM cannot reach it, report the run as an environment failure, not an app failure.
2. Headless Chromium with Playwright, viewport 1280×800, `hasTouch: false`, unless a scenario says otherwise.
3. Stub `**/tile.openstreetmap.org/**` with `page.route` → status 200, `content-type: image/png`, body = base64
   `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC` (1×1 white PNG).
4. Add this probe with `page.addInitScript` before `page.goto` (fake geolocation + access to the Leaflet map):

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
   let _L;
   Object.defineProperty(window, "L", {
     configurable: true,
     get: () => _L,
     set(v) { _L = v; v.Map.addInitHook(function () { window.__map = this; }); },
   });
   window.__at = (lat, lng, zoom) => {
     const m = window.__map, z = m.getZoom();
     return z === zoom && m.project(m.getCenter(), z).distanceTo(m.project([lat, lng], z)) <= 1;
   };
   ```
5. `page.goto("http://localhost:8000")`, wait until `window.__map` exists, then `page.evaluate(() => __fix(45.764, 4.8357))`
   and wait until `__at(45.764, 4.8357, 15)`.
6. **Pan away** = `page.evaluate(() => __map.setView([45.9, 5.2], 11, { animate: false }))` (keeps keyboard focus where it is),
   then check `__at(45.764, 4.8357, 15)` is `false`.
7. **Tab to Reset** = `page.evaluate(() => document.activeElement.blur())`, then press `Tab` repeatedly (at most 30 times)
   until `document.activeElement` matches `.reset-view-control button`.

## Scenario 1: Keyboard — Enter resets, focus stays on the control
Covers US2 scenario 1 (Enter), FR-006, FR-005
### Setup
Common setup.
### Steps
1. Record `#status` text.
2. Pan away.
3. Tab to Reset.
4. `page.keyboard.press("Enter")`.
5. Wait until `__at(45.764, 4.8357, 15)` (timeout 1000 ms).
6. Read `document.activeElement` and `#status` text.
### Expected
- [ ] Step 3 reaches the control within 30 Tab presses.
- [ ] Step 5 resolves: the map is back at the starting view.
- [ ] In step 6, `document.activeElement` is the `.reset-view-control button`.
- [ ] In step 6, `#status` text equals the text from step 1.

## Scenario 2: Keyboard — Space alone also resets
Covers US2 scenario 1 (Space), FR-006
### Setup
Common setup.
### Steps
1. Pan away.
2. Tab to Reset.
3. `page.keyboard.press("Space")`.
4. Wait until `__at(45.764, 4.8357, 15)` (timeout 1000 ms).
5. Pan away again (focus stays on the button), press `Space` again, wait until `__at(45.764, 4.8357, 15)` (timeout 1000 ms).
### Expected
- [ ] Step 4 resolves.
- [ ] Step 5 resolves.
- [ ] After step 5, `document.activeElement` is still the `.reset-view-control button`.

## Scenario 3: Screen reader name and role
Covers US2 scenario 2, FR-001, FR-006
### Setup
Common setup.
### Steps
1. `page.getByRole("button", { name: "Reset view", exact: true }).count()`.
2. Tab to Reset, then take `page.accessibility.snapshot({ interestingOnly: true })` (or `page.locator(":focus").ariaSnapshot()`) and find the focused node.
3. Read from the button: `tagName`, `type`, `getAttribute("aria-label")`, `title`, `disabled`, and `textContent.trim()`;
   read `aria-hidden` of the element that holds the "⌂" glyph.
### Expected
- [ ] Step 1 returns 1.
- [ ] Step 2: the focused node has role `button` and name "Reset view".
- [ ] Step 3: `tagName` is `BUTTON`, `type` is `button`, `aria-label` is "Reset view", `title` is "Reset view", `disabled` is `false`.
- [ ] Step 3: the visible text is "⌂" and its element has `aria-hidden="true"`.

## Scenario 4: Visible focus indicator with at least 3:1 contrast
Covers FR-009
### Setup
Common setup.
### Steps
1. Tab to Reset.
2. Take a screenshot of the button's box enlarged by 6 px on each side (`page.screenshot({ clip })`).
3. On the focused button read `getComputedStyle(btn)`: `outlineStyle`, `outlineWidth`, `outlineColor`, `boxShadow`, `backgroundColor`, `color`.
4. Compute the WCAG contrast ratio `(L1 + 0.05) / (L2 + 0.05)` (relative luminance of sRGB colors) of
   (a) `outlineColor` (or the box-shadow color if the outline is `none`) against `backgroundColor`, and
   (b) `color` (icon) against `backgroundColor`.
5. Move focus away (`document.activeElement.blur()`), read `outlineStyle` and `boxShadow` again.
### Expected
- [ ] In step 3, either `outlineStyle` is not `none` and `outlineWidth` ≥ 1px, or `boxShadow` is not `none`.
- [ ] Step 4 (a) ≥ 3.0.
- [ ] Step 4 (b) ≥ 3.0.
- [ ] The indicator from step 3 is gone or different in step 5 (the ring only shows on focus).
- [ ] The screenshot from step 2 shows a ring around the button (checked by the agent: yes/no).

## Scenario 5: Touch target size
Covers FR-009
### Setup
Run twice: (a) Common setup as is; (b) Common setup with a context created with `hasTouch: true, isMobile: true`, viewport 360×640.
### Steps
1. Read the bounding box of the Reset button.
2. Read whether `#map` has the class `leaflet-touch`.
### Expected
- [ ] (a) width ≥ 30 and height ≥ 30.
- [ ] (b) `#map` has the class `leaflet-touch`, and the button's width ≥ 34 and height ≥ 34.
- [ ] In both runs, the button's width equals its height (±1 px), like the other map buttons.
