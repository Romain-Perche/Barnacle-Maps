# Test environment

## Services
- OSRM routing (routing.openstreetmap.de: routed-foot, routed-bike, routed-car): fake (test/fakes/osrm.js), checked against the schema `osrm-http.md`. It refuses unknown options and bad values, and answers errors (NoRoute) with HTTP 400 as the docs say. Real test account wanted: no (public service, no account).
- Nominatim search (nominatim.openstreetmap.org): fake jsonv2 answer (`nominatimPlace` in test/fakes/app-harness.js), fields from the schema `nominatim-output.html`. Real test account wanted: no.
- OSM map tiles (tile.openstreetmap.org): fake. Node tests use green RGBA data (test/fakes/app-harness.js). AI tests use generated 256×256 PNG tiles (tests/ai/harness.mjs). No schema: standard PNG. Real test account wanted: no.
- Leaflet 1.9.4 from unpkg.com: AI tests serve the real package, fetched with `npm pack leaflet@1.9.4` (registry.npmjs.org is reachable). Node tests use a fake Leaflet (test/fakes/app-harness.js).

## Schemas
Fetch into `.factory/schemas/` (git does not track it) at these commits:
- osrm-http.md: github.com/Project-OSRM/osrm-backend, commit 0d2de72d2db751a9d01ab15ca82695bf4dfbd28c, path `docs/http.md`
- nominatim-output.html: github.com/osm-search/Nominatim, commit 2a09655a1d8210a67169f4dd07cd8e75d2903a05, path `docs/api/Output.md` (the Markdown source of https://nominatim.org/release-docs/latest/api/Output/; nominatim.org itself is blocked by the sandbox firewall)

```sh
f() { git init -q /tmp/$1 && git -C /tmp/$1 fetch -q --depth 1 https://github.com/$2 $3 && git -C /tmp/$1 show FETCH_HEAD:$4 > .factory/schemas/$5; }
mkdir -p .factory/schemas
f osrm Project-OSRM/osrm-backend 0d2de72d2db751a9d01ab15ca82695bf4dfbd28c docs/http.md osrm-http.md
f nom osm-search/Nominatim 2a09655a1d8210a67169f4dd07cd8e75d2903a05 docs/api/Output.md nominatim-output.html
```

## How to run the app
- `.factory/run/setup.sh` (repo root): unpacks Leaflet 1.9.4 to /tmp/leaflet (npm pack) and starts `npm run start` (python http.server on :8000).
- `NODE_PATH=/opt/playwright/node_modules node .factory/run/scenarios.mjs [filter]` runs the AI scenarios of tests/ai (us1-s1 … us3-s1) through tests/ai/harness.mjs, prints one JSON line per scenario, screenshots go to `.factory/run/out/`.
- Known harness gap: tests/ai/harness.mjs does not push tile URLs into `log`; scenarios.mjs records page requests to check the `tile.openstreetmap.org/16/` URLs. Marker "same place" is checked by LatLng (marker CSS transforms change with the zoom).

## Smoke checks
1. test -s .factory/schemas/osrm-http.md && node --test test/osrm-fake.test.js
2. test -s .factory/schemas/osrm-http.md && node -e "import('./test/fakes/osrm.js').then(f => { const a = f.answerRoute('https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86?overview=full&geometrie=geojson'); if (a.status !== 400 || a.body.code !== 'InvalidOptions') process.exit(1); })"
3. test -s .factory/schemas/nominatim-output.html && grep -q display_name .factory/schemas/nominatim-output.html

## Real runs
- Real run against the live OSRM bike server (routing.openstreetmap.de): no, fakes only. The VMs cannot reach it, so AI tests use tests/ai/harness.mjs.
