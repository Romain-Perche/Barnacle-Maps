# Contract: `createStartView` (src/geo.js)

A pure helper with no DOM access and no fetch, so it can be tested in Node. Entity details: [data-model.md](../data-model.md).

```js
export function createStartView(defaultView) // → { get(), setOnce(view) }
```

## `createStartView(defaultView)`

- `defaultView`: `{ lat, lng, zoom }`, all finite numbers.
- Throws `TypeError` if `defaultView` is missing or any field is not a finite number.
- Returns a new, independent holder. The holder keeps a **copy** of `defaultView`, so changing the argument later has no effect.

## `holder.get()`

- Returns a new object `{ lat, lng, zoom }` with the current starting view.
- Changing the returned object does not change the holder.

## `holder.setOnce(view)`

- The first call with a valid view stores a copy of it and returns `true`.
- Every later call returns `false` and changes nothing (FR-004).
- If `view` is invalid (missing, or a non-finite `lat`/`lng`/`zoom`), it returns `false`, changes nothing, and does **not** use up the one-time set.

## Required test cases (`test/startview.test.js`)

1. `get()` returns the default view right after creation.
2. `setOnce(v)` returns `true`, and `get()` then returns `v`.
3. A second `setOnce(w)` returns `false`, and `get()` still returns `v`.
4. Changing the object returned by `get()`, or the original argument, does not change the stored view.
5. `setOnce` with invalid input returns `false` and a later valid `setOnce` still succeeds.
6. `createStartView()` with invalid input throws `TypeError`.
7. Two holders do not share state.
