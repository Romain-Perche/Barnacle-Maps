# Research: Bicycle Travel Mode

## R1. Cycling routing source

- **Decision**: FOSSGIS OSRM bicycle instance, `https://routing.openstreetmap.de/routed-bike/route/v1/bike/{lng,lat;...}`
  with `overview=full&geometries=geojson` and `alternatives=3`, the same query as walk and car.
- **Rationale**: The same provider and response format as the existing modes, so `parseRoutes`, `pickRoutes`,
  stops and `routeSeq` work unchanged. No API key is needed (spec assumption). The FOSSGIS profile set
  (`fossgis-routing-server/cbf-routing-profiles`, `profiles.conf.example`: `PROFILES="car bike foot"`) contains a
  `bike` profile. OSRM ignores the profile path segment on a single-profile server, so `bike` is for readability and
  matches the FOSSGIS URL convention (`routed-bike/.../bike`).
- **Alternatives considered**: OpenRouteService `cycling-regular` (needs an API key and a different response format);
  GraphHopper (needs a key); project-osrm.org demo (car only).
- **Note**: The sandbox network could not reach `routing.openstreetmap.de` during planning (approval pending), so the
  live endpoint was not called. Build should confirm it once with a real request before relying on it.

## R2. Where mode-specific behavior lives

- **Decision**: Extend each `TRAVEL_MODES` entry with `icon`, `noun` ("walking" / "driving" / "cycling"),
  `adverb` ("on foot" / "by car" / "by bike"), `pleasure` (boolean) and `detours` (boolean). `app.js` reads these
  instead of testing `m === "car"` or `m === "foot"`.
- **Rationale**: A third mode would otherwise double the ternaries. Keeping the data in `geo.js` makes the wording and flags
  unit-testable in Node.
- **Alternatives considered**: Adding `m === "bike"` branches next to the existing ones (more branches, easy to miss one,
  not testable).

## R3. Segmented control and accessibility

- **Decision**: Keep the native radio group (`role="radiogroup"`, `<input type="radio">` in `<label>`). Hide the inputs
  visually (clip pattern) and style the labels as adjacent segments. Highlight the checked one with `label:has(input:checked)`
  and show a focus ring with `label:has(input:focus-visible)`. The emoji icons are `aria-hidden`.
- **Rationale**: Native radios keep arrow-key navigation and "selected" announcements with no JS (FR-001). `:has()`
  works in all current evergreen browsers.
- **Alternatives considered**: `<button aria-pressed>` group (needs JS for keyboard and roving focus); a `<select>`
  (does not match Design C).

## R4. Pleasure indicator for bike

- **Decision**: Reuse `scorePleasure` unchanged for bike, with the same `PLEASURE_MAX_STRAIGHT_M` (15 km) and
  `PLEASURE_MAX_TILES` limits.
- **Rationale**: The spec says "same limit as walking". Rides longer than the limit show "Pleasure unavailable" (edge case).

## R5. Detours

- **Decision**: No forced detours for bike (FR-008). Only modes with `detours: true` (Walk) request them.
