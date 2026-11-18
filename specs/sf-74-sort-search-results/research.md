# Research: Sort Search Results by Distance

## Preferring nearby places (FR-008/009)
- **Decision**: Add `viewbox=left,top,right,bottom` (lon,lat) centred on the user with `bounded=0` (omit `bounded`; default 0) to the Nominatim `/search` URL. Half-size 0.25° (~28 km in latitude; longitude half-size is `0.25/cos(lat)` so the box stays roughly square), clamped to valid ranges. Omit entirely without a position.
- **Rationale**: Nominatim documents `viewbox` as a ranking preference when not `bounded`, so far matches are still returned (spec assumption). "On the order of a city" ≈ 25–30 km radius.
- **Alternatives**: `bounded=1` (rejected: excludes unique far places, out of scope); fetching more results then filtering (rejected: FR-007 keeps 5, extra load); `lat/lon` bias params (not supported by Nominatim).

## Sorting
- **Decision**: Pure `sortByDistance(results, from)` using existing `haversine`, attaching `distance` (m), `Array.prototype.sort` (stable in ES2019+) on a copy, so ties keep service order (FR-003). Returns input unchanged with no `distance` when `from` is null.
- **Alternatives**: Route distance (rejected: too slow/costly, per spec).

## Display
- **Decision**: In each `li`, order: name button, `<span class="distance">` with `formatDistance(distance)`, "Add as stop" button. CSS `flex: none; min-width` right-aligned, grey 12px like design-options.html `.distA`. Span omitted when no position.
- **Position changes while shown**: list is not re-sorted; the position is read at fetch-response time.

## Unknowns
None remaining.
