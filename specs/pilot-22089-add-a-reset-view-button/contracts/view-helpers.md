# Module Contract: view helpers in `src/geo.js`

New pure exports (no DOM, no fetch), unit tested in `test/view.test.js`.

## `DEFAULT_VIEW`

```js
export const DEFAULT_VIEW = { lat: 48.8566, lng: 2.3522, zoom: 13 };
```

The view the map opens on (central Paris). `src/app.js` imports it instead of defining its own
copy. Value unchanged from today.

## `LOCATED_ZOOM`

```js
export const LOCATED_ZOOM = 15;
```

Zoom used when the app centers on the user's first location (replaces the literal `15` in
`onPosition`). The `15` used by `showRoute` for a destination without a known position is a
different concern and stays as is.

## `locatedView(position)`

```js
locatedView({ lat, lng }) → { lat, lng, zoom: LOCATED_ZOOM }
```

- Returns a **new** object; later changes to the argument do not affect the result.
- Copies only `lat` and `lng` (extra fields such as `accuracy` are ignored).

## Tests (`test/view.test.js`)

1. `DEFAULT_VIEW` is central Paris at zoom 13.
2. `LOCATED_ZOOM` is 15.
3. `locatedView({ lat: 48.86, lng: 2.34 })` deep-equals `{ lat: 48.86, lng: 2.34, zoom: 15 }`.
4. Mutating the input after the call does not change the returned view.
5. Extra input fields are not copied.
