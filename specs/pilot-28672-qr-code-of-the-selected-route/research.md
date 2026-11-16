# Research: QR Code of the Selected Route

All Technical Context unknowns are resolved below. No question was asked: this ran in the factory with nobody to answer, so every open choice was made here and is recorded as a decision.

## R1. Phone link target and format

- **Decision**: Use the public OpenStreetMap directions page:
  `https://www.openstreetmap.org/directions?engine=<engine>&route=<startLat>%2C<startLng>%3B<destLat>%2C<destLng>`
  with `engine` = `fossgis_osrm_foot` (walking) or `fossgis_osrm_car` (car). Coordinates are in **lat,lng** order (the opposite of OSRM's lng,lat), formatted with `toFixed(5)`. The `,` and `;` are percent-encoded (`%2C`, `%3B`) through `URLSearchParams`, which is how the OSM website writes its own links.
- **Rationale**: The spec clarification already chose this page. The `fossgis_osrm_*` engines are the OSRM profiles served by routing.openstreetmap.de, the same service the app uses (`routed-foot`, `routed-car`), so the phone shows the same trip (FR-002). The page is responsive and works in any phone browser with no account. With 5 decimals the precision is about 1.1 m, which meets FR-004 and keeps the link short (about 111 characters), so the QR code stays small and easy to scan.
- **Verification note**: The sandbox network blocks openstreetmap.org and GitHub, so the engine names and the `route` parameter come from the openstreetmap-website directions code as known before this session, not from a live check. Quickstart step V3 covers this with a manual check on a real phone.
- **Alternatives considered**:
  - Link to the app itself: rejected because the app usually runs on `localhost`, which a phone can't reach (spec Assumptions).
  - `geo:` URI: rejected because it carries no start point or travel mode, and its behaviour depends on the phone's apps.
  - Google or Apple Maps URLs: rejected because they use a different routing service and the clarification chose OSM.
  - 6 decimals: rejected because they make the link longer (a bigger QR version) with no useful gain.

## R2. QR code library

- **Decision**: Use **`qrcode-generator` 2.0.4** (Kazuhiko Arase, MIT, a long-standing and widely used package on npm). Load its classic build from the same CDN as Leaflet, pinned and with Subresource Integrity:
  `<script src="https://unpkg.com/qrcode-generator@2.0.4/dist/qrcode.js" integrity="sha384-e9EFD6BGC90bkW9aDV5xbbBfzwN7G8YImHao2lfLVKV/hPB0E0go+H3I64h7oHtA" crossorigin="anonymous"></script>`
  This file declares a global `var qrcode` (the UMD wrapper only adds AMD/CommonJS exports), so `window.qrcode` is available to `src/app.js`.
- **Rationale**: FR-009 requires a well-known library and no hand-written encoding. The spec Assumptions require no build step, with the library loaded like Leaflet. The library has no dependencies, is about 57 kB unminified, and its API (`qrcode(typeNumber, ecl)`, `addData`, `make`, `createSvgTag`) was checked against the published npm tarball (`dist/qrcode.js`, `dist/qrcode.mjs`, `dist/qrcode.d.ts`). The SRI hash was computed from that tarball's `dist/qrcode.js`, which unpkg serves byte for byte.
- **Alternatives considered**:
  - `qrcode` (soldair/node-qrcode): very popular, but recent versions no longer ship a ready-made browser build, so it would need a bundler. Rejected because of the no-build rule.
  - `qrcodejs` (davidshimjs): unmaintained since 2015 and writes canvas and img into a div itself. Rejected.
  - Dynamic `import()` of `dist/qrcode.mjs`: works, but it can't carry an SRI hash and it differs from how Leaflet is loaded. Rejected.
  - Writing the encoder by hand: forbidden by FR-009.

## R3. Rendering the code (scannability and accessibility)

- **Decision**: Use `qr = qrcode(0, "L")` (automatic version, error-correction level L), then `addData(link)`, `make()`, and `createSvgTag({ cellSize: 1, margin: 4, scalable: true })`. The SVG is turned into a `data:image/svg+xml,…` URL (with `encodeURIComponent`) and set as the `src` of an `<img width="120" height="120" alt="QR code to open this route on your phone">`.
- **Rationale**:
  - SVG is vector, so the modules stay sharp at 120 CSS px on any pixel density.
  - The library draws a white background rect, dark modules and a 4-module quiet zone (FR-006).
  - Level L gives the biggest modules for a given size. A typical link gives 41 modules plus 8 quiet-zone modules, about 2.45 CSS px per module at 120 px, which is enough for a phone camera at 30–60 cm. A clean screen needs no damage tolerance.
  - An `<img>` with `alt` gives the text alternative (FR-007) without `innerHTML`.
  - When the library is missing or throws, no `src` is set and the card stays hidden, so no broken image is shown (FR-010).
- **Alternatives considered**:
  - `createDataURL` (GIF bitmap): it gets blurry or uneven when scaled to 120 px. Rejected.
  - Injecting the SVG with `innerHTML`: works, but `<img alt>` is simpler and safer. Rejected.
  - Level M: about 45 modules, so smaller cells. Not needed on a screen.

## R4. Where the logic lives (testability, FR-011)

- **Decision**:
  - `phoneRouteUrl(from, to, mode)` goes in `src/geo.js`, next to `routeUrl` and `searchUrl`. It is pure and needs no browser or network.
  - Each `TRAVEL_MODES` entry gets an `osmEngine` field, so mode data stays in one place.
  - `qrImageSrc(factory, text)` goes in a new small module `src/qr.js`. It takes the QR factory as a parameter, which lets tests pass a stub, and returns the data URL or `null`.
  - Tests go in `test/phone-link.test.js`, `test/qr-image.test.js`, `test/phone-card.test.js` and `test/phone-updates.test.js`, and run with `node --test`. The UI lifecycle is covered by the AI scenarios in `tests/ai/`.
- **Rationale**: This follows the existing pattern: pure helpers in modules, DOM wiring in `app.js`, Node's built-in test runner, and no dependencies. Injecting the factory keeps the CDN library out of the tests while still testing the fallback path (FR-010).
- **Alternatives considered**:
  - Importing the real library in tests: it would need a vendored copy or network access, and the repo is dependency-free. Rejected.
  - Putting `qrImageSrc` in `geo.js`: it isn't geography. A separate small module is clearer.

## R5. Start position consistency and lifecycle (FR-003, FR-005)

- **Decision**:
  - In `updateRoutes()`, keep the start position in a local `from` once position is known. Pass `from` to `fetchRoutes` (for the main request and the detour requests) and to the phone card.
  - `clearRoutes()` hides the card. That covers every recompute, no destination, waiting for position, failure and no route found.
  - The card is filled and shown only after `drawRoutes()`, behind the same `seq === routeSeq` guard as the routes.
  - The phone link doesn't depend on the selected alternative, so `selectRoute()` doesn't touch the card (User Story 1, scenario 3).
- **Rationale**: `watchPosition` replaces `position` all the time. Using one captured start makes the QR code match the routes on screen and refresh only on recompute (edge case "live position keeps moving"). It also stops the detour requests from using a newer position than the main request did.
- **Alternatives considered**: Regenerating the card on every position update was rejected because it disagrees with the displayed routes, and the spec says to refresh only on recompute.

## R6. Layout and small screens

- **Decision**:
  - Add a `#phone` card right after `#status` (the route summary). It is a flex row: the QR `<img>` on the left; on the right, the title "Continue on your phone", the line "Scan with your phone camera.", the link "Open on your phone ↗" (`target="_blank" rel="noopener"`), and a stops note (hidden unless there are stops). A `1px` top border separates it from the summary, as in Design A.
  - To keep the route list reachable when the panel grows by about 130 px, add `#panel { max-height: calc(100% - 24px); overflow-y: auto; }`.
- **Rationale**: This matches the chosen Design A (FR-001) and the small-screen edge case. The panel is already limited to `min(360px, 100% - 24px)` wide. Leaflet's zoom control is at the top left, under the top of the panel; that overlap exists before this feature. The new card sits below the routes, far from the control, so it adds no new overlap.
- **Alternatives considered**:
  - Designs B and C: not chosen in the clarification.
  - Hiding the card on small screens: this goes against SC-001.
