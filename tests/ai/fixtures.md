# Common setup for the PILOT-4590 AI tests

Every scenario in `tests/ai/us*-*.md` starts from this setup unless it says otherwise.

## App
1. From the repo root, run `npm start` (static server on http://localhost:8000).
2. `https://unpkg.com` must be reachable (Leaflet 1.9.4 is loaded from it). All other network calls are mocked below.

## Browser (headless Playwright, Chromium)
- `browser.newContext({ timezoneId: "Europe/Paris", locale: "en-GB", viewport: { width: 1280, height: 800 }, permissions: ["geolocation"], geolocation: { latitude: 48.85, longitude: 2.35 } })`
- Before `page.goto`, fix the clock: `await page.clock.setFixedTime(new Date("2026-11-12T14:07:40+01:00"))` (the clock shows 14:07). The scenario says when to change it.
- Open `http://localhost:8000/`.

## Mocked network (`context.route`, every response with header `access-control-allow-origin: *`)
- `https://tile.openstreetmap.org/**` → status 404 (map tiles and pleasure tiles fail, so the pleasure line ends as "Pleasure unavailable").
- `https://nominatim.openstreetmap.org/search**` → JSON, chosen by the `q` query parameter:
  - `q` contains `Test Park` → `[{"display_name":"Test Park","lat":"48.86","lon":"2.36"}]`
  - `q` contains `Stop Cafe` → `[{"display_name":"Stop Cafe","lat":"48.855","lon":"2.355"}]`
  - `q` contains `Night Bar` → `[{"display_name":"Night Bar","lat":"48.86","lon":"2.36"}]`
  - `q` contains `Ocean Point` → `[{"display_name":"Ocean Point","lat":"40","lon":"-30"}]`
  - `q` contains `Broken Place` → `[{"display_name":"Broken Place","lat":"48.87","lon":"2.37"}]`
  - otherwise `[]`
- `https://routing.openstreetmap.de/**` → chosen by the URL:
  - the coordinates contain `-30,40` → JSON `{"code":"NoRoute","routes":[]}`
  - the coordinates contain `2.37,48.87` → status 500
  - the coordinates hold 3 points (one stop) → JSON with one route: `duration` 2400, `distance` 2000, path A below
  - URL contains `/routed-car/` → JSON with three routes: durations 600, 720, 900; distances 1340, 1844, 1844; paths A, B, C
  - otherwise (walking) → JSON with three routes: durations 1500, 1740, 2100; distances 1340, 1844, 1844; paths A, B, C
  - JSON shape: `{"code":"Ok","routes":[{"duration":D,"distance":M,"geometry":{"type":"LineString","coordinates":PATH}}, ...]}`
  - path A `[[2.35,48.85],[2.36,48.86]]`; path B `[[2.35,48.85],[2.36,48.85],[2.36,48.86]]`; path C `[[2.35,48.85],[2.35,48.86],[2.36,48.86]]`

## Common actions
- **Search and choose X**: fill `#search-input` with X, click the button named `Go`, click the button in `#results` whose name is exactly X.
- **Route entries**: the `<button>` elements in `#routes li`. **Title** = the first `<span>` of a route button.
- **Wait for routes**: wait until `#routes li` has the expected count and `#status` no longer starts with `Computing`.
