# Contract: `formatDistance`

**Module**: `src/geo.js` (ES module, pure function, no DOM access, no network access at call time)

```js
export function formatDistance(meters, conv = convert): string
```

- `meters`: route length in metres (the OSRM `distance`). Any value is accepted.
- `conv`: the `convert` function from the `convert` package. It defaults to the module-level
  binding, which is `undefined` until the non-blocking import resolves, or for good if it fails. It is set only by tests
  (`null` checks the fallback).

## Output rules (with the package loaded)

| Input | Output | Rule |
|-------|--------|------|
| `0` | `"0 m"` | edge case |
| `0.4` | `"0 m"` | round to whole metres first |
| `420.4` | `"420 m"` | FR-002 |
| `999.4` | `"999 m"` | FR-002 |
| `999.6` | `"1 km"` | rounds to 1000 → km; never "1000 m" |
| `1000` | `"1 km"` | FR-003 |
| `1500` | `"1.5 km"` | FR-003 |
| `2000` | `"2 km"` | no trailing ".0" |
| `12345` | `"12.3 km"` | FR-003 |
| `1234567` | `"1234.6 km"` | always km, no thousands separator |
| `999.5` | `"1 km"` | boundary |
| `0.5` | `"1 m"` | boundary |
| `9999.96` | `"10 km"` | boundary |
| `NaN`, `undefined`, `null`, `"abc"`, `"5"`, `Infinity`, `-Infinity`, `-5` | `"—"` | FR-008, never "NaN" |

Always: exactly one space between the number and the unit, `.` as the decimal separator, at most
one decimal place, unit `m` or `km` (FR-002 to FR-004, SC-002).

## Fallback (package not loaded, `conv` is null or undefined)

| Input | Output |
|-------|--------|
| `1500` | `"1500 m"` |
| `420.4` | `"420 m"` |
| `412700` | `"412700 m"` |
| `NaN` | `"—"` |

The function never throws.

## Readiness

`export const distanceFormatReady: Promise<void>` resolves once the package import has settled,
whether it succeeded or failed. It never rejects. The app does not await it; tests do.

## Browser loading contract (`index.html`)

An import map, placed before `<script type="module" src="src/app.js">`, maps
`"convert"` → `https://unpkg.com/convert@8.0.2/dist/index.js`. The version must match
`package.json` `dependencies.convert` exactly.

## Call sites (unchanged)

- `src/app.js`: route list title `Route N · ${formatDistance(route.distance)} · ${formatDuration(...)}`
- `src/app.js`: fastest-route summary `${formatDistance(fastest.distance)} · ${formatDuration(...)}`
