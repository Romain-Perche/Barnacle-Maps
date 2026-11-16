# US1: Continue the selected route on my phone
Covers: FR-001, FR-002, FR-003, FR-004, FR-006, FR-007, FR-008, FR-009, SC-001, SC-003, SC-004, US1 scenario 1, 2, 3, edge cases "journey with stops", "small screens"

Common setup for every scenario:

- Run `npm start` in the repository root. It serves http://localhost:8000.
- Use headless Playwright (Chromium) with `permissions: ["geolocation"]`, `geolocation: { latitude: 48.8566, longitude: 2.3522 }` and viewport 1280 × 800, unless a scenario says otherwise.
- The network must reach unpkg.com, nominatim.openstreetmap.org, routing.openstreetmap.de, tile.openstreetmap.org and www.openstreetmap.org.
- To decode a QR code: take a screenshot of `#phone-qr` with `locator.screenshot({ path: "qr.png", scale: "device" })` and a device scale factor of 3. Then run `zbarimg --raw -q qr.png` (install with `sudo apt-get install -y zbar-tools`).
- "Louvre" means the destination search: type `Louvre Museum Paris` into `#search-input`, press Enter, wait for `#results button` and click the first result whose text does not start with "Add".

## Scenario 1: QR card appears under the route summary (walking)
### Setup
Common setup. Walk mode (the default).
### Steps
1. Open http://localhost:8000.
2. Search and pick "Louvre".
3. Wait up to 20 s for `#routes li` to exist and `#status` to contain "walking" or "on foot".
4. Read `#phone`, `#phone-qr`, `#phone-url`, `#phone-link` and the page HTML order.
5. Decode the QR code (common setup).
### Expected
- [ ] `#phone` is visible (no `hidden` attribute, bounding box height > 0).
- [ ] In the DOM, `#phone` comes right after `#status`.
- [ ] `#phone-qr` is rendered 245 × 245 CSS px (±2 px) (fix round 1).
- [ ] In the device-scale-3 screenshot of `#phone-qr`, the dark code area (bounding box of the dark pixels) is at least 600 device px wide, so the code itself is at least 200 CSS px (FR-006).
- [ ] `#phone-url` is visible, below `#phone-qr` (its top ≥ the QR bottom), and its text is exactly equal to the `href` of `#phone-link` (FR-007).
- [ ] The `#phone` box is inside the `#panel` box horizontally (no horizontal overflow: `#panel.scrollWidth <= #panel.clientWidth`).
- [ ] `#phone-qr` has alt "QR code to open this route on your phone".
- [ ] `#phone-qr` `naturalWidth` > 0 (not a broken image).
- [ ] `#phone` contains the texts "Continue on your phone", "Scan with your phone camera." and "Open on your phone".
- [ ] `#phone` has a 1px top border.
- [ ] `zbarimg` decodes exactly one value, and it is equal to the `href` of `#phone-link`.
- [ ] The decoded value starts with `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=`.
- [ ] In the decoded `route` parameter (URL-decoded, split on `;` then `,`), the start is `48.85660,2.35220`.
- [ ] The destination differs from the Louvre (48.8611, 2.3358) by less than 0.01 in latitude and in longitude.
- [ ] Each of the 4 coordinates has exactly 5 decimals.
- [ ] Within 40 presses of Tab from `#search-input`, `#phone-link` receives focus (FR-007).

## Scenario 2: The link opens the same trip on a phone browser
### Setup
Common setup. Do Scenario 1 steps 1–3 first. Then open a second Playwright context with the `iPhone 13` device profile (no geolocation needed).
### Steps
1. Copy the decoded QR value from Scenario 1.
2. In the phone context, open that URL.
3. Wait up to 20 s for the page sidebar to show a route summary.
### Expected
- [ ] The final page URL is on `www.openstreetmap.org/directions`.
- [ ] The final URL still has `engine=fossgis_osrm_foot` and the same `route` value as the QR code.
- [ ] The page shows a text matching `/Distance/i` and a duration (a route was computed).
- [ ] No login page is shown: the final URL does not contain `/login`.

## Scenario 3: Car mode gives a car link
### Setup
Common setup.
### Steps
1. Open http://localhost:8000.
2. Click the `Car` radio in `#mode`.
3. Search and pick "Louvre".
4. Wait up to 20 s for `#routes li` and for `#status` to contain "driving" or "by car".
5. Decode the QR code.
### Expected
- [ ] `#phone` is visible.
- [ ] The decoded value starts with `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=48.85660%2C2.35220%3B`.
- [ ] The decoded value is equal to the `href` of `#phone-link`.

## Scenario 4: Picking another route keeps the QR card
### Setup
Common setup. Do Scenario 1 steps 1–3 and note the `href` of `#phone-link` as L0. If `#routes li` has only 1 item, search "Gare de Lyon Paris" instead, so at least 2 routes are shown.
### Steps
1. Click the second button in `#routes`.
2. Read `#phone` and `#phone-link`.
3. Click the first unselected route line on the map: `path.leaflet-interactive[stroke="#888"]`.
4. Read `#phone` and `#phone-link` again.
### Expected
- [ ] After step 1, the second route button has `aria-pressed="true"`.
- [ ] After step 1, `#phone` is visible and `#phone-link` `href` equals L0.
- [ ] After step 3, `#phone` is visible and `#phone-link` `href` equals L0.
- [ ] After step 3, a different route button has `aria-pressed="true"` than after step 1.

## Scenario 5: Journey with stops shows the note and a direct link
### Setup
Common setup.
### Steps
1. Open http://localhost:8000.
2. Type `Pantheon Paris` into `#search-input` and press Enter.
3. Click the first `#results .add-stop` button.
4. Search and pick "Louvre".
5. Wait up to 20 s for `#routes li` and for `#status` to contain "via 1 stop".
6. Decode the QR code.
### Expected
- [ ] `#phone` is visible.
- [ ] `#phone-stops` is visible and its text is "Stops are not included in the phone link.".
- [ ] The decoded `route` parameter has exactly 2 points (one `;`).
- [ ] The first point of the decoded `route` is `48.85660,2.35220`.
- [ ] The decoded value is equal to the `href` of `#phone-link`.
- [ ] After clicking `#clear-stops` and waiting for the routes again, `#phone-stops` is hidden and `#phone` is visible.

## Scenario 6: Small screen keeps the routes and the map controls reachable
### Setup
Common setup, but with viewport 360 × 640.
### Steps
1. Do Scenario 1 steps 1–3.
2. Read the bounding boxes of `#panel`, `.leaflet-control-zoom` and the last `#routes button`.
3. Scroll the last `#routes button` into view and click it.
### Expected
- [ ] The bottom of `#panel` is ≤ 640 px.
- [ ] `#panel` has computed `overflow-y` equal to `auto`.
- [ ] The `#phone` box does not overlap the `.leaflet-control-zoom` box (that control is at the top left, under the panel's top part before this feature too).
- [ ] After step 3, the last route button has `aria-pressed="true"`.
- [ ] After step 3, `#phone` is still visible.
