# Research: Bicycle Travel Mode

## R1. Cycling routing source

- **Decision**: FOSSGIS OSRM bike instance, base `https://routing.openstreetmap.de/routed-bike`, URL profile segment `bike` → `…/routed-bike/route/v1/bike/{coords}?overview=full&geometries=geojson[&alternatives=3]`.
- **Rationale**: Same provider and response format as `routed-foot` / `routed-car` (spec assumption), no key, `parseRoutes` works unchanged. `osrm-routed` ignores the profile path segment (each instance serves one profile), so `bike` is chosen for readability, matching how `foot` is used for walking.
- **Alternatives considered**: `driving` as profile segment (works too but misleading); OpenRouteService cycling (needs API key); GraphHopper public API (key + different format).
- **Note**: The endpoint could not be probed from the planning sandbox (outbound request returned HTTP 403 from the sandbox firewall). Validate manually per quickstart.md.

## R2. Where mode-specific behavior lives

- **Decision**: Extend each `TRAVEL_MODES` entry with `icon`, `noun` ("walking" / "driving" / "cycling"), `by` ("on foot" / "by car" / "by bike"), `pleasure` (bool) and `detours` (bool). `app.js` reads these instead of `m === "car"` / `m === "foot"`.
- **Exception — no-route messages**: `test/routes.test.js` L5 (an existing test, SC-005) requires the literal `"No walking route found."` in `src/app.js`. So `app.js` keeps a literal map `const NO_ROUTE = { foot: "No walking route found.", car: "No driving route found.", bike: "No cycling route found." };` instead of building that one message from `noun`. Other messages use `noun` / `by`.
- **Rationale**: Three modes make two-way ternaries wrong-by-default (bike would read as walking or car). One table keeps wording and behavior testable in Node and satisfies FR-007/008/009 in one place.
- **Alternatives considered**: Adding a third branch to each ternary in `app.js` (5+ sites, untested); a separate `modeConfig` module (unneeded file).

## R3. Segmented control with icons, accessibility kept

- **Decision**: Keep `<div id="mode" role="radiogroup">` with three `<label><input type="radio" name="mode" …> 🚶 Walk</label>`; visually hide the radio (clip pattern, not `display:none`) and style labels as segments using mock B's `.seg` look (shared border, 6px radius, selected = `#e8f0fe` background, `#1a73e8` text, bold) via `label:has(input:checked)`. Focus ring via `label:has(input:focus-visible)`. Emoji wrapped in `<span aria-hidden="true">` so the accessible name stays "Walk"/"Car"/"Bike".
- **Rationale**: Native radios give arrow-key navigation, single selection and announcements for free (FR-001); `:has()` is supported in all current evergreen browsers. No JS change needed for the selector.
- **Alternatives considered**: `<button aria-pressed>` group (must re-implement roving tabindex/arrow keys); `display:none` radios (removes them from keyboard/AT).

## R4. Pleasure and detours for bike

- **Decision**: `pleasure: true` for foot and bike, `false` for car; `detours: true` for foot only. Same `PLEASURE_MAX_STRAIGHT_M` (15 km) and tile limits for bike (spec: "same limit as walking"). Pleasure tooltip wording changes from "along this walk" to "along this route".
- **Rationale**: Directly from clarification Q2, FR-008, FR-009 and edge cases.
- **Alternatives considered**: Higher distance limit for bikes (rejected by spec; more tile load on OSM).

## R5. Stale results and mode switching

- **Decision**: No change. `updateRoutes` already snapshots mode/place/stops and drops results whose `seq !== routeSeq`; `clearRoutes()` runs before each request, so no stale routes from another mode (FR-006/010/011).

## R6. Testing approach

- **Decision**: Unit tests in Node for `TRAVEL_MODES.bike` and `routeUrl(…, { mode: "bike", … })` (plain, alternatives, stops); metadata assertions (pleasure/detours flags, wording). UI behavior verified manually via quickstart.md (repo has no DOM test harness).
