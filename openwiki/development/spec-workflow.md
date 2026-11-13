---
type: workflow
title: Spec-driven development workflow
description: How features are planned with Spec Kit (.specify, specs/<feature>/) and the factory's Claude skills (write-tests, plan-review), and which generated artefacts (dataflow, sbom, openwiki) accompany each change.
tags: [workflow, spec-kit, process, documentation]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-13T13:06:33.368Z
sources:
  - id: openwiki-source-84abd130edee44e1ec345560
    resource: repo://.claude/skills/write-tests/SKILL.md
  - id: openwiki-source-b0a3b747268ffb4a3afe9b8b
    resource: repo://.specify/extensions.yml
  - id: openwiki-source-bff475d8fa855e3592cfedc2
    resource: repo://.specify/memory/constitution.md
  - id: openwiki-source-07a9298853095c847d0d8df0
    resource: repo://.specify/workflows/speckit/workflow.yml
generated: { by: "claude-code", at: "2026-11-13T13:06:33.368Z" }
---

# Spec-driven development workflow

Changes to Barnacle Maps are produced through a "software factory" built on [Spec Kit](https://github.com/github/spec-kit) and Claude Code skills. None of this is runtime code; it is the process that produced it.

## Spec Kit

- `.specify/` holds the Spec Kit installation: templates (`spec`, `plan`, `tasks`, `checklist`), helper scripts, the `git` extension, and the `speckit` workflow (`.specify/workflows/speckit/workflow.yml`), which runs **specify → plan → tasks → implement** with review gates between steps.
- `.specify/extensions.yml` registers git hooks: for example a feature branch is created before `specify`, and outstanding changes may be committed between steps.
- `.specify/memory/constitution.md` is still the unfilled template; the project has no ratified constitution.

## Feature folders

Each feature gets `specs/<feature-id>/`. The current one, `specs/pilot-73195-summary-card-for-the-selected-route/`, contains `spec.md`, `plan.md`, `research.md`, `data-model.md`, `tasks.md`, `quickstart.md`, `checklists/`, `contracts/` (the UI and `geo.js` API contracts the tests check) and `design-options.html`. Test files reference these contracts in their header comments.

## Factory skills

`.claude/skills/` contains the Spec Kit commands (`speckit-*`) and factory gates:

- `write-tests`: after `speckit-tasks`, writes deterministic tests and AI test scenarios (`tests/ai/`) that fail until the feature is built, and records them in `tasks.md`.
- `plan-review`: shows the plan to a person as one HTML page plus a short comment with open decisions, until they approve; Build follows.
- `check-plan-completeness`, `review-analyze-findings`, `visual-briefing`: supporting review and reporting skills.

See [Testing](../testing/test-suites.md) for how the produced tests run.

## Generated documentation

On each pull request the factory regenerates:

- `dataflow/model.json` and the drawn [dataflow/DATAFLOW.md](../../dataflow/DATAFLOW.md) (data flow model);
- `sbom/` ([sbom/SBOM.md](../../sbom/SBOM.md), software bill of materials; never edit by hand);
- this wiki under `openwiki/`.
