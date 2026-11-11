# Tasks: Push Manager Check 2 — One-Line README Comment

**Input**: Design documents from `/specs/pilot-20587-push-manager-check-2/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (no contracts/)
**Tests**: None requested; existing tests are only re-run.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

No setup needed: existing static project, no new dependencies or structure.

## Phase 2: Foundational

No blocking prerequisites.

## Phase 3: User Story 1 - Maintainer adds a one-line comment to the README (Priority: P1) 🎯 MVP

**Goal**: Append exactly one hidden comment line to `README.md`; rendered output unchanged.

**Independent Test**: `git diff --numstat README.md` shows `1  0  README.md`; rendered README looks identical; `npm test` passes.

- [X] T004 [US1] Integration test for README comment line in test/readme-comment.test.js (covers FR-001, FR-002, FR-003, US1 scenario 1, 2)
- [X] T005 [US1] AI test: README diff, rendering and test suite in tests/ai/us1-readme-comment.md (covers FR-001, FR-004, FR-005, US1 scenario 1, 2, 3)
- [ ] T001 [US1] Append the single line `<!-- Push manager check 2 -->` (LF ending, no blank line before it, no other line touched) at the end of `/home/agent/repo/README.md`, directly after the last existing line
- [ ] T002 [US1] Verify the diff: `git diff --numstat README.md` must print `1  0  README.md`, `git diff --stat` must list only `README.md` (besides `specs/`), and `tail -n 1 README.md` must print the comment (`/home/agent/repo/README.md`)
- [ ] T003 [US1] Run `npm test` from `/home/agent/repo` and confirm all existing tests pass (no file changes)

## Phase 4: Polish

No polish needed; per FR-004 no other file may change.

## Dependencies & Execution Order

T001 → T002 → T003 (sequential; one file, no parallel opportunities).

## Implementation Strategy

MVP is User Story 1, the only story: apply the one-line change, then run the quickstart.md checks.
