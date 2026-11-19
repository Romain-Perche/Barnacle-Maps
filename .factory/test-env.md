## Services
- unpkg.com (Leaflet 1.9.4 css/js): may be blocked by the sandbox proxy; the scripts serve it from `npm pack leaflet@1.9.4` extracted at `$LEAFLET_DIR` (default /tmp/lf/x).
- OSM tiles, Nominatim, OSRM: faked in the scripts with `page.route` (fixed JSON, 1x1 PNG).

## How to run the app
`npm run start` (python http.server on :8000). Then:
`mkdir -p /tmp/lf && cd /tmp/lf && npm pack leaflet@1.9.4 && mkdir -p x && tar xzf leaflet-1.9.4.tgz -C x`
`NODE_PATH=/opt/playwright/node_modules node .factory/run/cursor-check.cjs` and `cursor-extra.cjs`.

## Smoke checks
- `curl -s localhost:8000/assets/map-cursor.svg | head -1` shows an svg tag.
- `node .factory/run/cursor-extra.cjs` prints the map cursor as `url(".../assets/map-cursor.svg") 12 12, crosshair`.
