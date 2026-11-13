# Quickstart: validate "Format distances with a small library"

## Prerequisites

- Node.js 26+ (tests), Python 3 (static server), a browser with network access to unpkg.com

## 1. Automated tests

```bash
npm install          # installs convert@8.0.2 (the only dependency)
npm test             # node --test test/
```

Expected: all tests pass. The `formatDistance` tests in `test/geo.test.js` cover every row of
[contracts/format-distance.md](./contracts/format-distance.md), including the fallback (`conv = null`).
No test still expects `"1.50 km"`.

## 2. Dependency check (US2, SC-003)

```bash
node -e "console.log(require('./package.json').dependencies)"   # { convert: '8.0.2' } only
grep -n 'convert@8.0.2' index.html                               # the import map entry
grep -n 'toFixed\|/ 1000\|< 1000' src/geo.js                    # nothing left in formatDistance except the single toFixed(1) on the package's quantity
```

## 3. In the browser (US1)

```bash
npm start            # python3 -m http.server 8000; no build step
```

Open http://localhost:8000 and allow geolocation.

1. Search for a place about 1–2 km away with **Walk** selected. Route lines read, for example,
   "Route 1 · 1.4 km · 18 min". The summary shows the same distance text for the fastest route.
2. Search for a place under 1 km away. Distances read, for example, "650 m".
3. Switch to **Car** and search for a distant city. Distances read, for example, "412.7 km",
   with no thousands separator and no other unit.
4. No distance ever shows two decimals, a trailing ".0", or "NaN".

## 4. CDN failure (FR-006)

In DevTools → Network, block `unpkg.com/convert*` (leave Leaflet unblocked) and reload. Expected:
the map appears without waiting for the package; search, routes and stops all work; and distances show as whole metres (for example
"1432 m"). There are no uncaught errors in the console.
