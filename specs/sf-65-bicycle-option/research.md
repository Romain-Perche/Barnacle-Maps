# Research: Bicycle Option

No live check was possible from the planning sandbox (outbound access to `routing.openstreetmap.de` needs an
approval nobody could give), so decisions below rest on the provider's documented layout and on the existing
code. The quickstart includes a manual check of the bike endpoint.

## R1 – Bicycle routing source

- **Decision**: FOSSGIS OSRM bicycle instance, base `https://routing.openstreetmap.de/routed-bike`, URL profile
  segment `bike`.
- **Rationale**: Same provider and API as the existing `routed-foot` / `routed-car` bases (spec assumption).
  Each FOSSGIS instance runs a single OSRM profile; OSRM ignores the profile segment of the URL for routing, so
  `bike` is used for readability, mirroring `foot`. Durations returned are the OSRM bicycle profile estimates
  (≈15 km/h on cycleways/roads), which satisfies FR-004 and makes SC-002 (bike faster than walking) hold.
- **Alternatives considered**: `routing.openstreetmap.de/routed-bike/route/v1/driving` (the literal path in
  FOSSGIS examples – equivalent, but less readable); `router.project-osrm.org` demo (car only); OpenRouteService /
  GraphHopper `bike` (need API keys, new provider); computing bike time from walking distance × speed (violates
  FR-004 – not a cycling route).

## R2 – Alternatives and detours for bike

- **Decision**: Ask OSRM for `alternatives=3` (as today for all modes), keep `pickRoutes`, never force detours.
- **Rationale**: FR-008. `fetchRoutes` already returns early when `m !== "foot"`, so bike inherits the car path.
- **Alternatives considered**: Enable detours for bike – rejected by spec.

## R3 – Per-mode wording

- **Decision**: Add two text fields to each `TRAVEL_MODES` entry: `adjective` ("walking" / "driving" /
  "cycling") and `by` ("on foot" / "by car" / "by bike"). `app.js` builds "Computing {adjective} routes…",
  "No {adjective} route found.", "{summary} {by}", "N {adjective} routes · fastest …" from them.
- **Rationale**: Three modes make the current `car ? … : …` ternaries wrong for bike; a lookup keeps all
  mode-specific data in one place and is unit-testable in `geo.js`. Walk/car strings stay byte-identical (FR-010).
- **Alternatives considered**: Nested ternaries / switch in `app.js` – works but scatters mode data and is not
  testable without a DOM.

## R4 – Pleasure indicator

- **Decision**: No change; `drawRoutes` and `updateRoutes` already gate pleasure on `m === "foot"` (the latter
  via `!car`, which must become `m === "foot"` once the ternary is removed).
- **Rationale**: FR-007.

## R5 – Mode switching, stale results, stops

- **Decision**: No change. The radio `change` handler accepts any key of `TRAVEL_MODES`, keeps `currentPlace`
  and `stops`, and `routeSeq` discards superseded responses.
- **Rationale**: FR-009, edge case "switch while computing", Story 2.

## R6 – Failure behaviour

- **Decision**: Reuse existing error paths ("Routing failed: …", "No cycling route found. Try removing a stop.").
- **Rationale**: Spec edge cases require parity with walk/car.
