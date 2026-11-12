# Barnacle Maps

A small navigation web app: shows a map, your live position, lets you search for a place and shows up to 3 routes to it, each with distance, duration and the arrival time if you leave now. Switch between walking and car in the panel; walking routes also get a pleasure indicator (walking only). Pick a route in the panel or click it on the map.

- Map: [Leaflet](https://leafletjs.com) + OpenStreetMap tiles
- Search: Nominatim geocoding
- Routing: OSRM foot profile (routing.openstreetmap.de), with alternatives; when OSRM has none, detour routes through a side waypoint are tried
- Car routes: OSRM car profile (`routing.openstreetmap.de/routed-car`), up to 3 alternatives, without the pleasure indicator.
- Stops: add up to 5 stops with "Add as stop" next to a search result, or by clicking the map and choosing "Add stop here". Routes go from your position through every stop, in list order, to the destination. Reorder stops with the arrows, remove one, or use "Clear stops"; stops are kept when you change the travel mode or the destination. With stops, OSRM usually returns fewer alternatives (often a single route) and no detour routes are added.
- Pleasure: counts the green pixels (parks, grass, woods in the OpenStreetMap style) on the OSM map tiles (zoom 16) along each walking route. The route with the most green pixels is marked "most pleasant". It shows "Pleasure unavailable" if tiles cannot be loaded or the walk is very long.

No build step or dependencies. Run `npm start` and open http://localhost:8000 (geolocation requires localhost or HTTPS). Run tests with `npm test`.
