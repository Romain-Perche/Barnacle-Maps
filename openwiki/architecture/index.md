# Files

- [App state and request lifecycle](app-state-and-lifecycle.md) - How src/app.js keeps its state in module-level variables, reacts to geolocation, and uses sequence counters so stale search and routing responses never overwrite newer ones.
- [Architecture overview](overview.md) - Barnacle Maps is a dependency-free static web app; index.html loads Leaflet from unpkg and the ES module src/app.js, which drives the UI and calls OpenStreetMap services, with pure logic in src/geo.js.
