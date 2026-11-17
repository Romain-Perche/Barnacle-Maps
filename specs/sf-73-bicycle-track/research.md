# Research: Bicycle Travel Mode (SF-73)

The Technical Context had no NEEDS CLARIFICATION left. Below are the decisions for the unknowns and integrations. The reverted SF-70 attempt (commit `bf7a98a`) was reviewed. Its approach is reused where it holds up. The revert gives no reason, so this plan keeps the change small and lists every edit to existing tests.

## R1. Cycling routing source

- **Decision**: FOSSGIS OSRM bicycle instance `https://routing.openstreetmap.de/routed-bike`, URL `…/routed-bike/route/v1/bike/{lng,lat;…}?overview=full&geometries=geojson[&alternatives=3]`.
- **Rationale**: It is the same provider and API as `routed-foot` / `routed-car`, so `routeUrl`, `parseRoutes`, `pickRoutes`, alternatives and stops work unchanged (spec assumption: free, no key). `osrm-routed` serves one profile per instance and ignores the profile segment in the URL. `bike` is used only to be readable, the same way `foot` is.
- **Verification note**: No live request was possible during planning: the sandbox firewall holds `routing.openstreetmap.de` for approval (HTTP 403 "Approval required"). Unit tests check the URL. The live check is in [quickstart.md](./quickstart.md). If the server ever rejected `bike`, use `driving` as the segment instead, a one-line change.
- **Alternatives considered**: OpenRouteService `cycling-regular` (needs an API key, different response format); GraphHopper (key, quotas); BRouter (different API and response). All add integration work for no benefit.

## R2. Where mode-specific behaviour lives

- **Decision**: Put per-mode data in `TRAVEL_MODES` (`src/geo.js`): `icon`, `pleasure`, `detours`, `computing`, `noRoute`, `single`, `plural`. `src/app.js` reads it instead of using string comparisons.
- **Rationale**: Today `app.js` treats "not car" as walking in 4 places (status texts, summary, pleasure, detours). A third mode under that pattern would silently get walking texts. Data in `geo.js` can be tested in Node, which makes FR-005/008/009 testable.
- **Alternatives considered**: More ternaries in `app.js` (cannot be tested, easy to get wrong); per-mode classes (overkill for 3 entries).

## R3. Selector markup for design C

- **Decision**: Keep the native radio group (`role="radiogroup"`, `input[type=radio][name=mode]`). Each `<label>` wraps a visually hidden input followed by `<span><span aria-hidden="true">🚲</span> Bike</span>`. CSS draws one bordered row of equal segments. `input:checked + span` gets the highlight (`#e8f0fe` background, `#1a73e8` text, bold, as in `design-options.html`), and `input:focus-visible + span` gets an outline.
- **Rationale**: Native radios provide arrow-key navigation, exactly one selection, and the screen-reader "selected" state for free (FR-001). The existing `change` listener keeps working. The emoji are hidden from assistive technology, so the accessible names stay "Walk", "Car" and "Bike".
- **Alternatives considered**: `<button aria-pressed>` toggles (need new JS for exclusivity and roving focus); `display:none` inputs (break keyboard access).

## R4. Pleasure indicator for bike

- **Decision**: Driven by `TRAVEL_MODES[m].pleasure` (foot ✓, bike ✓, car ✗), with the same limits. The tooltip wording becomes "along this route" (spec assumption: wording may name rides).
- **Alternatives considered**: A larger distance limit for bikes. Rejected because the spec says the limits stay the same, and longer trips mean more tiles to load.

## R5. Detours

- **Decision**: `TRAVEL_MODES[m].detours` is true for foot only. `fetchRoutes` checks it (FR-009 / edge case "no artificial detours for cycling").

## R6. Late results when switching modes

- **Decision**: No change. `updateRoutes` increments `routeSeq` per request, drops stale results, and aborts pleasure scoring (FR-006, US2 scenario 3).

## R7. Effect on existing tests (SC-004)

- **Decision**: Two existing tests are edited. Every other existing assertion stays unchanged:
  1. `test/modes.test.js` "TRAVEL_MODES offers walking and car": the exact key list `["car","foot"]` becomes `["bike","car","foot"]`, and the test is renamed. This follows directly from adding a mode.
  2. `test/routes.test.js` "L5 app_js_strings" looks for `"No walking route found."` in `src/app.js`. R2 moves that text into `src/geo.js`, so L5 searches `src/app.js` + `src/geo.js` together. The string still ships and is still checked.
- **Rationale**: Both edits are the minimum the requirement and R2 imply. A new test checks that foot/car texts give exactly today's strings, so walk and car behaviour is shown to be unchanged.

## R8. "No route" answers from OSRM

- **Decision**: For route requests only, an HTTP 400 answer whose JSON `code` is `NoRoute` counts as "no route": `parseRoutes` gives `[]` and the mode's `noRoute` text is shown. Other HTTP errors stay errors ("Routing failed: Request failed (N)").
- **Rationale**: The OSRM HTTP docs (`docs/http.md`) say: "In case of an error the HTTP status code will be `400`". `NoRoute` is one of those error codes. Today `fetchJson` throws on any non-OK status, so the app shows "Routing failed: Request failed (400)" and never "No walking route found.". US1 scenario 5 needs "No cycling route found.". A prototype of the plan without this fix failed exactly the two NoRoute tests.
- **Effect on walk/car**: In this one case, walk and car also show their existing "No walking/driving route found." text instead of "Routing failed: Request failed (400)". The spec records this as a factory decision, to confirm.
- **Alternatives considered**: Treat every 400 as "no route". Rejected: it hides real request errors such as `InvalidOptions`.
