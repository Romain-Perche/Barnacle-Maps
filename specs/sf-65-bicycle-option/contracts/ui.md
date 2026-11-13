# Contract: UI (mode selector and status line)

## Mode selector (`index.html`, `#mode` radiogroup)

Order: Walk (checked, `value="foot"`), Car (`value="car"`), Bike (`value="bike"`).

## Status messages for bike

| Situation | Text |
|-----------|------|
| Computing | `Computing cycling routes…` |
| One route | `{distance} · {duration} by bike[ via N stop(s)]` |
| Several routes | `{N} cycling routes[ via N stop(s)] · fastest {distance} · {duration}` |
| No route | `No cycling route found.` (with stops: `… Try removing a stop.`) |
| Failure, no stops | `Routing failed: {message}` |
| Failure, with stops | `No cycling route found. ({message})` |

Walk and car texts are unchanged ("walking"/"on foot", "driving"/"by car").

## Route list for bike

Each item shows distance and duration; no pleasure element. Clicking an item or a polyline selects it
(same as other modes). Up to 3 routes, OSRM alternatives only (no forced detours).
