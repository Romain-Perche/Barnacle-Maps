# Barnacle Maps

A small navigation web app: shows a map, your live position, lets you search for a place and shows up to 3 routes to it, each with distance and duration. Switch between walking and car in the panel; walking routes also get a pleasure indicator (walking only). Pick a route in the panel or click it on the map.

- Map: [Leaflet](https://leafletjs.com) + OpenStreetMap tiles
- Search: Nominatim geocoding
- Routing: OSRM foot profile (routing.openstreetmap.de), with alternatives; when OSRM has none, detour routes through a side waypoint are tried
- Car routes: OSRM car profile (`routing.openstreetmap.de/routed-car`), up to 3 alternatives, without the pleasure indicator.
- Pleasure: [Overpass API](https://overpass-api.de) (one request per destination). The 1–5 score is the share of the walk near green areas, water or pedestrian ways, minus a penalty for busy roads. It is a best-effort heuristic and shows "Pleasure unavailable" if Overpass fails or the walk is very long.

No build step or dependencies. Run `npm start` and open http://localhost:8000 (geolocation requires localhost or HTTPS). Run tests with `npm test`.
