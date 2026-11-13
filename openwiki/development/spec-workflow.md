---
type: workflow
title: Spec-driven development workflow
description: How features of Barnacle Maps are specified, planned, tested and built with Spec Kit (.specify/), per-feature folders in specs/, and the Claude skills in .claude/skills, using the search clear button as the worked example.
tags: [process, spec-kit, development, workflow]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T16:11:40.024Z
sources:
  - id: openwiki-source-84abd130edee44e1ec345560
    resource: repo://.claude/skills/write-tests/SKILL.md
  - id: openwiki-source-b0a3b747268ffb4a3afe9b8b
    resource: repo://.specify/extensions.yml
  - id: openwiki-source-07a9298853095c847d0d8df0
    resource: repo://.specify/workflows/speckit/workflow.yml
  - id: openwiki-source-0f90b731bd4188448bda75e3
    resource: repo://specs/pilot-85820-clear-button-for-the-search-box/spec.md
  - id: openwiki-source-5b34aa5794a51e84479ba6bb
    resource: repo://specs/pilot-85820-clear-button-for-the-search-box/tasks.md
generated: { by: "claude-code", at: "2026-11-13T16:11:40.024Z" }
---

# Spec-driven development workflow

Features are developed spec-first with [Spec Kit](https://github.com/github/spec-kit), driven by Claude Code skills. The tooling lives outside the app code and never runs in the browser.

## Pieces

| Path | What it is |
| --- | --- |
| `.specify/workflows/speckit/workflow.yml` | The "Full SDD Cycle": `specify` → gate *review-spec* → `plan` → gate *review-plan* → `tasks` → `implement`. A rejected gate aborts the workflow. |
| `.specify/extensions.yml` + `.specify/extensions/git/` | The git extension's hooks, e.g. `speckit.git.feature` creates a feature branch before `specify`, `speckit.git.initialize` before the constitution. |
| `.specify/templates/` | Templates for spec, plan, tasks, checklist and constitution. |
| `.specify/memory/constitution.md` | The project constitution — still the unfilled template. |
| `.claude/skills/speckit-*` | The Spec Kit commands as skills (specify, clarify, plan, tasks, checklist, analyze, converge, implement, git helpers). |
| `.claude/skills/` (other) | Factory steps around Spec Kit: `check-plan-completeness`, `review-analyze-findings`, `write-tests`, `plan-review`, `plan-fix`, plus `visual-briefing` and `ponytail`. |
| `specs/<feature>/` | One folder per feature with the artifacts below. |

## Artifacts of a feature

The clear-button feature (`specs/pilot-85820-clear-button-for-the-search-box/`) shows the full set:

- `spec.md` — user stories, numbered functional requirements (`FR-001`…), clarifications recorded with the human's answers (e.g. design A, "only the search text and the result list" are cleared).
- `design-options.html` — visual design alternatives offered to the human.
- `research.md`, `data-model.md`, `contracts/ui-contract.md`, `plan.md`, `quickstart.md` — the plan and its design decisions.
- `tasks.md` — dependency-ordered tasks, including the tests the `write-tests` skill recorded.
- `checklists/requirements.md` — spec quality checklist.

Feature branches are named `factory/<ticket>-<slug>`, matching the spec folder name.

## Tests from specs

The `write-tests` step writes two kinds of tests that reference requirement IDs: deterministic `node --test` files in `test/` (e.g. `test/clear-button.test.js`, with `// covers FR-…` comments) and AI-driven browser scenarios in `tests/ai/*.md`. See [Testing](../testing/test-strategy.md).
