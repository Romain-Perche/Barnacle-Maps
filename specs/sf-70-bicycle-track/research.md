# Research: Bicycle Travel Mode (SF-70)

No NEEDS CLARIFICATION remained in the Technical Context; the items below record the decisions taken for the unknowns and integrations.

## R1. Cycling routing source

- **Decision**: Use the FOSSGIS OSRM bicycle instance, `https://routing.openstreetmap.de/routed-bike`, with the URL profile segment `bike` → `…/routed-bike/route/v1/bike/{coords}?overview=full&geometries=geojson[&alternatives=3]`.
- **Rationale**: It is the same provider and the same API already used for `routed-foot` and `routed-car`, so `routeUrl`, `parseRoutes`, alternatives, stops and de-duplication work unchanged (spec assumption). `osrm-routed` serves one profile per instance and ignores the profile segment, so `bike` is just a readable name, consistent with `foot`.
- **Verification note**: A live request could not be made from the planning sandbox (outbound request to `routing.openstreetmap.de` awaits a firewall approval). The URL is checked by unit tests; the live check is in `quickstart.md`. If the server ever rejected `bike`, `driving` is the fallback segment (a one-line change in `TRAVEL_MODES`).
- **Alternatives considered**: OpenRouteService `cycling-regular` (needs an API key, different response format); GraphHopper public API (key, quotas); BRouter (different API). All add integration work for no gain.

## R2. Where mode-specific behaviour lives

- **Decision**: Extend each `TRAVEL_MODES` entry in `src/geo.js` with the data the UI needs: `icon`, `pleasure` (bool), `detours` (bool) and texts (`computing`, `noRoute`, `single`, `plural`). `src/app.js` reads these instead of `m === "car"` / `m === "foot"` checks.
- **Rationale**: Today app.js branches on `"car"` vs. everything else; adding a third mode with that pattern would spread `m === "bike"` checks over five places and silently treat bike as walking in the texts. Data in `geo.js` is unit-testable in Node (app.js is not), so FR-005/006/007 become testable.
- **Alternatives considered**: Keep ternaries in app.js (untestable, error-prone); a per-mode class hierarchy (overkill for three entries).

## R3. Selector markup for design C (segmented buttons with icons)

- **Decision**: Keep the native radio group (`role="radiogroup"`, `<input type="radio" name="mode">`) and restyle it: each `<label>` holds a visually hidden input followed by a `<span>` (`🚶 Walk`, `🚗 Car`, `🚲 Bike`); CSS draws the row as one bordered control, `input:checked + span` gets the highlight (`#e8f0fe` / `#1a73e8` / bold, as in `design-options.html`), `input:focus-visible + span` gets a focus outline.
- **Rationale**: Native radios give keyboard arrows and "selected" announcements for free (FR-001 accessibility), and the existing `change` listener in app.js keeps working untouched. Emoji are decorative text, so labels read "Walk", "Car", "Bike" plus the emoji; wrapping the emoji in `aria-hidden="true"` keeps the announced name clean.
- **Alternatives considered**: `<button aria-pressed>` toggles (needs new JS for exclusivity and arrow keys); `label:has(:checked)` (works in modern browsers, but the sibling selector is simpler and universal).

## R4. Pleasure indicator for bike

- **Decision**: Driven by `TRAVEL_MODES[m].pleasure` (true for foot and bike, false for car). Same limits (`PLEASURE_MAX_STRAIGHT_M`, `PLEASURE_MAX_TILES`, `PLEASURE_TIMEOUT_MS`). Tooltip text changes from "…along this walk…" to "…along this route…" for all modes (FR-005).
- **Rationale**: Spec clarification and assumption: reuse walking rules unchanged.
- **Alternatives considered**: Bike-specific larger distance limit (rejected by spec assumption; longer trips → more tiles → slower).

## R5. Detours

- **Decision**: `TRAVEL_MODES[m].detours` is true only for foot; `fetchRoutes` uses it instead of `m !== "foot"` (FR-006).

## R6. Stale results across modes (FR-010)

- **Decision**: No change: `updateRoutes` already increments `routeSeq` per request and drops results whose `seq` is stale; pleasure scoring is aborted on each new request. Bike goes through the same path.

## R7. Effect on existing tests (SC-004)

- **Decision**: Two existing tests are edited; all other existing assertions stay unchanged:
  1. `test/modes.test.js` "TRAVEL_MODES offers walking and car" asserts the exact key list `["car","foot"]`. It becomes "TRAVEL_MODES offers walking, car and bike" with `["bike","car","foot"]`.
  2. `test/routes.test.js` "L5 app_js_strings" requires `"No walking route found."` to be in `src/app.js`. R2 moves that text into `TRAVEL_MODES` in `src/geo.js`, so L5 now checks `src/app.js` + `src/geo.js` together. The string is still shipped and still checked.
- **Rationale**: Both edits follow from the requirement (a third mode) and from R2 (texts as data). Walk and Car behaviour does not change; the new `test/bike.test.js` checks that the foot/car texts reproduce today's strings exactly.
