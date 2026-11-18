# Files

- [Pleasure score](pleasure-score.md) - The best-effort "pleasure" indicator for walking and cycling routes - counts green pixels (parks, grass, woods) on zoom-16 OpenStreetMap tiles along each route and marks the most pleasant one.
- [Routing and travel modes](routing-and-travel-modes.md) - How Barnacle Maps gets up to 3 routes from OSRM for walking, cycling or driving - the TRAVEL_MODES table, routeUrl, NoRoute handling, forced walking detours, pickRoutes de-duplication, and drawing and selecting routes.
- [Place search](search.md) - How Barnacle Maps searches places with Nominatim - submitted searches and debounced suggestions while typing, result parsing, stale-answer guarding, and choosing a result as destination or stop.
- [Stops](stops.md) - Intermediate stops in Barnacle Maps - adding up to 5 from search results or map clicks, duplicate detection, reordering, removing and clearing, and how stops change routing and the pleasure score.
