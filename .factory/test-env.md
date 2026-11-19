## Services
- unpkg.com (Leaflet 1.9.4 css/js): may be blocked by the sandbox proxy; the scripts serve it from `npm pack leaflet@1.9.4` extracted at `$LEAFLET_DIR` (default /tmp/lf/x).
- OSM tiles, Nominatim, OSRM: faked in the scripts with `page.route` (fixed JSON, 1x1 PNG).

## How to run the app
`npm run start` (python http.server on :8000). Then:
`mkdir -p /tmp/lf && cd /tmp/lf && npm pack leaflet@1.9.4 && mkdir -p x && tar xzf leaflet-1.9.4.tgz -C x`
`NODE_PATH=/opt/playwright/node_modules node .factory/run/cursor-check.cjs`, `cursor-extra.cjs` and `touch-check.cjs` (touch emulation: tap opens the popup, one-finger drag moves the centre).
`review-check.cjs`: the main scenario run: cursor at hover points, popup tip vs click (measure `.leaflet-popup-tip`'s box bottom, which is the visible tip point; the tip *container*'s bottom is 7px lower), grabbing during the drag, every marker and route line, panel cursors, wheel zoom, Tab and Enter on a route option, a blocked cursor image, and `ring-on-backgrounds.png` (the SVG on street, park, light and dark water colours; headless screenshots do not draw the OS pointer).
`zoom-hover.cjs`: `#panel` covers Leaflet's zoom control on every viewport (it does on main too), so this script hides the panel, then hovers + and −.
All scripts need the app on :8000 and Leaflet extracted at `$LEAFLET_DIR`.

## Smoke checks
- `curl -s localhost:8000/assets/map-cursor.svg | head -1` shows an svg tag.
- `node .factory/run/cursor-extra.cjs` prints the map cursor as `url(".../assets/map-cursor.svg") 12 12, crosshair`.

## Schemas
None: the faked services (OSM tiles, Nominatim, OSRM) are answered with fixed responses in the run scripts; no schema file is used.

## Docker images
None.
