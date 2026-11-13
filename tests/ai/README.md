# AI test scenarios: route summary bar (PILOT-73195)

Shared setup for every scenario file in this folder:

1. Start the app at the repo root: `npm start` (serves http://localhost:8000).
2. Use headless Playwright (Chromium) with a context created with:
   - `permissions: ["geolocation"]`, `geolocation: { latitude: 48.85, longitude: 2.35 }`
   - `locale: "en-GB"` (24-hour clock) unless the scenario says otherwise
   - `timezoneId: "Europe/Paris"`
3. Before `page.goto`, call `page.clock.install({ time: new Date("2026-11-13T14:10:00+01:00") })` so "now" is 14:10 local.
4. Stub the network with `page.route` so results never depend on live services (Nominatim/OSRM may be blocked in the VM):
   - `**/nominatim.openstreetmap.org/**` → JSON `[{"display_name":"Louvre","lat":"48.86","lon":"2.36"}]`
   - `**/routed-foot/**` (walking) → [fixtures/foot-3-routes.json](fixtures/foot-3-routes.json)
   - `**/routed-car/**` (car) → [fixtures/car-1-route.json](fixtures/car-1-route.json)
   - `**/tile.openstreetmap.org/**` → may pass through or return 404 (tiles are not needed by these checks)
5. Open http://localhost:8000. Type `Louvre` in the "Search a place" box, press Go, and click the `Louvre` result.

Expected panel entries with the walking fixture: `Route 1 · 2.35 km · 25 min`, `Route 2 · 2.60 km · 29 min`, `Route 3 · 3.00 km · 35 min`.

The bar is `#route-card`. Its parts are `.rc-mode`, `.rc-duration`, `.rc-distance` and `.rc-arrival`, in that order. The announcement region is `#route-card-live`.
