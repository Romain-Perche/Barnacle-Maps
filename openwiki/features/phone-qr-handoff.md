---
type: feature
title: Continue on your phone (QR code)
description: The phone card under the route summary. It shows a 245 px QR code, the plain-text link and a clickable link, all opening the same start, destination and travel mode on the OpenStreetMap directions page. It also covers how the link and QR image are built, when the card is shown or hidden, and how failures are handled.
tags: [feature, qr-code, phone, openstreetmap]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T11:56:00.654Z
sources:
  - id: openwiki-source-f8d10828394c4129061d5b0e
    resource: repo://index.html
  - id: openwiki-source-e2cc3c3da96cc52ce6b6de67
    resource: repo://src/app.js
  - id: openwiki-source-c2b285527acec6fce8507885
    resource: repo://src/geo.js
  - id: openwiki-source-73eaa3b7b28c22e12d3439b7
    resource: repo://src/qr.js
generated: { by: "claude-code", at: "2026-11-16T11:56:00.654Z" }
---

# Continue on your phone (QR code)

Once routes are on screen, the panel shows a **"Continue on your phone"** card directly under the status line. The card holds a QR code, the link as selectable text, an "Open on your phone ↗" link and, when the journey has stops, a note that stops are not included. Scanning the code opens the same trip on the public OpenStreetMap directions page, which uses the same FOSSGIS OSRM engines as the app. The feature was specified in `specs/pilot-28672-qr-code-of-the-selected-route/` (FR-001 to FR-011).

## Building the link: `phoneRouteUrl` (src/geo.js)

`phoneRouteUrl(from, to, mode)` returns `https://www.openstreetmap.org/directions?engine=…&route=lat,lng;lat,lng`:

- `engine` comes from `TRAVEL_MODES[mode].osmEngine`: `fossgis_osrm_foot` for walking, `fossgis_osrm_car` for car. An unknown mode falls back to walking.
- The coordinates are written with 5 decimals (about 1 m), start first, then destination.
- The function returns `null` when either point is missing or has a non-finite coordinate.
- Stops are never encoded, because the OSM directions page takes only a start and an end.

The function is pure, so it is unit tested without a browser (`test/phone-link.test.js`, `test/phone-updates.test.js`).

## Building the image: `qrImageSrc` (src/qr.js)

`qrImageSrc(factory, text)` takes the qrcode-generator factory (`window.qrcode`, loaded from unpkg with Subresource Integrity in `index.html`; for the version see [`sbom/SBOM.md`](../../sbom/SBOM.md)). It builds a code with automatic type number (`0`) and error correction level `L`, then returns `data:image/svg+xml,…` from `createSvgTag({ cellSize: 1, margin: 4, scalable: true })`. The 4-module margin is the quiet zone. The function returns `null` when the factory is not a function, the text is empty, or the library throws. The QR encoding itself is never hand-written (FR-009).

## Card lifecycle (src/app.js)

- `clearRoutes()` hides `#phone`. Every `updateRoutes()` call runs it, so the card is hidden while a route is computing, after a failure, with no route, with no destination and with no position (FR-005).
- After the routes are drawn, `showPhone(from, place, mode, stops)` builds the URL from the **same `from` position used for the routing request**, so the code always matches the routes on screen. If either the URL or the QR image is `null`, the card stays hidden: no broken image (FR-010). Otherwise the function sets `#phone-qr` `src`, `#phone-url` text and `#phone-link` `href`, shows `#phone-stops` only when there are stops, and shows the card.
- The `<img>` is fixed at 245 × 245 CSS pixels with alt text "QR code to open this route on your phone". The link opens in a new tab with `rel="noopener"`.

## Tests

- `test/phone-link.test.js`: link format, precision, engines and `null` cases.
- `test/qr-image.test.js`: `qrImageSrc` with fake factories, including failure.
- `test/phone-card.test.js`: text-contract checks on `index.html`, `styles.css` and `app.js` (SRI tag order, card markup, the card starts hidden).
- `test/phone-updates.test.js`: the code follows mode and destination changes.
- `tests/ai/us1-continue-on-phone.md` and `tests/ai/us2-qr-follows-changes.md`: browser scenarios that decode the real QR code with `zbarimg`.

See also [Routing](routing-and-alternatives.md) and [Testing](../testing/test-strategy.md).
