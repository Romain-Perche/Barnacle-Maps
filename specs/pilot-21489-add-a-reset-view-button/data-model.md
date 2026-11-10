# Data Model: Reset View Button

## StartView (in-memory, session only)
| Field | Type | Notes |
|-------|------|-------|
| lat | number | Centre latitude |
| lng | number | Centre longitude |
| zoom | number | Zoom level |

**Initial value**: `DEFAULT_VIEW` (48.8566, 2.3522, zoom 13).

**Transitions** (at most one):
- `default` → `located` on the first geolocation fix (the same moment the map auto-centres): `{lat: fix.lat, lng: fix.lng, zoom: 15}`.
- Any later event (position updates, pan, zoom, search, routes, button press) leaves it unchanged.

**Validation**: Located transition is accepted only once; subsequent calls are ignored. Not persisted across reloads.
