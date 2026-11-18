# Files

- [Place search and suggestions](place-search.md) - How the search box queries Nominatim, shows debounced suggestions while the user types, drops out-of-date replies, and turns a result into a destination or a stop.
- [Pleasure score](pleasure-score.md) - How walking and bike routes get a "pleasure" indicator by counting green map pixels (parks, grass, woods) on OpenStreetMap tiles along each route, with its limits, cancellation and failure states.
- [Routing and travel modes](routing-and-travel-modes.md) - How Barnacle Maps computes and shows up to three walk, car or bike routes with OSRM, covering the TRAVEL_MODES table, the segmented mode selector, URL building, alternatives, walking-only detours, route de-duplication, drawing and status messages.
- [Stops (multi-point journeys)](stops.md) - How users add, reorder and remove up to five intermediate stops, how the stops list is kept, and how stops change route requests, detours and the pleasure limits.
