---
type: workflow
title: Spec-driven development workflow
description: How features reach Barnacle Maps. They go through Spec Kit (.specify), feature folders under specs/, and the project's Claude skills for checklist, analyze, test-writing, plan review and fix steps. It also shows how the commit history records the factory's gates.
tags: [workflow, spec-kit, specs, claude-skills, process]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-16T11:56:00.654Z
sources:
  - id: openwiki-source-615f3e67d853905a1e26e16e
    resource: repo://.claude/skills/plan-review/SKILL.md
  - id: openwiki-source-84abd130edee44e1ec345560
    resource: repo://.claude/skills/write-tests/SKILL.md
  - id: openwiki-source-b0a3b747268ffb4a3afe9b8b
    resource: repo://.specify/extensions.yml
  - id: openwiki-source-07a9298853095c847d0d8df0
    resource: repo://.specify/workflows/speckit/workflow.yml
  - id: openwiki-source-3e8a08ed15863585cada366b
    resource: repo://specs/pilot-28672-qr-code-of-the-selected-route/dependencies.json
generated: { by: "claude-code", at: "2026-11-16T11:56:00.654Z" }
---

# Spec-driven development workflow

Features are built with [Spec Kit](https://github.com/github/spec-kit) by a "software factory" that runs Claude Code agents with human review gates. None of this tooling runs at app runtime.

## Spec Kit (`.specify/`)

- `.specify/workflows/speckit/workflow.yml` defines the "Full SDD Cycle": **specify → plan → tasks → implement**, with a human `gate` (approve/reject) after the spec and after later steps.
- `.specify/extensions.yml` installs the `git` extension. Its hooks create a feature branch before `specify` and offer commits between steps (scripts under `.specify/extensions/git/scripts/`).
- `.specify/templates/` holds the spec, plan, tasks, checklist and constitution templates. `.specify/memory/constitution.md` is still the unfilled template.

## Feature folders (`specs/<feature>/`)

Each feature gets one folder named after its branch, for example `specs/pilot-28672-qr-code-of-the-selected-route/`, containing:

- `spec.md`: user stories, the numbered functional requirements (`FR-…`) and success criteria (`SC-…`);
- `plan.md`, `research.md`, `data-model.md`, `contracts/`: the technical design;
- `tasks.md`: the implementation tasks, plus the tests recorded by `write-tests`;
- `checklists/requirements.md`, `quickstart.md`, `design-options.html` (the UI options shown to a human);
- `dependencies.json`: each new third-party dependency, with its version, package manager and the reason for adding it.

## Project skills (`.claude/skills/`)

Besides the `speckit-*` command skills, the factory adds human-in-the-loop steps:

| Skill | When |
|---|---|
| `check-plan-completeness` | After `/speckit-checklist`: turns unticked items into questions for the human |
| `review-analyze-findings` | After `/speckit-analyze`: proposes a fix for each finding and applies the human's answers |
| `write-tests` | After `/speckit-tasks`: writes the deterministic tests (`test/`) and the AI scenarios (`tests/ai/`) |
| `plan-review` | Shows the whole plan as one HTML page and applies the reviewer's answers until approval |
| `plan-fix` | After a review finds a problem in the built code, plans the fix and its test |
| `visual-briefing`, `ponytail` | Presentation and "minimal solution" helpers |

Commits record the gates, for example `gate(plan-review): apply` and `gate(plan-fix): …`, followed by the implementation commits. Tests cite the `FR-…` ids they cover (see [Testing](../testing/test-strategy.md)). After review, the factory refreshes the data flow model, the SBOM and this wiki.
