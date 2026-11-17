# Test environment

## Services
- OSRM routing (routing.openstreetmap.de: routed-foot, routed-bike, routed-car): fake (test/fakes/osrm.js), checked against the schema `osrm-http.md`. It refuses unknown options and bad values, and answers errors (NoRoute) with HTTP 400 as the docs say. Real test account wanted: no (public service, no account).
- Nominatim search (nominatim.openstreetmap.org): fake jsonv2 answer (`nominatimPlace` in test/fakes/app-harness.js), fields from the schema `nominatim-output.html`. Real test account wanted: no.
- OSM map tiles (tile.openstreetmap.org): fake. Node tests use green RGBA data (test/fakes/app-harness.js). AI tests use generated 256×256 PNG tiles (tests/ai/harness.mjs). No schema: standard PNG. Real test account wanted: no.
- Leaflet 1.9.4 from unpkg.com: AI tests serve the real package, fetched with `npm pack leaflet@1.9.4` (registry.npmjs.org is reachable). Node tests use a fake Leaflet (test/fakes/app-harness.js).

## Schemas
- osrm-http.md: https://raw.githubusercontent.com/Project-OSRM/osrm-backend/master/docs/http.md
- nominatim-output.html: https://nominatim.org/release-docs/latest/api/Output/

## Smoke checks
1. test -s .factory/schemas/osrm-http.md && node --test test/osrm-fake.test.js
2. test -s .factory/schemas/osrm-http.md && node -e "import('./test/fakes/osrm.js').then(f => { const a = f.answerRoute('https://routing.openstreetmap.de/routed-bike/route/v1/bike/2.35,48.85;2.36,48.86?overview=full&geometrie=geojson'); if (a.status !== 400 || a.body.code !== 'InvalidOptions') process.exit(1); })"
3. test -s .factory/schemas/nominatim-output.html && grep -q display_name .factory/schemas/nominatim-output.html

## Real runs
- Real run against the live OSRM bike server (routing.openstreetmap.de): no, fakes only. The VMs cannot reach it, so AI tests use tests/ai/harness.mjs.
