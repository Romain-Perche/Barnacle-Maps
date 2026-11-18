# Data Model

**Search result** (`parseSearchResults` output, unchanged): `{ name: string, lat: number, lng: number }`.
After `sortByDistance(results, position)` it gains `distance: number` (metres, straight-line, ≥ 0) only when a position is known.

**User position**: `{ lat, lng }` (the app's existing `position`, or `null`). Not persisted.

**Near box** (derived, for the search URL): `{ left, top, right, bottom }` degrees, centred on the position, half-size `NEAR_BOX_DEG = 0.25` in latitude (longitude scaled by 1/cos(lat)), clamped to ±180/±90.

Ordering rule: ascending `distance`; ties keep input order; `null` position ⇒ input order, no `distance`.
