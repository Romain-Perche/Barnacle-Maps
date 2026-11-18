---
type: workflow
title: Spec-driven development workflow
description: How features of Barnacle Maps are specified, planned, tested and built with GitHub Spec Kit and the project's Claude Code skills, and where each feature's artifacts live.
tags: [workflow, spec-kit, claude-code, process]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T15:57:49.174Z
sources:
  - id: openwiki-source-615f3e67d853905a1e26e16e
    resource: repo://.claude/skills/plan-review/SKILL.md
  - id: openwiki-source-84abd130edee44e1ec345560
    resource: repo://.claude/skills/write-tests/SKILL.md
  - id: openwiki-source-bff475d8fa855e3592cfedc2
    resource: repo://.specify/memory/constitution.md
  - id: openwiki-source-07a9298853095c847d0d8df0
    resource: repo://.specify/workflows/speckit/workflow.yml
  - id: openwiki-source-a4541088df1cbd68d4d4ad50
    resource: repo://specs/sf-70-bicycle-track/spec.md
generated: { by: "claude-code", at: "2026-11-16T15:57:49.174Z" }
---

# Spec-driven development workflow

Features are built with [GitHub Spec Kit](https://github.com/github/spec-kit) driven through Claude Code. The Spec Kit setup is in `.specify/`, the agent commands are skills in `.claude/skills/`, and each feature keeps its design artifacts in `specs/<feature-branch-name>/`.

## Spec Kit configuration (`.specify/`)

- `.specify/workflows/speckit/workflow.yml` defines the "Full SDD Cycle": `specify` → review gate → `plan` → review gate → `tasks` → `implement`. If a reviewer rejects at a gate, the run aborts.
- `.specify/templates/` has the templates for spec, plan, tasks, checklist and constitution.
- `.specify/memory/constitution.md` is still the unfilled template. The project has no ratified constitution, so no project principles are enforced through it.
- `.specify/extensions/git/` is the git extension (bash, PowerShell and Python scripts). It creates feature branches, validates branch names, and can auto-commit around commands. `git-config.yml` sets sequential branch numbering, and every `auto_commit` hook is disabled by default.
- `.specify/scripts/bash/` holds the helper scripts the commands call (`create-new-feature.sh`, `setup-plan.sh`, `setup-tasks.sh`, `check-prerequisites.sh`).

## Skills (`.claude/skills/`)

The core Spec Kit commands are available as skills: `speckit-specify`, `speckit-clarify`, `speckit-plan`, `speckit-tasks`, `speckit-checklist`, `speckit-analyze`, `speckit-implement`, `speckit-constitution`, and the `speckit-git-*` helpers. The project adds skills that put a human in the loop between those steps:

| Skill | Runs after | What it does |
| --- | --- | --- |
| `check-plan-completeness` | `speckit-checklist` | Turns unticked checklist items into questions, applies the answers to the spec and plan. |
| `review-analyze-findings` | `speckit-analyze` | Shows every finding with a proposed fix and applies the human's answers. |
| `write-tests` | `speckit-tasks` | Writes the deterministic tests and the AI test scenarios, and records them in `tasks.md`. |
| `plan-review` | `write-tests` | Shows the whole plan as one HTML page plus a short Linear comment, and iterates until it is approved. |
| `speckit-converge` | implementation | Compares the code with spec, plan and tasks, and appends any unbuilt work as new tasks. |
| `plan-fix` | a failed review or build | Explains the problem, plans the fix and its test, then applies the chosen fix. |
| `visual-briefing` | any time | Presents findings, plans or summaries for fast reading. |
| `ponytail` | any coding task | Pushes toward the simplest solution that works. |

## Feature artifacts (`specs/<branch>/`)

Each feature branch (for example `factory/sf-70-bicycle-track`) has a folder with:

- `spec.md`: user stories, functional requirements (`FR-…`), success criteria (`SC-…`) and recorded clarifications. For example, the bike feature records that design C (segmented buttons) was chosen and that bike routes show the pleasure indicator.
- `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`: the technical plan and its supporting notes.
- `tasks.md`: the ordered task list, including the tests that `write-tests` added.
- `checklists/requirements.md`: the spec quality checklist.
- `design-options.html`: UI design options shown to the human.
- `dependencies.json`: new dependencies the feature adds (an empty list for the bike feature).

The tests a feature brings land in `test/` (Node unit tests) and `tests/ai/` (AI-run browser scenarios, one file per user story). See [Testing](../testing/testing.md).
