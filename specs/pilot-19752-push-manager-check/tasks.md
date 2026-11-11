# Tasks: Push Manager Check

**Input**: Design documents from `/specs/pilot-19752-push-manager-check/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md (data-model.md and contracts/ are not applicable)
**Tests**: No new tests requested; the existing `npm test` suite is run unchanged.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

No project setup needed; the existing repository layout is untouched.

## Phase 2: Foundational

No blocking prerequisites.

## Phase 3: User Story 1 - Verify the delivery pipeline with a trivial README change (Priority: P1) 🎯 MVP

**Goal**: Append exactly one hidden HTML comment line to `README.md` so the push/PR pipeline can be exercised.

**Independent Test**: `git diff --numstat main -- README.md` shows `1	0	README.md`; only README changed outside `specs/`; `npm test` passes.

- [X] T006 [US1] Integration test: README gains exactly one hidden `<!-- -->` comment line with "push manager check", under 100 chars, no duplicate, in test/readme-comment.test.js (covers FR-001, FR-002, FR-003, FR-006, SC-001, US1 scenario 1, 2)
- [X] T007 [US1] AI test: README diff, hidden rendering and `npm test` in tests/ai/us1-readme-comment.md (covers FR-001 to FR-006, SC-001, US1 scenario 1, 2, 3)
- [ ] T001 [US1] Check `README.md` for an existing line containing "push manager check"; if present, make no change (FR-006, never duplicate)
- [ ] T002 [US1] Append one physical line to the end of `README.md`, on its own line and newline-terminated (add a newline first if the last line lacks one): `<!-- push manager check: verifies the delivery pipeline -->` (HTML comment `<!-- ... -->`, contains "push manager check", under 100 characters; FR-001, FR-002, FR-003, FR-006). Do not modify or remove any existing line (FR-004)
- [ ] T003 [US1] Verify diff size: `git diff --numstat main -- README.md` outputs `1	0	README.md` (SC-001)
- [ ] T004 [US1] Verify only `README.md` changed outside `specs/`: `git diff --name-only main -- . ':!specs'` lists `README.md` only (FR-005)
- [ ] T005 [US1] Run `npm test` from the repo root and confirm all tests pass (SC-003)

**Checkpoint**: User Story 1 complete; the branch is ready for the push manager to push and open the PR.

## Phase 4: Polish

No polish needed; the rendered README is unchanged by construction (HTML comment hidden in GitHub's Markdown preview, SC-002).

## Dependencies & Execution Order

T001 → T002 → T003, T004, T005 (T003–T005 are independent checks and can run in parallel, all read-only).

## Parallel Example

After T002: run T003, T004, T005 together.

## Implementation Strategy

MVP is User Story 1, the only story: make the one-line edit, run the three verifications, then hand off for push and PR.
