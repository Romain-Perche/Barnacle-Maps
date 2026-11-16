# Data Model: QR Code of the Selected Route

Nothing is stored. All state lives in memory in the browser page.

## Travel mode (extended)

The `TRAVEL_MODES` entries in `src/geo.js` get one new field:

| Key | label | base (unchanged) | profile (unchanged) | **osmEngine** (new) |
|-----|-------|------------------|---------------------|---------------------|
| `foot` | Walk | `https://routing.openstreetmap.de/routed-foot` | `foot` | `fossgis_osrm_foot` |
| `car` | Car | `https://routing.openstreetmap.de/routed-car` | `driving` | `fossgis_osrm_car` |

## Phone link

The web address encoded in the QR code. It is derived data and is never stored.

| Field | Source | Rule |
|-------|--------|------|
| start `{lat, lng}` | the `position` captured when `updateRoutes()` started the displayed request | must be finite numbers |
| destination `{lat, lng}` | `currentPlace` of the displayed request | must be finite numbers |
| mode | `m` of the displayed request | `foot` or `car`; an unknown mode falls back to `foot` (same as `routeUrl`) |

The format is in [contracts/phone-link.md](contracts/phone-link.md). Coordinates are written in lat,lng order with exactly 5 decimals (FR-004). Stops and the chosen alternative are **not** part of the link.

## QR code

The image of the phone link.

| Field | Value |
|-------|-------|
| content | the phone link string, in Byte mode |
| error correction | `L` |
| version | automatic (`typeNumber` 0) |
| quiet zone | 4 modules |
| rendering | SVG data URL in an `<img>`, 120 × 120 CSS px, alt "QR code to open this route on your phone" |

## Phone card state (UI)

| State | When | Card |
|-------|------|------|
| Hidden | no destination; waiting for position; computing; routing failed; no route; QR library missing or failed | `hidden` |
| Shown | routes drawn for the current request (`seq === routeSeq`) and the QR image was built | QR, title, text, link; stops note visible only when the request had stops (FR-008) |

Transitions:

- `updateRoutes()` starts → `clearRoutes()` → **Hidden**.
- Routes drawn → `showPhone(from, place, m, st)` → **Shown**, or **Hidden** if `qrImageSrc` returns `null`.
- `selectRoute(i)` → no change: the link doesn't depend on which alternative is picked.
- A position update on its own → no change. Only a recompute refreshes the card.
