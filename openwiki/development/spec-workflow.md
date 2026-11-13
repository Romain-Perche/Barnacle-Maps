---
type: workflow
title: Spec-driven development workflow
description: How features reach Barnacle Maps - Spec Kit (.specify), Claude Code skills and the software factory gates that produce specs/<feature>/ artifacts, tests and the implementation.
tags: [process, spec-kit, claude-skills, factory]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T11:32:10.059Z
sources:
  - id: openwiki-source-0c92f73f9d57ce1028354783
    resource: repo://.claude/skills/check-plan-completeness/SKILL.md
  - id: openwiki-source-84abd130edee44e1ec345560
    resource: repo://.claude/skills/write-tests/SKILL.md
  - id: openwiki-source-b0a3b747268ffb4a3afe9b8b
    resource: repo://.specify/extensions.yml
generated: { by: "claude-code", at: "2026-11-13T11:32:10.059Z" }
---

# Spec-driven development workflow

Features are built by a "software factory" driving Claude Code with
[Spec Kit](https://github.com/github/spec-kit). The history shows the pattern: a spec commit, then
`gate(...)` commits, then factory tests, then the implementation commit on a `factory/<ticket>-...`
branch, merged by pull request.

## Where things live

| Path | Content |
|---|---|
| `.specify/` | Spec Kit installation: templates (`templates/`), helper scripts (`scripts/bash/`), the `speckit` workflow (`workflows/speckit/workflow.yml`: specify, review spec, plan, review plan, tasks, implement), the git extension and its hooks (`extensions.yml`), and `memory/constitution.md` (still the unfilled template). |
| `.claude/skills/` | Claude Code skills: the `speckit-*` commands, factory gates (`check-plan-completeness`, `write-tests`, `review-analyze-findings`), and `ponytail` (prefer the simplest solution). |
| `specs/<feature>/` | Artifacts of one feature: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, `tasks.md`, `checklists/`, `analyze-report.md`. |
| `tests/ai/` | AI test scenarios written from the spec (see [Test suite](../testing/test-suite.md)). |

## Gate order

1. `speckit-specify` writes the spec (the git extension's `before_specify` hook creates the
   feature branch; it is not optional).
2. `speckit-plan`, then `speckit-checklist`.
3. **check-plan-completeness** settles every unticked checklist item: it asks the human at most a
   few questions, decides the rest itself and writes the answers into the spec/plan.
4. `speckit-tasks`.
5. **write-tests** writes the deterministic tests and AI scenarios *before* the code, records them
   as tasks in `tasks.md`, and needs no human approval.
6. `speckit-analyze`, then **review-analyze-findings** fixes or dismisses each finding and records
   dismissals.
7. `speckit-implement` (and `speckit-converge` to append unbuilt work as tasks).

The git extension also offers optional `speckit.git.commit` hooks before and after most commands.

After review, the factory's "update docs" step refreshes [`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md),
`sbom/SBOM.md` and this wiki.
