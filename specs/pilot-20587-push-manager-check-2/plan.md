# Implementation Plan: Push Manager Check 2 — One-Line README Comment

**Branch**: `factory/pilot-20587-push-manager-check-2` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/pilot-20587-push-manager-check-2/spec.md`

## Summary

Append one hidden HTML comment line (`<!-- Push manager check 2 -->`) at the end of `README.md`. No code or other files change; the two test files from the test gate are the only additions. The rendered README stays identical.

## Technical Context

**Language/Version**: Markdown (README); project is plain JavaScript (ES modules, Node)

**Primary Dependencies**: None (no build step)

**Storage**: N/A

**Testing**: `npm test` (`node --test test/`), unchanged; plus `git diff --stat` check

**Target Platform**: Browser app; README read on the repository host

**Project Type**: Static web app (barnacle-maps)

**Performance Goals**: N/A

**Constraints**: Exactly 1 line added to the README, 0 removed or changed; no other file touched except the two test files named in FR-004

**Scale/Scope**: One file, one line

## Constitution Check

The constitution (`.specify/memory/constitution.md`) is still the unfilled template and defines no principles, so there are no gates to violate. The change is minimal and touches no behavior. Result: PASS (before and after design).

## Project Structure

### Documentation (this feature)

```text
specs/pilot-20587-push-manager-check-2/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md             # created later by /speckit-tasks
```

No `contracts/`: the feature exposes no interface.

### Source Code (repository root)

```text
README.md                          # one comment line appended
test/readme-comment.test.js        # added by the test gate (FR-004)
tests/ai/us1-readme-comment.md     # added by the test gate (FR-004)
src/                               # unchanged
```

**Structure Decision**: Existing single static project; only `README.md` is edited, plus the two test files.

## Complexity Tracking

No violations.
