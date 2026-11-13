# Research: Format distances with a small library

All Technical Context items are resolved; nothing is left as NEEDS CLARIFICATION.

## 1. Which package

**Decision**: [`convert`](https://convert.js.org/) **8.0.2** by Jonah Snider. MIT licence, zero
dependencies, ESM (`"type": "module"`), described as "the smallest & fastest library for … unit
conversions". It has a `"best"` target that picks the most readable unit.

**Rationale**:
- It handles both unit selection and conversion: `convert(1500, "m").to("best", "metric")` →
  `{ quantity: 1.5, unit: "km" }`. That removes the hand-written `meters < 1000` and `/ 1000`
  logic (SC-005).
- The `"metric"` best-unit list for length never goes above `km` (1,234,567 m → 1234.567 km;
  10⁹ m → 1,000,000 km), as the spec's "never megametres" edge case requires.
- It has no transitive dependencies. Its ESM entry point (`dist/index.js`, about 2 KB plus a few
  small relative modules) runs directly from unpkg with no bundling.
- MIT licence, actively published (v8 line), and widely used.

**Verified locally** (Node 26, `convert@8.0.2`) with the planned function:
0 → "0 m", 0.4 → "0 m", 420.4 → "420 m", 999.4 → "999 m", 999.6 → "1 km", 1000 → "1 km",
1500 → "1.5 km", 2000 → "2 km", 12345 → "12.3 km", 1234567 → "1234.6 km", NaN/undefined/null/-5 → "—".

**Alternatives considered**:
- `convert-units` 2.3.4: brings in `lodash.keys` and `lodash.foreach` (transitive dependencies,
  not preferred under FR-005), is CommonJS only (it does not load as an ES module from unpkg
  without a bundler), and its `toBest()` also needs extra exclusions.
- `Intl.NumberFormat` with `style: "unit"` (native, no package): this would be the simplest
  choice, but it does not pick m vs km, and FR-005 explicitly requires an npm package.
- Number formatters such as `numeral` or `pretty-bytes`: they do not handle distances and units.
- `@turf/helpers` `convertLength`: this converts but does not pick a unit, and it is part of a large suite.

**Limitation worth knowing**: for 0 the package picks `mm` as the best unit, and for values under
1 m it picks `cm`. Both cases disappear once the value is rounded to whole metres, except 0, which
gets one explicit guard.

## 2. Loading the package in the browser without a build step

**Decision**: Add an import map in `index.html`, placed before the app module script:

```html
<script type="importmap">{ "imports": { "convert": "https://unpkg.com/convert@8.0.2/dist/index.js" } }</script>
```

`src/geo.js` imports the bare specifier `"convert"`.

**Rationale**: The same source line resolves to unpkg in the browser and to
`node_modules/convert` in Node (package `exports` → `dist/index.js`). There is no test-only path
switch. The unpkg file uses relative imports (`./converters/convert.js`, …), which resolve inside
the same pinned package URL. Leaflet is already loaded from the same CDN (as clarified in the spec).

**Alternatives considered**: Hard-coding the full unpkg URL in `geo.js` would break the Node tests,
which import `geo.js` and would need network access. unpkg `?module` mode is deprecated and not
needed because the package is already ESM. Vendoring the file into the repo would go against the
clarified answer (CDN).

## 3. Surviving a CDN failure

**Decision**: Start `import("convert")` at module load **without awaiting it**. The promise is
exported as `distanceFormatReady`, and on success it sets a module-level `convert`. While
`convert` is `undefined` (still loading, or failed), `formatDistance` returns the fallback format.
This was revised after the check-plan-completeness decision on CHK022: the app never waits for the package.

**Rationale**: A failed static import makes the whole module graph (`app.js`) fail, so the map,
search and routing would not work either. A caught dynamic import keeps every other module working
(FR-006). Awaiting at the top level would make a slow CDN delay the whole app, which is why the import is not awaited.

**Alternatives considered**: A hand-written km fallback that copies the old logic would satisfy
FR-003 even offline, but it brings back the code that SC-005 asks to remove, and FR-006 now requires whole metres only
in the fallback. Loading the package lazily inside `formatDistance` would make the function
asynchronous and change both call sites for no benefit.

## 4. Tests in Node

**Decision**: Add `"dependencies": { "convert": "8.0.2" }` to `package.json` and commit the
generated `package-lock.json`. Add a `node_modules/` line to the existing `.gitignore`. Contributors run
`npm install` once before `npm test`; the README says so. `npm start` does not change (SC-003).

To test the fallback, call `formatDistance(1500, null)`. The optional second parameter avoids
module mocking. Tests that use the package first `await distanceFormatReady` (in a `before` hook).
