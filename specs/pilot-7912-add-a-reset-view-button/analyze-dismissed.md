# Dismissed analyze findings

- C2 (LOW): `border-radius: 4px` on the button inside `.leaflet-bar` may give a double rounded edge — dismissed by the factory, 2026-11-11: false positive; Leaflet 1.9's own bar links use 4px corners inside the 4px `.leaflet-bar`, so the value matches the other controls (research.md R3, Look).
- B1 (LOW): FR-010 "short animation" has no number — dismissed by the factory, 2026-11-11: it is bounded by SC-002 (at rest within 1 s of activation) and the clarification "ends within 1 second"; no change needed.
- E1 (LOW): SC-004 (5-person informal usability test) has no task — dismissed by the factory, 2026-11-11: it is a post-build outcome measure, not buildable work; write-tests also recorded it as not tested.
