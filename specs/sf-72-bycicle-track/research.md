# Research: Bicycle Travel Mode (SF-72)

No item in Technical Context was left as NEEDS CLARIFICATION. The open questions were technical choices; each is resolved below. This was a non-interactive run, so each decision was taken without asking anyone.

## R1. Bicycle routing endpoint and profile

- **Decision**: Base `https://routing.openstreetmap.de/routed-bike`, profile segment `bike`. The URL is built the same way as for foot and car: `{base}/route/v1/bike/{lng,lat;…}?overview=full&geometries=geojson[&alternatives=3]`.
- **Rationale**: The FOSSGIS OSRM instance already used for `routed-foot` and `routed-car` also runs a `routed-bike` instance, which is the one openstreetmap.org uses for its "Bicycle (OSRM)" engine. Each OSRM server loads one dataset and does not check the profile name in the URL. `bike` matches the existing `foot` naming. The service's bicycle profile already prefers cycleways and only allows roads open to bicycles (FR-002), so the app adds no preference of its own.
- **Verification caveat**: The sandbox firewall blocked `routing.openstreetmap.de` while planning (HTTP 403, approval required), so the endpoint could not be called live. The implementation step must check it (see quickstart.md, step 6). If `bike` is ever rejected, the fallback is `driving`, the segment openstreetmap.org sends to every FOSSGIS instance.
- **Alternatives considered**: GraphHopper or OpenRouteService bike profiles need API keys and add a new provider. Reusing `routed-foot` with a speed factor is wrong because it would allow footpaths closed to bikes. Both were rejected.

## R2. Where per-mode behaviour lives

- **Decision**: Add data flags to each `TRAVEL_MODES` entry in `src/geo.js`: `icon`, `pleasure` (boolean) and `detours` (boolean). `src/app.js` reads `TRAVEL_MODES[m].pleasure` and `.detours` instead of checking `m === "foot"` or `m !== "car"`. The user-facing texts (computing, no route, single route, plural) go in a small `MODE_TEXT` map in `src/app.js`.
- **Rationale**: The flags are pure data, so they can be unit tested in Node, and they remove the mode-name checks that would otherwise multiply with a third mode. The texts stay in `app.js` because the existing test `L5 app_js_strings` requires `"No walking route found."` in `src/app.js`. Moving the texts would mean editing that test, which goes against SC-004.
- **Alternatives considered**: (a) Adding `m === "bike"` branches next to the existing checks: smallest diff, but every rule would then be written in three places. (b) Putting the texts in `TRAVEL_MODES` too, as SF-70 did: this forced an edit to L5. Both were rejected.

## R3. Selector markup and accessibility (design C)

- **Decision**: Keep the native `<input type="radio" name="mode">` elements inside `<label>`s and restyle them as segmented buttons. The inputs are visually hidden but stay focusable. Each label holds `<input …><span><span aria-hidden="true">🚶</span> Walk</span>`. The checked segment is styled through `#mode input:checked + span`, and keyboard focus through `#mode input:focus-visible + span`.
- **Rationale**: Native radios already provide the "selected" state for assistive technology (FR-001), arrow-key navigation, and the `change` event the app listens to today. That means no JavaScript changes for the selector. The emoji is `aria-hidden` so screen readers announce "Walk", not "pedestrian Walk".
- **CSS pitfall from the reverted SF-70**: A descendant rule such as `#mode span { display:block; padding:… }` also matches the nested icon span and puts the emoji on its own line. Rules MUST target `#mode input + span` (the outer span) only. See contracts/travel-modes.md.
- **Alternatives considered**: `<button aria-pressed>` toolbar: needs new JavaScript and keyboard handling. `role="tab"`: wrong semantics. Both were rejected.

## R4. Pleasure indicator for bike routes

- **Decision**: Use the existing `scorePleasure` with its current limits (15 km straight line, 150 tiles, 20 s timeout) whenever `TRAVEL_MODES[m].pleasure` is true. Change the tooltip wording from "along this walk" to "along this route".
- **Rationale**: The spec requires the same rules as walking (FR-005, Assumptions). Many bike trips will go over 15 km and show "Pleasure unavailable", which the edge cases accept.

## R5. Detours, stops, stale results

- **Decision**: No new code. The detour branch becomes `if (main.length >= 2 || !TRAVEL_MODES[m].detours)`, which keeps detours for walking only (FR-006). Stops already go into `routeUrl` for every mode (FR-009). The mode `change` listener already keeps stops and recomputes (FR-008). The `routeSeq` check already drops stale results (FR-010). On a routing error, `clearRoutes()` has already removed the previous mode's routes before the fetch, so no stale routes stay on the map (edge case).

## R6. Tests

- **Decision**: Unavoidable edit to an existing test: `test/modes.test.js` "TRAVEL_MODES offers walking and car" asserts the key list `["car","foot"]`. It becomes `["bike","car","foot"]`, with bike base/profile assertions added. New checks go in a new `test/bike.test.js`: the bike `routeUrl` with alternatives, stops and an explicit base, the flags, the markup in `index.html` (3 radios, icons, Walk checked), the CSS scoping, the `MODE_TEXT` strings in `app.js`, and the README mentions. All other existing tests stay unchanged.

## R7. "No route" answers from OSRM (added after test writing)

- **Finding**: The OSRM docs (`.factory/schemas/osrm-http.md`, "Responses") say that every error, including the route service's `NoRoute`, comes back with HTTP 400. `fetchJson` in `src/app.js` throws on any non-OK status, so today the user sees "Routing failed: Request failed (400)" instead of "No … route found." That means US1 scenario 5 / FR-007 ("No cycling route found.") cannot happen with the real service.
- **Decision**: Add a pure helper `isNoRouteResponse(json)` in `src/geo.js`. It returns true when `json.code` is `"NoRoute"` or `"NoSegment"` (a point cannot snap to a road the profile allows, for example a destination reachable only on roads closed to bicycles). The routing fetch in `src/app.js` reads the JSON body of a non-OK response and, when `isNoRouteResponse` is true, treats it as no routes (`parseRoutes` gives `[]`), so the existing "No … route found." texts appear. This applies to all three modes (spec Clarifications, to confirm). Other errors still throw ("Routing failed: …").
- **Alternatives considered**: Bike-only handling (inconsistent, more code). Leaving it as it is (FR-007's text would never show). Both were rejected.
