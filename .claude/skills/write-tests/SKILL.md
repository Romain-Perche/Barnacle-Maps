---
name: "write-tests"
description: "After /speckit-tasks, write the deterministic tests and AI test scenarios, record them in tasks.md, and report them (no human approval)"
argument-hint: "`record` to only re-record the tests in tasks.md"
user-invocable: true
disable-model-invocation: true
---

# Write tests

A gate between `/speckit-tasks` and the Plan Review (`/plan-review`; Build for an easy task). Before
any code is written, this skill
writes the feature's tests from the spec: deterministic tests (contract, integration, and unit
tests where the plan has them) that fail until the feature is built, and AI test scenarios that an
agent will later perform on the running app. It records every test as a task in `tasks.md`,
rereads the whole plan as a reviewer would and fixes it, then reports. The skill never waits for
an answer: a person sees the plan and the tests in the Plan Review.

## User Input

```text
$ARGUMENTS
```

If it is `record`, run only "Record tests in tasks.md", then end with `done` (next: empty, or the
caller's next step). Otherwise run the whole skill.

## How this skill runs

1. **Only the factory runs this skill.** It runs in a fresh VM, so
   every run starts from nothing but the repo and the run's inputs. Never rely on an earlier
   session's memory.
2. **Feature folder:** read `feature_directory` from `.specify/feature.json` if it exists. It is
   gitignored, so a fresh VM usually doesn't have it. Otherwise use `specs/<current git branch>`
   if that folder exists, otherwise the only folder under `specs/`. If none of these works, end
   with `waiting` and ask which feature. Below, `<feature>` is that folder.
3. **No human step.** This skill writes, checks and records the tests, then ends with `done`.
   It never asks the human and never waits. Where you would ask, decide yourself and say so in
   the report.
4. **Commit:** at the end of the run, if files changed: `git add` the changed files
   under `specs/`, `tests/` and any other test folders this skill wrote, commit with a short
   message (`gate(write-tests): tests`). Do not push: the factory checks your commits and pushes them after the run.
5. **Outcome:** the run's LAST message ends with exactly one fenced json block, and nothing after it:
   `{"status": "done", "readback": "<the report, step 6>", "next": "/plan-review"}`. The
   orchestrator posts the report on the Linear issue for information. Only if the feature folder
   cannot be found (rule 2), end with `{"status": "waiting", "ask": "<which feature?>"}`.
   **Style:** read `.claude/skills/visual-briefing/SKILL.md` and write every `ask` and `readback` as it
   says. Keep the format these rules set (numbers, IDs, read-back lines).
6. **Running other skills from this one:** the Spec Kit skills and the factory skills have
    `disable-model-invocation: true`, so you can't start them with the Skill tool. To "re-run
    `/speckit-X` with argument A", read `.claude/skills/speckit-X/SKILL.md` and follow its
    instructions with `$ARGUMENTS` = A. Other skills run this skill's record step the same way:
    they follow "Record tests in tasks.md" below.
7. **Dates** are today's date (YYYY-MM-DD).

## 1. Inputs

Read from `<feature>`:

- `spec.md`: user stories (US1, US2, ...), their acceptance scenarios, and the requirements (FR-xxx);
- `contracts/`: endpoints and interfaces;
- `data-model.md`: entities, fields, rules;
- `quickstart.md`: how to run the feature and check it;
- `plan.md`: the testing framework and the project structure (where tests go);
- `tasks.md`: the phases per user story and the task IDs.

## 2. Deterministic tests

- At least one test per acceptance scenario, and one contract test per endpoint or interface in
  `contracts/`.
- Contract and integration tests, plus unit tests only where `plan.md`'s structure has a unit test
  folder.
- Write them where `plan.md`'s structure says (e.g. `tests/contract/`, `tests/integration/`), with
  its framework.
- Each test names the FR / scenario it covers, in a comment or its name
  (e.g. `// covers FR-003, US1 scenario 2`).
- Run them: they must fail, because there is no implementation yet. Note each one's result:
  *failing as expected* or *unexpectedly passing*. An unexpected pass means the test checks
  nothing new or the behaviour already exists: look at why and say it in the report. Don't weaken a
  test to make it fail.

## 3. AI tests

One scenario file per user story in `tests/ai/`: `tests/ai/us<N>-<slug>.md`, from the story's
acceptance scenarios and `quickstart.md`. Format:

```markdown
# US1: <story title>
Covers: FR-003, US1 scenario 1, 2

## Scenario 1: <name>
### Setup
(how to start the app, test data to create)
### Steps
1. ... (one action each, doable with headless Playwright for UI steps or curl / an HTTP client
   for API steps; both are allowed in one scenario)
### Expected
- [ ] <yes/no fact: "the comment no longer appears in the list", "GET /comments/7 returns 404">
```

Don't run them now (there is no app yet). Instead check that they're concrete: every step can be
done, and every expected result is a yes/no check, not an impression ("it works well"). Fix any
that aren't.

## 4. Record tests in tasks.md

This step must run on its own (with the argument `record`, or from another skill). Find the tests
from the files in the test folders (and the FR / scenario named in each), not from memory.

1. In `<feature>/tasks.md`, remove the test lines this step wrote earlier: lines containing
   ` Contract test `, ` Integration test `, ` Unit test ` or ` AI test: ` that point to a file
   under the test folders.
2. Add one completed task per test (or test file, when one file holds the tests of one scenario
   group) and per AI scenario, inside its user story's phase, before that phase's implementation
   tasks, tagged with its type and coverage:

   ```markdown
   - [X] T040 [US1] Contract test for comment deletion in tests/contract/comments.test.ts (covers FR-003, US1 scenario 2)
   - [X] T041 [US1] AI test: delete own comment in tests/ai/us1-comment-deletion.md (covers FR-003, US1 scenario 2)
   ```

3. IDs continue after the highest task ID in the file; never renumber existing tasks. Change no
   other line of `tasks.md`.

With the argument `record`: commit (rule 4) and end with `done`, `next` empty or the caller's next
step.

## 5. Reread the plan

Read the spec, the plan, the tasks, the contracts and your tests again, as a reviewer who must find
what is wrong. At most 2 rounds:

1. **Coverage.** Every requirement (FR) and every acceptance scenario has a task and a test.
2. **Agreement.** `spec.md`, `plan.md`, `tasks.md`, `contracts/` and the tests say the same thing: the same
   names, numbers, rules and order. No task asks to write a test that already exists.
3. **Examples.** Work out every example again by hand (the input, then the expected result) in the spec,
   the contracts and the tests. A wrong example is a bug in the plan.
4. **Design.** If `<feature>/design-options.html` exists, the choice recorded in `spec.md` (Clarifications)
   is the target: the plan and the tests follow that option.
5. **Fix** what you find through the command that owns the file: re-run `/speckit-plan` or
   `/speckit-tasks` with the fix as its argument (rule 6), then re-record the tests (step 4). Never edit
   `plan.md` or `tasks.md` by hand. Fix the tests and the other files directly.
6. **A choice only a person can make** (scope, what the user sees, data kept or shared, security): choose
   the safest option yourself, add it to `spec.md` under `## Clarifications` as
   `- Q: <the question> → A: <your choice> (decided by the factory, to confirm)`, and say it in the report.
   The Plan Review shows these choices to the person.

## 6. Report

Before the report, close the gaps yourself: write a test for every acceptance scenario with no test
of either kind, and fix or remove a test that passes unexpectedly because it checks nothing new
(never weaken a test to make it fail). Re-run the deterministic tests and re-record (step 4).

Then write the report, one section per user story:

- each deterministic test: task ID, what it checks, FR / scenario, result (*failing as expected* /
  *unexpectedly passing*, with why);
- each AI scenario: task ID, steps and expected results in short.

End with what you decided yourself, if anything (for example a scenario you chose not to test, and
why). Commit (rule 4), then outcome `done`, next `/plan-review`.

Example:

```markdown
### US1: Delete a comment
- T040 Contract: DELETE /comments/{id} returns 204, then GET returns 404 (FR-003, US1 scenario 2), failing as expected.
- T041 AI test: log in as Alice, delete her comment, reload: the comment is gone; Bob's comment has no delete button (FR-003, US1 scenario 1, 2).

Decided by the factory: US2 scenario 3 (export when the list is empty) is covered by T045's empty-table case.
```

## 8. Running the tests later

Rules for the future Running tests step; this skill doesn't run them.

- Deterministic tests run as usual; a failure goes back to `/speckit-implement`.
- AI tests: the app is started in the VM with the scenario's test data. An agent performs the
  steps, checks each expected result and records notes and screenshots. A failed scenario is
  retried once; only a repeated failure goes back to implement, with the notes attached.
- After 3 rounds back to implement for the same AI test, stop and ask a human on the Linear issue.
