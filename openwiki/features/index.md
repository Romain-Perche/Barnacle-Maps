# Files

- [Distance and duration formatting](distance-formatting.md) - How route distances are formatted with the convert package (loaded non-blocking via an import map in the browser, node_modules in Node) with a whole-metre fallback, and how durations are formatted.
- [Pleasure indicator (green pixels)](pleasure.md) - How walking routes get a best-effort "pleasure" score by counting green pixels of OpenStreetMap tiles (zoom 16) along each route, with tile, distance and time limits.
- [Routing, travel modes and route selection](routing.md) - How Barnacle Maps asks OSRM for walking or car routes from the user's position, forces walking detours when OSRM has no alternative, de-duplicates to at most 3 routes, and draws and selects them.
- [Place search and suggestions](search.md) - How the search box queries Nominatim on submit and as debounced suggestions while typing, parses results, drops superseded responses and offers "go" or "Add as stop" per result.
- [Stops](stops.md) - How users add, reorder and remove up to 5 ordered stops (from search results or map clicks), how duplicates are rejected, and how stops change routing.
