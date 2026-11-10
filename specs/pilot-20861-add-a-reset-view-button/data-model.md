# Data Model: Reset View Button

## StartingView (in-memory, module state in `src/app.js`)

| Field | Type | Notes |
|-------|------|-------|
| center | `[lat, lng]` | Initially `DEFAULT_VIEW` lat/lng |
| zoom | number | Initially `DEFAULT_VIEW.zoom` (13) |

**Rules**
- Initialized to the default view at startup.
- Replaced exactly once: on the first position fix (`centered` false → true) with `{ center: first position, zoom: 15 }`.
- Never updated afterwards (not by later fixes, user panning, or searches). Not persisted.
- Read-only for the reset action; no other state (search, routes, destination, mode, markers, status) is read or written.
