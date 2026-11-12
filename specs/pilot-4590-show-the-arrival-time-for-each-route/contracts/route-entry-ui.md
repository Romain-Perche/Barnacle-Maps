# Contract: route entry text in the panel (`#routes`)

Each `<li>` in `#routes` contains one `<button>` (the accessible name is its text content) with:

1. Title `<span>`: `Route {n} · {formatDistance} · {formatDuration}, {formatArrival}`
   - e.g. `Route 1 · 1.20 km · 25 min, arrive 14:32`
   - e.g. `Route 2 · 18.4 km · 1 h 20 min, arrive 00:15 (+1 day)`
2. Walking mode only: the existing `.pleasure` `<span>`, unchanged.

Rules:
- All entries of one computation use the same departure time.
- The text is rebuilt whenever routes are recomputed (`updateRoutes`). It is never updated otherwise.
- No arrival text appears when no routes are listed (errors and "No … route found" stay as they are).
- The `#status` summary line is unchanged.
- `aria-pressed`, selection, and map click behaviour are unchanged.
