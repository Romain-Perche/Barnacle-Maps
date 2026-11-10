# Data Model: Reset View Button

No persisted data. One in-memory value per page load.

## Entity: View

A map position, used for both the default view and the starting view.

| Field  | Type   | Rules |
|--------|--------|-------|
| `lat`  | number | Finite, −90..90 |
| `lng`  | number | Finite, −180..180 |
| `zoom` | number | Integer, within the tile layer's range (0..19) |

Constants (in `src/geo.js`, see [contracts/view-helpers.md](./contracts/view-helpers.md)):

- `DEFAULT_VIEW = { lat: 48.8566, lng: 2.3522, zoom: 13 }` (central Paris; moved from `app.js`, same value)
- `LOCATED_ZOOM = 15` (the zoom the app already uses when it centers on the first fix)

## Entity: Starting view (`startView` in `src/app.js`)

The reset target. A `View`, owned by `app.js`, read only by the reset action.

### Lifecycle / state transitions

```text
            page load
                │
                ▼
   ┌──────────────────────────┐   first successful geolocation fix
   │ Default                  │   (onPosition with centered === false)
   │ startView = DEFAULT_VIEW │ ─────────────────────────────────────┐
   └──────────────────────────┘                                      ▼
                                       ┌──────────────────────────────────────────────┐
                                       │ Located (final for this page load)           │
                                       │ startView = locatedView(first fix)           │
                                       │           = { lat, lng, zoom: LOCATED_ZOOM } │
                                       └──────────────────────────────────────────────┘
```

- **Default → Located**: exactly once, at the same moment the app centers on the first fix
  (the existing `centered` flag flips to `true` in the same branch).
- **Stays Default** forever when geolocation is unsupported, denied, or never succeeds.
- **No other transitions.** In particular these never change `startView` (FR-004):
  later `onPosition` calls (live updates), user pan/zoom, `showRoute`'s `setView` when no position
  is known yet, `drawRoutes`' `fitBounds`, search, mode change, route selection, and pressing Reset view.

### Read access

`resetView()` reads `startView` and calls `map.setView([startView.lat, startView.lng], startView.zoom)`.
It writes no app state (FR-005): `position`, `userMarker`, `destMarker`, `routeLayers`,
`selectedRoute`, `routeSeq`, `searchSeq`, `pleasureAbort`, `mode`, `currentPlace`, the input,
results, routes list and status text are all left untouched.
