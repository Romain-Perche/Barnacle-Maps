# Data Model: Reset View Button

There is no persistence. The only state is in memory and lasts one page load.

## Entity: View

| Field | Type | Rules |
|---|---|---|
| `lat` | number | finite, −90..90 |
| `lng` | number | finite, −180..180 |
| `zoom` | number | finite, within the map's zoom range (0..19) |

Existing instance: `DEFAULT_VIEW = { lat: 48.8566, lng: 2.3522, zoom: 13 }` in `src/app.js`.

## Entity: StartView (new, `src/view.js`)

Holds the map's starting view for this session.

| Field | Type | Description |
|---|---|---|
| `current` | View (read-only copy) | The view that Reset view returns to |
| `settled` | boolean | `true` once the location view has replaced the default |

### State transitions

```text
          create(DEFAULT_VIEW)
                 │
                 ▼
   ┌──────────────────────────┐  settle(lat,lng,zoom)  ┌───────────────────────────┐
   │ Default                  │ ─────────────────────► │ Settled                    │
   │ current = DEFAULT_VIEW   │   returns true         │ current = {lat,lng,zoom}   │
   │ settled = false          │                        │ settled = true             │
   └──────────────────────────┘                        └───────────────────────────┘
                                                         │ settle(...) again
                                                         └──► returns false, no change
```

### Rules (from spec)

- FR-003: starts as the default view and switches once to the location view, when the app first auto-centers on the user.
- FR-004: later `settle` calls (position updates) are no-ops. Searches, route display (`fitBounds`), destination `setView` and manual pan/zoom never write to StartView.
- `current` returns a copy, so callers can't change the stored view.
- `createStartView` and `settle` reject non-finite or out-of-range values (lat outside −90..90, lng outside −180..180, zoom outside 0..19): they throw `TypeError` and leave the state unchanged. So the stored view is always valid (FR-019, relied on by FR-018).

## Relationships

- `app.js` `onPosition` → `startView.settle(...)`. If it returns `true`, call `map.setView` to auto-center (this replaces the `centered` flag).
- ResetViewControl click → the reset in contracts/reset-view-control.md §Behavior (`setView` with `animate: false` under reduced motion, inside try/catch).
