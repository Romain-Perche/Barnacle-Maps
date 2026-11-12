# Files

- [Pure geo helpers (src/geo.js)](geo-helpers.md) - Reference for src/geo.js, the side-effect-free helper module of Barnacle Maps covering distances, local geometry, formatting, Nominatim/OSRM URL building and parsing, route selection, stops and the pleasure pixel maths.
- [Architecture overview](overview.md) - How Barnacle Maps is built. It is a static, build-free page with Leaflet, a browser module (src/app.js) that owns DOM, state and network calls, and a pure helper module (src/geo.js). This page also covers the search → route → pleasure flow and how stale requests are discarded.
