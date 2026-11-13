# Files

- [Pleasure score (green pixels)](pleasure.md) - Walking routes are scored by counting green (park, grass, wood) pixels on zoom-16 OpenStreetMap tiles along each route; the route with the most green is marked "most pleasant". Covers limits, timeout and failure behaviour.
- [Routing: travel modes, alternatives and detours](routing.md) - How Barnacle Maps asks OSRM for walking or car routes from the user's position through the stops to the destination, forces detour alternatives for short walks, keeps up to three distinct routes, and draws and selects them.
- [Place search, suggestions and the clear button](search.md) - How the search box queries Nominatim on submit and with debounced suggestions while typing, how results become a destination or a stop, and what the × clear button resets.
- [Stops](stops.md) - The ordered list of up to five intermediate stops — added from search results or by clicking the map — that every route passes through in order; covers duplicates, reordering, removal and the effect on routing.
