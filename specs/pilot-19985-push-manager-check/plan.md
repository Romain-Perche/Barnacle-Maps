# Implementation Plan: Push Manager Check

**Branch**: `factory/pilot-19985-push-manager-check` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/pilot-19985-push-manager-check/spec.md`

## Summary

Append exactly one hidden HTML comment line (e.g. `<!-- push manager check: pipeline verification -->`) to the end of the root `README.md`. No code, tests, or other files change. This exercises the branch → commit → push → PR pipeline with a minimal, invisible diff.

## Technical Context

**Language/Version**: Markdown (README); app is vanilla JS (ES modules, Node for tests)

**Primary Dependencies**: None

**Storage**: N/A

**Testing**: `npm test` (`node --test test/`) — existing suite must still pass; plus `git diff --numstat main -- README.md` shows `1 0`

**Target Platform**: Static web app served by `python3 -m http.server`

**Project Type**: Single static web project

**Performance Goals**: N/A

**Constraints**: Exactly 1 line added, 0 removed; comment invisible when rendered; only README changed (besides spec artifacts)

**Scale/Scope**: One line in one file

## Constitution Check

The constitution at `.specify/memory/constitution.md` is the unfilled template (no ratified principles), so there are no gates to violate. Result: PASS, pre- and post-design. The change is the minimal possible, so it would satisfy any simplicity principle.

## Project Structure

### Documentation (this feature)

```text
specs/pilot-19985-push-manager-check/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

No `contracts/`: the feature exposes no interface.

### Source Code (repository root)

```text
README.md   # only product file touched: one appended comment line
```

**Structure Decision**: No source layout changes. The comment goes at the end of `README.md`, after the final paragraph, preceded by nothing new (a single added line, so no blank separator). A line directly after a paragraph would be absorbed into that paragraph; an HTML comment is not rendered, so the output is unchanged. If the file lacks a trailing newline, the implementer must ensure the diff still shows one added line (the previous last line may appear modified in that case — verify with `git diff --numstat`).

## Complexity Tracking

No violations.
