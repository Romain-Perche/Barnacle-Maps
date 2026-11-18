# AI test scenarios (SF-72)

Each `us<N>-*.md` file is performed by an agent on the running app with headless Playwright.

## Common setup (every scenario)

The VM cannot reach routing.openstreetmap.de, nominatim.openstreetmap.org, tile.openstreetmap.org or
unpkg.com. `tests/ai/support/fake-services.mjs` answers them inside the page (see the header of that file):
the OSRM requests are checked against the OSRM docs, as described in `.factory/test-env.md`.

1. Check that the OSRM docs are present: `test -s .factory/schemas/osrm-http.md`.
2. Get Leaflet 1.9.4: `mkdir -p /tmp/leaflet && cd /tmp/leaflet && npm pack leaflet@1.9.4 && tar xzf leaflet-1.9.4.tgz`.
3. Get Playwright in a scratch folder: `mkdir -p /tmp/pw && cd /tmp/pw && npm init -y && npm i playwright`. If its
   browser download is blocked, launch Chromium with `executablePath` set to the headless shell already in
   `~/.cache/ms-playwright/` (for example `chromium_headless_shell-*/chrome-headless-shell-linux-*/chrome-headless-shell`).
4. In the repository root, run `npm start` (serves http://localhost:8000).
5. In the Playwright script: create a context with `viewport: { width: 1280, height: 720 }`, `geolocation: START` and `permissions: ["geolocation"]`,
   call `installFakes(page, options)` **before** `page.goto("http://localhost:8000")`, and keep the returned `log`.
   Import from the absolute path of `tests/ai/support/fake-services.mjs`.
6. Listen to `pageerror`. Every scenario also expects: no page error, and `log.refused` is empty (no request
   that the OSRM docs refuse).

"Choose <place>" means: type the place name in `#search-input`, press Enter, then click the first button of the
first `#results li` (the place name, not "Add as stop").
