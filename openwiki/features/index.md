# Files

- [Arrival time](arrival-time.md) - How each route in the panel shows "arrive HH:MM" if you leave now — the pure arrivalTime/formatArrival helpers (rounding, next-day suffix, DST-safe day counting), when the departure instant is taken, and which events refresh it.
- [Pleasure indicator](pleasure.md) - How walking routes get a "pleasure" score by counting green pixels (parks, grass, woods) of OpenStreetMap zoom-16 tiles along each route, the limits that make it unavailable, and how it stays best-effort and cancellable.
- [Routing and travel modes](routing.md) - How Barnacle Maps asks OSRM for walking or car routes, forces walking detours when OSRM has no alternative, keeps up to three distinct routes with pickRoutes, and draws, selects and summarises them.
- [Place search](search.md) - How the search box queries Nominatim on submit and as debounced suggestions while typing, how results are parsed and rendered with "route" and "Add as stop" actions, and how stale searches are discarded.
- [Stops (multi-leg journeys)](stops.md) - How users add up to five ordered stops from search results or by clicking the map, how duplicates and the limit are enforced, how stops are reordered, removed and rendered, and how they change routing.
