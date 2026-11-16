# US2: QR code follows my changes
Covers: FR-003, FR-005, FR-010, SC-001, SC-005, US2 scenario 1, 2, 3, edge cases "no destination or position", "routing fails", "live position keeps moving", "library fails to load"

Common setup for every scenario:

- Same as in `tests/ai/us1-continue-on-phone.md`: `npm start`; headless Chromium with geolocation 48.8566, 2.3522; "Louvre" pick; `zbarimg` decoding.
- "Wait for routes" means: wait up to 20 s for `#routes li` to exist and `#status` not to contain "Computing".
- "Slow routing" means: use `page.route("https://routing.openstreetmap.de/**", r => setTimeout(() => r.continue(), 4000))`, so routes take at least 4 s.

## Scenario 1: Walking to car updates the QR code
### Setup
Common setup. Open http://localhost:8000. Pick "Louvre" and wait for routes. Note `#phone-link` `href` as L0; it contains `engine=fossgis_osrm_foot`. Turn on "slow routing".
### Steps
1. Click the `Car` radio in `#mode`.
2. Within 1 s, read `#phone` and `#status`.
3. Wait for routes.
4. Read `#phone-link` and decode the QR code.
### Expected
- [ ] At step 2, `#status` contains "Computing driving routes".
- [ ] At step 2, `#phone` is hidden (has the `hidden` attribute or is not visible).
- [ ] After step 3, `#phone` is visible.
- [ ] After step 3, the decoded value equals `#phone-link` `href`.
- [ ] After step 3, the decoded value contains `engine=fossgis_osrm_car`.
- [ ] The decoded `route` parameter equals the `route` parameter of L0 (same start and destination).

## Scenario 2: New destination replaces the QR code
### Setup
Common setup. Open http://localhost:8000. Pick "Louvre" and wait for routes. Note `#phone-link` `href` as L0. Turn on "slow routing".
### Steps
1. Type `Tour Eiffel Paris` into `#search-input`, press Enter and click the first result that is not "Add as stop".
2. Within 1 s, read `#phone`.
3. Wait for routes.
4. Decode the QR code.
### Expected
- [ ] At step 2, `#phone` is hidden.
- [ ] After step 3, `#phone` is visible.
- [ ] The decoded value differs from L0.
- [ ] The decoded value equals `#phone-link` `href`.
- [ ] The destination in the decoded `route` differs from the Eiffel Tower (48.8583, 2.2945) by less than 0.01 in latitude and in longitude.
- [ ] The destination of L0 (the Louvre) does not appear in the decoded value.

## Scenario 3: Routing fails, so there is no QR code
### Setup
Common setup. Open http://localhost:8000. Pick "Louvre" and wait for routes (the card is visible). Then use `page.route("https://routing.openstreetmap.de/**", r => r.fulfill({ status: 500, body: "" }))`.
### Steps
1. Click the `Car` radio.
2. Wait up to 10 s for `#status` to contain "Routing failed".
3. Read `#phone` and `#routes`.
### Expected
- [ ] `#status` contains "Routing failed".
- [ ] `#routes` has no `li`.
- [ ] `#phone` is hidden.

## Scenario 4: No route found, so there is no QR code
### Setup
Common setup. Use `page.route("https://routing.openstreetmap.de/**", r => r.fulfill({ status: 200, contentType: "application/json", body: '{"code":"NoRoute","routes":[]}' }))` before opening the page.
### Steps
1. Open http://localhost:8000.
2. Pick "Louvre".
3. Wait up to 10 s for `#status` to contain "No walking route found.".
4. Read `#phone`.
### Expected
- [ ] `#status` contains "No walking route found.".
- [ ] `#phone` is hidden.

## Scenario 5: No position or no destination, so there is no QR code
### Setup
Headless Chromium **without** the geolocation permission (`permissions: []`). Everything else as in the common setup.
### Steps
1. Open http://localhost:8000 and wait 2 s.
2. Read `#phone`.
3. Pick "Louvre".
4. Wait 3 s.
5. Read `#phone` and `#status`.
### Expected
- [ ] At step 2 (no destination yet), `#phone` is hidden.
- [ ] At step 5, `#status` contains "Location unavailable" or "Waiting for your location".
- [ ] At step 5, `#phone` is hidden.

## Scenario 6: Live position moves; the QR code changes only on recompute
### Setup
Common setup. Open http://localhost:8000. Pick "Louvre" and wait for routes. Note `#phone-link` `href` as L0; its start is `48.85660,2.35220`.
### Steps
1. Call `context.setGeolocation({ latitude: 48.8530, longitude: 2.3499 })` and wait 3 s.
2. Read `#phone-link` `href`.
3. Click the `Car` radio and wait for routes.
4. Read `#phone-link` `href` and decode the QR code.
### Expected
- [ ] At step 2, `#phone-link` `href` equals L0 (no refresh without a recompute).
- [ ] At step 4, the decoded `route` starts with `48.85300,2.34990;`.
- [ ] At step 4, the decoded value equals `#phone-link` `href`.

## Scenario 7: QR library fails to load; the app keeps working
### Setup
Common setup. Before opening the page, use `page.route("**/qrcode-generator@*/**", r => r.abort())`. Collect `page.on("pageerror")` events.
### Steps
1. Open http://localhost:8000.
2. Pick "Louvre" and wait for routes.
3. Read `#routes`, `#phone` and `#phone-qr`.
### Expected
- [ ] `#routes` has at least 1 `li`.
- [ ] `#status` shows a route summary (contains "km" or " m").
- [ ] `#phone` is hidden.
- [ ] `#phone-qr` has no `src` attribute or an empty one (no broken image).
- [ ] No `pageerror` event was recorded.
