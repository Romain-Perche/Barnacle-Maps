# Files

- [App state, UI panel and request sequencing](app-state-and-ui.md) - How src/app.js keeps its state in module-level variables, renders the floating panel, reports status, and uses sequence counters and an AbortController to drop stale network responses.
- [Architecture overview](overview.md) - Barnacle Maps is a dependency-free static web app; index.html loads Leaflet from a CDN and the ES module src/app.js, which drives the UI and network calls while src/geo.js holds pure, unit-tested helpers.
