# Contract: `src/view.js`

ES module with no DOM or Leaflet dependency, so it can be imported from Node tests.

```js
export function createStartView(defaultView) // → StartView
```

## `createStartView(defaultView)`

- `defaultView`: `{ lat: number, lng: number, zoom: number }`, all finite, with lat in −90..90, lng in −180..180 and zoom in 0..19 (bounds inclusive). Otherwise it throws `TypeError`.
- Returns a StartView object.

## StartView

| Member | Signature | Behavior |
|---|---|---|
| `current` | getter → `{ lat, lng, zoom }` | A fresh copy of the starting view on every read. Changing it has no effect on the stored view. |
| `settled` | getter → `boolean` | `false` until the first successful `settle`, then `true` for good |
| `settle(lat, lng, zoom)` | → `boolean` | If it has not settled yet, it stores `{lat, lng, zoom}` as the starting view, marks itself settled and returns `true`. Once settled, it returns `false` and changes nothing. Non-finite or out-of-range arguments (same ranges as `defaultView`) throw `TypeError` and leave the state unchanged. |

## Required test cases (`test/view.test.js`)

1. A new StartView reports `current` deep-equal to the default and `settled === false`.
2. The first `settle(48.9, 2.3, 15)` returns `true`. `current` becomes `{48.9, 2.3, 15}` and `settled` becomes `true`.
3. A second `settle(...)` with different values returns `false`, and `current` keeps the first location (FR-004).
4. Changing the object returned by `current` doesn't change the next `current`.
5. Invalid input (`NaN`, `undefined`, `Infinity`) to `createStartView` or `settle` throws `TypeError`. A failed `settle` leaves `settled === false`.
6. Out-of-range input throws `TypeError`: lat `90.1` / `-90.1`, lng `180.1` / `-180.1`, zoom `-1` / `20`, for both `createStartView` and `settle`. The bounds themselves (`90`, `-180`, `0`, `19`) are accepted. A failed `settle` leaves `current` and `settled` unchanged.
