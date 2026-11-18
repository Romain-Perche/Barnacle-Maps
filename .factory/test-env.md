# Test environment

## Services
- OSRM route service (routing.openstreetmap.de/routed-foot, routed-car, routed-bike): fake (test/fakes/osrm.js), checked against the schema `osrm-http.md` (the OSRM HTTP API docs: path `/route/v1/{profile}/{coordinates}`, route options and their values, Route object, NoRoute code). Used by test/bike.test.js and, in the browser, by tests/ai/support/fake-services.mjs. Real test account wanted: no (public service, no account; the VM firewall blocks it).
- Nominatim search (nominatim.openstreetmap.org): fake in the AI scenarios only (tests/ai/support/fake-services.mjs), jsonv2 fields `display_name`, `lat`, `lon` (strings) per https://nominatim.org/release-docs/latest/api/Output/. The feature does not change these requests. Real test account wanted: no.
- OSM tiles (tile.openstreetmap.org): fake in the AI scenarios only, solid 256×256 PNGs (park green when the tile x is even, land beige when odd). Real test account wanted: no.
- unpkg.com (Leaflet 1.9.4): blocked; the AI scenarios serve a local copy made with `npm pack leaflet@1.9.4` (the npm registry is reachable).

## Schemas
- osrm-http.md: https://raw.githubusercontent.com/Project-OSRM/osrm-backend/master/docs/http.md

## Smoke checks
1. test -s .factory/schemas/osrm-http.md && node -e 'import("./test/fakes/osrm.js").then(({loadOsrmSchema,checkRouteRequest})=>{const s=loadOsrmSchema();try{checkRouteRequest("https://x/route/v1/bike/2.35,48.85;2.36,48.86?alternative=3",s);process.exit(1)}catch(e){if(!/alternative/.test(e.message))process.exit(1);checkRouteRequest("https://x/route/v1/bike/2.35,48.85;2.36,48.86?overview=full&geometries=geojson&alternatives=3",s)}})'

## Real runs
- Real OSRM bike server from the VM (real cycling durations, SC-002): no, fake OSRM only (the firewall blocks routing.openstreetmap.de).
