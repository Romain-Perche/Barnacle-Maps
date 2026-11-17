# Files

- [Place search and suggestions](place-search.md) - How the search panel queries Nominatim while typing or on submit, biases results near the user's position, sorts them nearest first with a distance column, and drops stale responses.
- [Pleasure score](pleasure-score.md) - How walking routes get a "pleasure" indicator by counting green pixels on zoom-16 OpenStreetMap tiles along each route, with its limits, timeout and failure behaviour.
- [Routing and travel modes](routing.md) - How Barnacle Maps asks OSRM for walking or car routes from the user's position through any stops to the destination, adds detour alternatives for short walks, picks up to 3 distinct routes and draws them.
- [Stops](stops.md) - How users add up to five intermediate stops from search results or map clicks, reorder and remove them, and how stops change route computation.
