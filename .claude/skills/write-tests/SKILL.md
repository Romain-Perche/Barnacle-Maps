---
name: "write-tests"
description: "After /speckit-tasks, write the deterministic tests and AI test scenarios, record them in tasks.md, and get them approved"
argument-hint: "`record` to only re-record the tests in tasks.md"
user-invocable: true
disable-model-invocation: true
---

# Write tests

A gate between `/speckit-tasks` and `/speckit-analyze`. Before any code is written, this skill
writes the feature's tests from the spec: deterministic tests (contract, integration, and unit
tests where the plan has them) that fail until the feature is built, and AI test scenarios that an
agent will later perform on the running app. It records every test as a task in `tasks.md` and
asks the human to approve them.

## User Input

```text
$ARGUMENTS
```

If it is `record`, run only "Record tests in tasks.md", then end with `done` (next: empty, or the
caller's next step). Otherwise run the whole skill.

## How this skill runs

1. **Only the factory runs this skill.** It runs in a VM that stops while the human answers, so
   every run starts from nothing but the repo and the run's inputs. Never rely on an earlier
   session's memory.
2. **Feature folder:** read `feature_directory` from `.specify/feature.json` if it exists. It is
   gitignored, so a fresh VM usually doesn't have it. Otherwise use `specs/<current git branch>`
   if that folder exists, otherwise the only folder under `specs/`. If none of these works, end
   with `waiting` and ask which feature. Below, `<feature>` is that folder.
3. **Inputs:** the run's `history` (in `inputs.json`, or in the Inputs block of the prompt) holds
   the earlier Ask comments this skill posted and the replies to them, each with author and date.
   Only replies from factory team members count. The orchestrator passes only those; if a reply is
   marked as not from the team, or as from the factory itself, ignore it.
4. **Phase:**
   - **Ask** when the history has no Ask comment from this skill, or when its latest Ask has
     already been applied (a `done` outcome after it).
   - **Apply** when the latest Ask from this skill has replies after it. Read that Ask comment and
     every reply after it. The items are rebuilt from the comment (numbers + task IDs) and from the
     test files and `tasks.md` in the repo, never from memory.
5. **One comment per round:** each run posts exactly one comment, given as the outcome (rule 9).
   Every item in it has a number and its task ID, e.g. `**3. T040**`.
6. **Matching answers:** replies are free text. Match each answer to its item by meaning; a
   number or ID helps but is optional. Never guess. Classify each item:
   - **approved:** keep the test as it is;
   - **clear:** make the requested change (see Apply);
   - **unclear** (you can't tell which item it answers, or what it means): ask one follow-up
     question about it in this run's comment. If the reply to the follow-up is still unclear,
     don't ask again: keep the item open (as unsure) and say so;
   - **unsure** (the human doesn't know yet, or didn't answer the item): the item stays open and
     the step stays blocked until a later reply.
   "Approved", "looks good" or similar for the whole comment approves every item.
7. **Read-back:** every Apply run starts its comment with a read-back, one line per item:
   `1. T040: approved`, `2. T041: changed: also checks the 403 for another user's comment`,
   `3. T045: waiting for your answer`. This way a misunderstanding costs little to fix.
8. **Push:** at the end of each run (Ask or Apply), if files changed: `git add` the changed files
   under `specs/`, `tests/` and any other test folders this skill wrote, commit with a short
   message (`gate(write-tests): ask` / `gate(write-tests): apply`), then `git push` the current
   branch. Never force-push.
9. **Outcome:** the run's LAST message ends with exactly one fenced json block, and nothing after it:
   - `{"status": "waiting", "ask": "<the comment in markdown>"}` when anything needs a human
     answer (new items, a follow-up question, items still open). On Apply rounds the `ask` starts
     with the read-back.
   - `{"status": "done", "readback": "<the read-back and the outcome>", "next": "<next command>"}`
     when nothing is open.
   The orchestrator posts `ask` or `readback` to the Linear issue and runs the next round with the
   reply. For a manual test, a person copies `ask` into Linear by hand.
10. **Running other skills from this one:** the Spec Kit skills and the factory skills have
    `disable-model-invocation: true`, so you can't start them with the Skill tool. To "re-run
    `/speckit-X` with argument A", read `.claude/skills/speckit-X/SKILL.md` and follow its
    instructions with `$ARGUMENTS` = A. Other skills run this skill's record step the same way:
    they follow "Record tests in tasks.md" below.
11. **Who and when:** a name recorded in a file is the author of the reply that gave the answer.
    A date is that reply's date (YYYY-MM-DD).

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
  nothing new or the behaviour already exists: look at why and say it in the Ask. Don't weaken a
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

With the argument `record`: push (rule 8) and end with `done`, `next` empty or the caller's next
step.

## 5. Ask

One comment, one section per user story:

- each deterministic test: number, task ID, what it checks, FR / scenario, result (*failing as
  expected* / *unexpectedly passing*). Unexpected passes are flagged first;
- each AI scenario: number, task ID, steps and expected results in short.

Then list every acceptance scenario with no test of either kind, and every user story missing a
deterministic test or an AI test. Outcome `waiting`.

Example:

```markdown
### US1: Delete a comment
**1. T040** Contract: DELETE /comments/{id} returns 204, then GET returns 404 (FR-003, US1 scenario 2), failing as expected.
**2. T041** AI test: log in as Alice, delete her comment, reload: the comment is gone; Bob's comment has no delete button (FR-003, US1 scenario 1, 2).

No test: US2 scenario 3 (export when the list is empty).
```

## 6. Apply

Rebuild the items (rule 4), match the replies (rule 6), then:

- **Approved** (every item): `done`, next `/speckit-analyze`.
- **Changes requested:** change the tests or scenarios, re-run the deterministic ones (step 2),
  re-record (step 4), and Ask again: `waiting`, read-back first, then the new Ask (step 5).
- **Unclear / unsure:** rules 6 and 7.

## 7. Finish

As in 6: everything approved → `done`, next `/speckit-analyze`; otherwise `waiting`. Push before
the outcome (rule 8).

## 8. Running the tests later

Rules for the future Running tests step; this skill doesn't run them.

- Deterministic tests run as usual; a failure goes back to `/speckit-implement`.
- AI tests: the app is started in the VM with the scenario's test data. An agent performs the
  steps, checks each expected result and records notes and screenshots. A failed scenario is
  retried once; only a repeated failure goes back to implement, with the notes attached.
- After 3 rounds back to implement for the same AI test, stop and ask a human on the Linear issue.
