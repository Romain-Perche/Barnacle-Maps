# Data Model: Reset View Button

All state is in memory in the browser. Nothing is saved between visits.

## View

A map position.

| Field | Type | Rules |
|-------|------|-------|
| `lat` | number | finite, -90 ≤ lat ≤ 90 |
| `lng` | number | finite, -180 ≤ lng ≤ 180 |
| `zoom` | number | finite, 0 ≤ zoom ≤ 19 (tile layer `maxZoom`) |

Known values:
- `DEFAULT_VIEW` = `{ lat: 48.8566, lng: 2.3522, zoom: 13 }` (Paris; already in `src/app.js`)
- Location view = `{ lat: <first fix lat>, lng: <first fix lng>, zoom: 15 }`

## StartView (holder, from `createStartView`)

Holds the view the "Reset view" control goes back to. API in [contracts/start-view-helper.md](./contracts/start-view-helper.md).

| Field (internal) | Type | Meaning |
|------------------|------|---------|
| `view` | View | Current starting view; starts as a copy of the default view |
| `locked` | boolean | `false` until `setOnce` succeeds, then always `true` |

### State transitions

```text
          setOnce(locationView)            setOnce(anything)
[Default] ─────────────────────▶ [Locked] ───────────────────▶ [Locked] (no change, returns false)
 view = DEFAULT_VIEW               view = locationView
```

- `Default` → `Locked`: only at the first location fix, in the same branch of `onPosition` where the app centers the map (FR-003).
- `Locked` is final for the session (FR-004). Later fixes, searches, route selections and resets do not change it.
- If geolocation is denied or unsupported, the holder stays in `Default` and resets go to Paris at zoom 13 (scenario 1.5).

## Relationships

- `src/app.js` owns one StartView instance, created at startup with `DEFAULT_VIEW`.
- The `ResetViewControl` reads `startView.get()` on each activation and passes it to `map.setView`. It never writes to it or to any other app state (FR-005).
