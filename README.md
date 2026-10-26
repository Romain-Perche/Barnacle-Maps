# Barnacle Maps

A small navigation web app: shows a map, your live position, lets you search for a place and draws the shortest walking route to it.

- Map: [Leaflet](https://leafletjs.com) + OpenStreetMap tiles
- Search: Nominatim geocoding
- Routing: OSRM foot profile (routing.openstreetmap.de)

No build step or dependencies. Run `npm start` and open http://localhost:8000 (geolocation requires localhost or HTTPS). Run tests with `npm test`.
