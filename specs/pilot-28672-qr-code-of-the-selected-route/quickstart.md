# Quickstart / Validation: QR Code of the Selected Route

## Prerequisites

- Node 18+ (for `node --test`) and Python 3 (for `npm start`).
- A browser with location access. The page runs on `http://localhost:8000`.
- Network access to `unpkg.com` (Leaflet and qrcode-generator), the OSM tiles and the routing servers.
- For V3: a phone with a camera.

## Automated checks

```bash
npm test
```

Expected: every existing test still passes, and the new test files pass:

- `test/phone-link.test.js`: [contracts/phone-link.md](contracts/phone-link.md) §1. It covers every example (foot, car, unknown mode, negative coordinates, 5 decimals, null or invalid input), checks precision to about 1 m, checks that the link has only `engine` and two `route` points, and checks `TRAVEL_MODES.*.osmEngine`.
- `test/qr-image.test.js`: §2. `qrImageSrc` with a stub factory calls `(0, "L")`, then `addData`, `make`, then `createSvgTag({cellSize:1, margin:4, scalable:true})`, and returns a `data:image/svg+xml,` URL. It returns `null` for a missing factory, empty text, or a factory that throws.
- `test/phone-card.test.js`: §3. It checks the library `<script>` (pinned, SRI, after Leaflet, before `src/app.js`), the `#phone` card markup after `#status`, the texts, the alt text and size, the hidden stops note, the Design A CSS and the `#panel` scrolling.
- `test/phone-updates.test.js`: User Story 2. Switching to car changes only the engine; a new destination gives a new QR content without the old destination; the start is exactly the start passed in.

The AI scenarios in `tests/ai/us1-continue-on-phone.md` and `tests/ai/us2-qr-follows-changes.md` automate the manual checks below with headless Playwright and `zbarimg`.

## Manual validation (`npm start`, then open http://localhost:8000)

| # | Steps | Expected |
|---|-------|----------|
| V1 | Allow location, search a place, pick it (walking) | The card appears under the route summary: a QR code of about 120 px on the left, with "Continue on your phone", "Scan with your phone camera." and "Open on your phone ↗" on the right, above a thin line (FR-001) |
| V2 | Hover or copy "Open on your phone" | The URL is `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=<your lat,lng>;<dest lat,lng>` with 5 decimals (FR-002/003/004) |
| V3 | Scan the QR code with the phone camera from 30–60 cm | The phone opens OSM directions from your position to the destination on foot. It scans on the first try (SC-002/003/004). **This also confirms the OSM URL format chosen in research R1.** |
| V4 | Pick Route 2 in the panel, then Route 3 on the map | The card stays visible with the same link (US1 scenario 3) |
| V5 | Switch to Car | The card disappears while routes are computed, then comes back with `engine=fossgis_osrm_car` (US2 scenario 1) |
| V6 | Choose another destination | The old card disappears, and the new one encodes the new destination (US2 scenario 2, SC-005) |
| V7 | Add a stop | The note "Stops are not included in the phone link." is shown, and the link still has only the start and destination (FR-008) |
| V8 | Search a place that can't be reached (e.g. across an ocean) | "No walking route found." and no card (US2 scenario 3) |
| V9 | DevTools → block `unpkg.com/qrcode-generator*`, then reload and get a route | Routes work, no card, no broken image, no uncaught error (FR-010) |
| V10 | Screen readers / a11y tree | The image has alt "QR code to open this route on your phone", and the link can be focused (FR-007) |
| V11 | Narrow window (about 360 × 640) with 3 routes and the card | The panel scrolls inside itself, and all routes stay reachable. The card does not overlap the map zoom control; that control is under the panel's top part already before this feature (small-screen edge case) |
