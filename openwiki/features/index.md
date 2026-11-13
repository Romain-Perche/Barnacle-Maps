# Files

- [Place search](place-search.md) - How the search box queries Nominatim on submit and with debounced suggestions while typing, parses up to five results, and lets the user route to a result or add it as a stop.
- [Route summary card](route-summary-card.md) - The
- [Routing and travel modes](routing.md) - How routes are requested from OSRM (walking or car profile), how extra detour routes are forced for short walks, how candidates are filtered to up to three distinct routes, and how routes are drawn and selected.
- [Stops](stops.md) - Users can add up to five ordered stops from search results or by clicking the map; stops can be reordered, removed or cleared, survive mode and destination changes, and make routes pass through each stop in order.
- [Walking pleasure score](walking-pleasure.md) - For walking routes, the app downloads OpenStreetMap tiles at zoom 16 along each route and counts green pixels (parks, grass, woods); the route with the most is marked "most pleasant". Scoring is best-effort, bounded and abortable.
