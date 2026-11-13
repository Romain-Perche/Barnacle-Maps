# Dismissed analyze findings

- C1 (LOW): The 5 reference trips for SC-002 are not defined — dismissed by the factory, 2026-11-13: tests/ai/us1-cycling-routes.md (scenario "live bike vs walk") already lists the 5 Paris trips with start and destination.
- A1 (LOW): "not much longer" / "not mostly overlapping" in FR-003 have no threshold — dismissed by the factory, 2026-11-13: the spec clarification fixes the meaning as "the same filtering as other modes", i.e. the existing pickRoutes code, which bike reuses unchanged.
- I5 (LOW): Test task IDs T015–T022 are not in file order — dismissed by the factory, 2026-11-13: the write-tests record step numbers test tasks after the highest ID and places them before the implementation tasks by design.
