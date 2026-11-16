# Contracts: QR Code of the Selected Route

## 1. `phoneRouteUrl(from, to, mode = "foot")` (`src/geo.js`)

Pure function. It needs no DOM and no network.

- **Input**:
  - `from`, `to`: `{ lat: number, lng: number }`
  - `mode`: a key of `TRAVEL_MODES`
- **Output**: a `string` URL, or `null` if `from` or `to` is missing or has a coordinate that isn't a finite number.
- **Format**:

  ```text
  https://www.openstreetmap.org/directions?engine=<TRAVEL_MODES[mode].osmEngine>&route=<from.lat>%2C<from.lng>%3B<to.lat>%2C<to.lng>
  ```

  Each coordinate is written with `Number(x).toFixed(5)`. The query is built with `URLSearchParams`, so `,` becomes `%2C` and `;` becomes `%3B`. An unknown `mode` uses `foot`.
- **Examples** (these are the test fixtures):

  | from | to | mode | result |
  |------|----|------|--------|
  | `{lat:48.8566,lng:2.3522}` | `{lat:48.860611,lng:2.337644}` | `foot` | `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=48.85660%2C2.35220%3B48.86061%2C2.33764` |
  | same | same | `car` | `…?engine=fossgis_osrm_car&route=48.85660%2C2.35220%3B48.86061%2C2.33764` |
  | same | same | `"bike"` (unknown) | same result as `foot` |
  | `{lat:-33.8688,lng:151.2093}` | `{lat:-33.85,lng:151.2}` | `foot` | `…&route=-33.86880%2C151.20930%3B-33.85000%2C151.20000` |
  | `null` | any | any | `null` |
  | `{lat:NaN,lng:2}` | any | any | `null` |

## 2. `qrImageSrc(factory, text)` (`src/qr.js`)

- **Input**:
  - `factory`: the `qrcode-generator` factory (`window.qrcode`), or anything else.
  - `text`: the string to encode.
- **Output**: `"data:image/svg+xml," + encodeURIComponent(svg)`, where `svg` comes from:

  ```js
  const qr = factory(0, "L");
  qr.addData(text);
  qr.make();
  qr.createSvgTag({ cellSize: 1, margin: 4, scalable: true });
  ```

- **Failure**: returns `null` when `factory` isn't a function, when `text` is empty, or when any of those calls throws. It never throws itself (FR-010).

## 3. UI contract: phone card (Design A, FR-001/007/008)

The card is placed in `#panel`, right after `#status`:

```html
<div id="phone" hidden>
  <img id="phone-qr" width="120" height="120" alt="QR code to open this route on your phone">
  <div class="phone-text">
    <strong>Continue on your phone</strong>
    <span>Scan with your phone camera.</span>
    <a id="phone-link" target="_blank" rel="noopener">Open on your phone ↗</a>
    <span id="phone-stops" hidden>Stops are not included in the phone link.</span>
  </div>
</div>
```

Invariants:

- When the card is visible, `#phone-qr.src` encodes exactly `#phone-link.href`. Both come from one `phoneRouteUrl(...)` call.
- `#phone` is hidden whenever `#routes` is empty.
- `#phone-stops` is visible only if the displayed routes were computed with at least one stop.
- The library script tag is placed before `src/app.js`, pinned to `qrcode-generator@2.0.4` with SRI (see [research.md](../research.md) R2).
