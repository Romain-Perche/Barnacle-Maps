# Data Model: Reset View Button

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

All state is in memory, in the browser tab. Nothing is stored or sent anywhere.

## View

A map center and zoom level.

| Field  | Type   | Rules                                   |
|--------|--------|-----------------------------------------|
| `lat`  | number | -90..90, finite                         |
| `lng`  | number | -180..180, finite                       |
| `zoom` | number | integer, 0..19 (tile layer `maxZoom`)   |

Existing instance: `DEFAULT_VIEW = { lat: 48.8566, lng: 2.3522, zoom: 13 }` in `src/app.js`
(the fixed default view).

## Starting view (`startView`, module state in `src/app.js`)

The View that "Reset view" returns to.

- **Initial value**: a copy of `DEFAULT_VIEW` when the app loads.
- **Set once**: on the first location fix (the existing `if (!centered)` branch of `onPosition`),
  it becomes `{ lat: fix.lat, lng: fix.lng, zoom: LOCATE_ZOOM }` with `LOCATE_ZOOM = 15`.
- **Never changes again** for the life of the page (FR-002a): later fixes, searches, routes and
  user pan/zoom do not update it.
- **Not persisted** (spec assumption): a reload starts again from `DEFAULT_VIEW`.

Computed by the pure helper `startingView(firstFix, defaultView, locateZoom)` in `src/geo.js`
(see [contracts/reset-view.md](./contracts/reset-view.md)).

### State transitions

```text
          page load
              │
              ▼
   ┌─────────────────────┐   first location fix    ┌──────────────────────────┐
   │ DEFAULT (fixed view)│ ──────────────────────▶ │ LOCATED (first fix, z15) │
   └─────────────────────┘                         └──────────────────────────┘
     ▲  location denied /                             later fixes: no change
     └─ unsupported / not yet found: stays here
```

## Unchanged state (FR-003)

"Reset view" reads `startView` and writes only the map's center and zoom. It does not read or
write: `position`, `userMarker`, `destMarker`, `routeLayers`, `selectedRoute`, `routeSeq`,
`pleasureAbort`, `centered`, `mode`, `currentPlace`, search input/results, or the status text.
