# Dismissed analyze findings

- C1 (LOW): FR-008 "no visible glitch" and SC-003 "within 1 s" are only checked by hand or by proxy — dismissed by the factory, 2026-11-10: a Node fake browser cannot see flicker or real animation time; T011, T019 and the AI tests T025/T030 measure them in a real browser.
- F7 (LOW): recorded test tasks T020–T030 have higher IDs than the implementation tasks after them — dismissed by the factory, 2026-11-10: the write-tests record step continues IDs after the highest one and never renumbers; the tasks are already done ([X]) and placed before each phase's implementation, which is the intended order.
