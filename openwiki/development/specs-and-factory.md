---
type: workflow
title: Specs and the software factory workflow
description: How features of Barnacle Maps are specified, planned, tested and documented - Spec Kit artifacts under specs/, .specify configuration, the .factory test recipe, the .claude skills and the generated dataflow and SBOM files.
tags: [workflow, spec-kit, factory, documentation]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-18T18:14:22.657Z
sources:
  - id: openwiki-source-c1e47915b5596b93763b4a7d
    resource: repo://.claude/skills/test-recipe/SKILL.md
  - id: openwiki-source-84abd130edee44e1ec345560
    resource: repo://.claude/skills/write-tests/SKILL.md
  - id: openwiki-source-5738600e8178fc1c65db9d13
    resource: repo://.factory/test-env.md
  - id: openwiki-source-11864e9b0fef004ef8b1d50a
    resource: repo://specs/sf-73-bicycle-track/spec.md
generated: { by: "claude-code", at: "2026-11-18T18:14:22.657Z" }
---

# Specs and the software factory workflow

Features of Barnacle Maps are built by a "software factory" pipeline driven by Claude Code skills and [Spec Kit](https://github.com/github/spec-kit). The repository keeps the artifacts of that process next to the code. None of it is loaded by the app at runtime.

## Feature specs (`specs/<feature>/`)

Each feature gets a folder named after its branch, e.g. `specs/sf-73-bicycle-track/` for the bicycle travel mode (branch `factory/sf-73-bicycle-track`). It holds the Spec Kit artifacts:

| File | Content |
|---|---|
| `spec.md` | User stories with priorities, acceptance scenarios, functional requirements and success criteria, plus a **Clarifications** log of decisions (e.g. the chosen selector design, bike routes getting the pleasure indicator, NoRoute handling for every mode). |
| `plan.md`, `research.md` | Technical plan and the research behind it. |
| `data-model.md`, `contracts/` | Data shapes and contracts the code must honour (for SF-73, `contracts/travel-modes.md` defines `TRAVEL_MODES`, `routeUrl` and the selector markup). Tests cite them. |
| `tasks.md` | Ordered implementation tasks and the tests recorded for them. |
| `checklists/`, `quickstart.md`, `design-options.html`, `dependencies.json` | Requirement checklist, manual verification steps, UI design options shown to the person deciding, and declared dependencies. |

When behaviour is unclear, the spec and its clarifications explain *why*; the code in `src/` is what actually runs.

## Spec Kit configuration (`.specify/`)

`.specify/` holds the Spec Kit setup: the project constitution (`memory/constitution.md`), templates, workflows, scripts and the git extension (branch creation, auto-commit). The `speckit-*` skills in `.claude/skills/` use it.

## Skills (`.claude/skills/`)

- `speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-tasks`, `speckit-analyze`, `speckit-checklist`, `speckit-converge`, `speckit-implement`, `speckit-constitution` and `speckit-git-*`: the Spec Kit steps.
- Factory steps that involve a person: `check-plan-completeness`, `plan-review`, `review-analyze-findings`, `plan-fix`.
- `write-tests`: writes the deterministic tests and AI test scenarios after tasks are generated.
- `test-recipe`: how the test recipe `.factory/test-env.md` and the run scripts in `.factory/run/` are read and written.
- `visual-briefing`, `ponytail`, `openwiki`: presentation, minimal-solution guidance and this wiki.

## Test recipe (`.factory/`)

`.factory/test-env.md` records how tests run, not which tests: which outside services are faked and against which upstream schema, how to run the app, smoke checks, and whether real runs are possible. `.factory/run/setup.sh` and `.factory/run/scenarios.mjs` start the app and run the AI scenarios. See [Testing](../testing/testing.md).

## Generated documentation

- `dataflow/model.json` is the data flow model; `dataflow/DATAFLOW.md` is drawn from it by the factory. See [`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md).
- `sbom/SBOM.md` (and `sbom.cdx.json`) is the software bill of materials, generated from lockfiles and `pins.json`. See [`sbom/SBOM.md`](../../sbom/SBOM.md).
- `openwiki/` is this wiki.

Do not edit `DATAFLOW.md` or anything under `sbom/` by hand; they are rewritten.

## Related pages

- [Testing](../testing/testing.md)
- [Quickstart](../quickstart.md)
