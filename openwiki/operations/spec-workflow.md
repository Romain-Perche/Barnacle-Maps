---
type: workflow
title: Spec-driven workflow
description: How changes to Barnacle Maps are specified and built with GitHub Spec Kit (.specify) and the factory's Claude Code skills, and what a feature folder under specs/ contains, using SF-72 (bike mode) as the example.
tags: [workflow, spec-kit, specs, factory, skills]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T14:30:06.574Z
sources:
  - id: openwiki-source-84abd130edee44e1ec345560
    resource: repo://.claude/skills/write-tests/SKILL.md
  - id: openwiki-source-b0a3b747268ffb4a3afe9b8b
    resource: repo://.specify/extensions.yml
  - id: openwiki-source-bff475d8fa855e3592cfedc2
    resource: repo://.specify/memory/constitution.md
  - id: openwiki-source-07a9298853095c847d0d8df0
    resource: repo://.specify/workflows/speckit/workflow.yml
  - id: openwiki-source-8c590927ad16b537495de5d4
    resource: repo://specs/sf-72-bycicle-track/spec.md
generated: { by: "claude-code", at: "2026-11-17T14:30:06.574Z" }
---

# Spec-driven workflow

Features are developed with [GitHub Spec Kit](https://github.com/github/spec-kit), driven by a software factory through Claude Code skills. The app code itself does not depend on any of this; it is development tooling.

## Spec Kit setup (`.specify/`)

- `.specify/workflows/speckit/workflow.yml` - the "Full SDD Cycle": `speckit.specify` → review → `speckit.plan` → review → `speckit.tasks` → `speckit.implement`.
- `.specify/templates/` - templates for spec, plan, tasks, checklist and constitution.
- `.specify/scripts/bash/` - helpers such as `create-new-feature.sh`, `setup-plan.sh`, `check-prerequisites.sh`.
- `.specify/extensions/git/` and `.specify/extensions.yml` - the git extension; its hooks (e.g. `speckit.git.feature` before `specify`) create the feature branch and can auto-commit.
- `.specify/memory/constitution.md` - still the unfilled template, so the project has no ratified constitution.

## Skills (`.claude/skills/`)

The `speckit-*` skills (specify, clarify, plan, tasks, checklist, analyze, implement, converge, constitution, git-*) wrap the Spec Kit commands. Factory-specific gates sit between them, for example:

- `check-plan-completeness` - turns unticked checklist items into questions for a person;
- `review-analyze-findings` - walks a person through `/speckit-analyze` findings;
- `write-tests` - writes the tests before any code, between `/speckit-tasks` and plan review;
- `plan-review` - shows the plan as one HTML page and collects decisions;
- `plan-fix` - plans a fix after a review finds a problem;
- `visual-briefing`, `ponytail`, `openwiki` - presentation, minimal-solution and wiki helpers.

## A feature folder

Each feature has a branch `factory/<id>-<slug>` and a folder `specs/<id>-<slug>/`. For SF-72 ("bycicle track", the Bike travel mode), `specs/sf-72-bycicle-track/` holds:

| File | Content |
| --- | --- |
| `spec.md` | User stories, requirements (FR-…), success criteria (SC-…) and the clarification Q&A (design C segmented selector, pleasure for bike, fake OSRM testing, NoRoute messages) |
| `design-options.html` | The selector designs offered to the person |
| `plan.md`, `research.md`, `data-model.md` | Technical plan and decisions |
| `contracts/travel-modes.md` | Contract for `TRAVEL_MODES` / `routeUrl`, tested by `test/bike.test.js` |
| `tasks.md` | Ordered implementation tasks |
| `quickstart.md` | How to try the feature |
| `checklists/requirements.md` | Requirement-quality checklist |
| `dependencies.json` | New dependencies (none for SF-72) |

Tests reference requirement ids in comments (e.g. `// covers SC-004, FR-005`), and the AI scenarios in `tests/ai/` list the FRs and user-story scenarios they cover. `.factory/test-env.md` records which outside services are faked and why. See [Running and testing](running-and-testing.md).

The factory also generates [sbom/SBOM.md](../../sbom/SBOM.md), [dataflow/DATAFLOW.md](../../dataflow/DATAFLOW.md) and this wiki after review.

## Related pages

- [Running and testing](running-and-testing.md)
- [Routing and travel modes](../features/routing-and-travel-modes.md)
