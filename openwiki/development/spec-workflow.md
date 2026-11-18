---
type: workflow
title: Spec-driven development workflow
description: How changes to Barnacle Maps are specified, planned, tested and reviewed through Spec Kit artefacts under specs/ and the software-factory skills in .claude/skills.
tags: [workflow, spec-kit, process, factory]
verified:
  - by: openwiki/0.9.0
    at: 2026-11-17T11:34:31.384Z
sources:
  - id: openwiki-source-615f3e67d853905a1e26e16e
    resource: repo://.claude/skills/plan-review/SKILL.md
  - id: openwiki-source-84abd130edee44e1ec345560
    resource: repo://.claude/skills/write-tests/SKILL.md
  - id: openwiki-source-b0a3b747268ffb4a3afe9b8b
    resource: repo://.specify/extensions.yml
  - id: openwiki-source-bff475d8fa855e3592cfedc2
    resource: repo://.specify/memory/constitution.md
  - id: openwiki-source-c9b0495d9d3885d807fd8449
    resource: repo://specs/sf-74-sort-search-results/dependencies.json
  - id: openwiki-source-b3b36be254d1b1d91b4cc183
    resource: repo://specs/sf-74-sort-search-results/spec.md
generated: { by: "claude-code", at: "2026-11-17T11:34:31.384Z" }
---

# Spec-driven development workflow

Features in this repository are built by an AI "software factory" that follows
[Spec Kit](https://github.com/github/spec-kit): every feature gets a folder under `specs/`, a
feature branch named `factory/<id>-<slug>`, and a sequence of gated steps driven by the skills in
`.claude/skills/`. None of this ships with the app; it is the process around it.

## Feature folder

A feature such as `specs/sf-74-sort-search-results/` holds:

| File | Content |
| --- | --- |
| `spec.md` | User stories with priorities, acceptance scenarios, functional requirements (`FR-xxx`) and a Clarifications log of the answers a person gave. |
| `plan.md` | Technical context, constitution check, the files to change. |
| `research.md`, `data-model.md`, `contracts/` | Decisions and the UI/API contract the change must keep. |
| `tasks.md` | Numbered tasks by phase and user story, including the test tasks. |
| `checklists/requirements.md` | Spec quality checklist. |
| `design-options.html` | Visual design options shown to a person to choose from. |
| `dependencies.json` | New dependencies the feature adds (an empty list when none). |
| `quickstart.md` | How to see the feature working. |

## Steps and skills

The `speckit-*` skills are the stock Spec Kit commands (`specify`, `clarify`, `plan`, `tasks`,
`checklist`, `analyze`, `implement`, `converge`, `constitution`), and the `speckit-git-*` skills
come from the Spec Kit git extension that `.specify/extensions.yml` hooks in (create the feature
branch before `specify`, commit between steps). The factory adds its own gates:

- `check-plan-completeness` — turns unticked checklist items into questions for a person.
- `review-analyze-findings` — shows `/speckit-analyze` findings with proposed fixes.
- `write-tests` — before any code, writes the deterministic tests (in `test/`) and one AI
  scenario file per user story in `tests/ai/us<N>-<slug>.md`, and records them as tasks.
- `plan-review` — shows a person the whole plan as one HTML page and applies their answers until
  they approve; Build then starts.
- `plan-fix` — after a review finds a problem in built code, plans the fix and its test.
- `visual-briefing`, `ponytail` — presentation style and a "simplest solution" coding guideline.

`.factory/test-env.md` records, per feature, which outside services need fakes and how the AI
scenarios run the real app (see [Testing](../testing/tests.md)).

The Spec Kit constitution at `.specify/memory/constitution.md` is still the unfilled template, so
the plans' "Constitution Check" has no project-specific principles to check against.

After review, a docs step refreshes `dataflow/model.json` (drawn into
[`dataflow/DATAFLOW.md`](../../dataflow/DATAFLOW.md)), this wiki, and the SBOM in
[`sbom/SBOM.md`](../../sbom/SBOM.md).
