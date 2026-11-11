# Tasks: Push Manager Check

**Input**: `/specs/pilot-19985-push-manager-check/` (spec.md, plan.md, research.md, quickstart.md)
**Tests**: No new test tasks (not requested). Existing `npm test` is run as validation.
**Organization**: Single user story (US1, P1).

## Phase 1: Setup

No setup needed: no new project structure, dependencies or contracts.

## Phase 2: Foundational

No foundational tasks.

## Phase 3: User Story 1 - Verify the delivery pipeline with a trivial README change (Priority: P1) 🎯 MVP

**Goal**: Root `README.md` gains exactly one hidden single-line HTML comment containing "push check".

**Independent Test**: `git diff --numstat main -- README.md` shows `1	0	README.md`, and the added line is a `<!-- ... -->` comment.

- [X] T004 [US1] Integration test: README diff vs main is `1 0`, one added `<!-- ... push check ... -->` line, last line, single occurrence, only README.md changed, in test/readme-comment.test.js (covers FR-001, FR-002, FR-002a, FR-003, FR-004, SC-001, US1 scenario 1)
- [X] T005 [US1] AI test: README diff, rendered output unchanged, and `npm test` / app still fine in tests/ai/us1-readme-comment.md (covers FR-001, FR-004, FR-005, SC-002, SC-003, US1 scenario 1, 2, 3)
- [ ] T001 [US1] Inspect the end of `README.md` (last line, trailing newline present or not, whether it ends inside a fenced code block) and check with `grep -Fx '<!-- push manager check: pipeline verification push check -->' README.md` whether the comment already exists; if it does, skip T002.
- [ ] T002 [US1] Append the single line `<!-- push manager check: pipeline verification push check -->` after the last line of `README.md` (add a trailing newline first if missing; no blank separator line; if the last line is inside an unclosed fenced code block, place the comment after the closing fence). Do not modify any other line.
- [ ] T003 [US1] Verify per `specs/pilot-19985-push-manager-check/quickstart.md`: `git diff --numstat main -- README.md` → `1	0`; `git diff --name-only main -- . ':!specs' ':!.specify'` → only `README.md`; run `npm test` in the repo root and confirm all tests pass.

## Phase 4: Polish

No polish tasks; the change is one line.

## Dependencies & Execution Order

T001 → T002 → T003 (sequential, same file, no parallel opportunities).

## Implementation Strategy

MVP is US1 in full (it is the only story): complete T001–T003, then let the pipeline commit, push and open the PR.
