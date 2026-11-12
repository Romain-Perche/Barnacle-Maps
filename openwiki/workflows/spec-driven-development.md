---
type: workflow
title: Spec-driven development workflow
description: How features reach Barnacle Maps through GitHub Spec Kit and the software factory. Covers the .specify/ setup, the per-feature folders under specs/, the factory gate skills in .claude/skills/, gate commit naming, and the generated SBOM and wiki.
tags: [workflow, spec-kit, factory, process, specs]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-12T11:52:33.190Z
sources:
  - id: openwiki-source-0c92f73f9d57ce1028354783
    resource: repo://.claude/skills/check-plan-completeness/SKILL.md
  - id: openwiki-source-9db1ff9b5599a52fa611d35b
    resource: repo://.claude/skills/review-analyze-findings/SKILL.md
  - id: openwiki-source-84abd130edee44e1ec345560
    resource: repo://.claude/skills/write-tests/SKILL.md
  - id: openwiki-source-b9b49aefe79c4bbea4f8f1df
    resource: repo://.specify/extensions/git/git-config.yml
  - id: openwiki-source-cada88734cb8a9aa1b3d0021
    resource: repo://.specify/extensions/git/README.md
  - id: openwiki-source-bff475d8fa855e3592cfedc2
    resource: repo://.specify/memory/constitution.md
  - id: openwiki-source-07a9298853095c847d0d8df0
    resource: repo://.specify/workflows/speckit/workflow.yml
  - id: openwiki-source-8d0c73cb966c53fcba3c0252
    resource: repo://specs/pilot-83386-show-the-arrival-time-for-each-route/analyze-dismissed.md
generated: { by: "claude-code", at: "2026-11-12T11:52:33.190Z" }
---

# Spec-driven development workflow

Features are built through **GitHub Spec Kit**, driven by an automated "software factory". The factory runs Claude Code skills as gates. Each feature gets a folder under `specs/<branch-name>/`, which holds the spec, the plan and the task list that the code and tests trace back to.

## Pieces in the repository

| Path | Role |
| --- | --- |
| `.specify/workflows/speckit/workflow.yml` | Spec Kit's "Full SDD Cycle": `specify`, then a review gate, then `plan`, then a review gate, then `tasks` and `implement`. |
| `.specify/templates/` | Templates for the spec, plan, tasks, checklist and constitution. |
| `.specify/scripts/bash/` | Helper scripts (prerequisite check, feature creation, plan and tasks setup). |
| `.specify/extensions/git/` | Git extension for feature branches (sequential or timestamp numbering), branch validation, remote detection and optional auto-commit hooks. Auto-commit is off by default in `git-config.yml`. |
| `.specify/memory/constitution.md` | The project constitution. It is still the **unfilled template**, so the project declares no principles yet. |
| `.claude/skills/speckit-*` | The Spec Kit commands as skills: specify, clarify, plan, tasks, checklist, analyze, implement, converge, constitution and git-*. |
| `.claude/skills/check-plan-completeness`, `write-tests`, `review-analyze-findings` | Factory gate skills (see below). |
| `.claude/skills/openwiki` | The OpenWiki skill that keeps this wiki up to date. |

## Feature folder contents

The folder for the arrival-time feature, `specs/pilot-83386-show-the-arrival-time-for-each-route/`, contains:

- `spec.md`: user stories, clarifications, numbered requirements (FR-001…) and success criteria (SC-001…);
- `plan.md`, `research.md`, `data-model.md` and `quickstart.md`;
- `contracts/route-entry.md`: the exact module API and UI text contract (see [Arrival time](../features/arrival-time.md));
- `checklists/`, which `check-plan-completeness` works through;
- `tasks.md`: implementation and test tasks;
- `analyze-report.md` and `analyze-dismissed.md`: the analyze findings, and the record of each finding that was dismissed and why.

## Factory sequence

Commit history on a feature branch follows this order:

1. **Spec**: `/speckit-specify` and clarify write `spec.md`. The factory answers most clarifications itself and labels them "decided by the factory".
2. **Plan and checklist**: `check-plan-completeness` turns every unticked checklist item into a question, applies the answers to the spec and plan, and commits as `gate(check-plan-completeness): ask` and then `apply`.
3. **Tasks and tests**: after `/speckit-tasks`, `write-tests` writes the deterministic tests in `test/` (they fail until the feature exists) and the AI scenarios in `tests/ai/`, records them in `tasks.md`, and commits as `gate(write-tests): tests`. No human approves this step. See [Testing](../testing/test-suite.md).
4. **Analyze**: after `/speckit-analyze`, `review-analyze-findings` fixes or dismisses each finding, records each dismissal and commits as `gate(review-analyze-findings): apply`.
5. **Implement**: the feature commit itself, named after the feature (for example "Show the arrival time for each route").
6. **Post-review**: after the AI review and the security review, the factory regenerates `sbom/` (SBOM.md and CycloneDX, using Trivy) and refreshes this wiki.

Branches are named `factory/<ticket>-<slug>` (for example `factory/pilot-83386-show-the-arrival-time-for-each-route`), and pull requests target `main`.

## Conventions for contributors

- Trace tests and code to requirement IDs (for example `// covers FR-002, US1 scenario 1`).
- Keep the logic pure and testable in `src/geo.js`, as the plans assume (see [Pure geo helpers](../architecture/geo-helpers.md)).
- Do not edit `sbom/` by hand: it is regenerated on every pull request.
