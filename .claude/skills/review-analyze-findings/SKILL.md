---
name: "review-analyze-findings"
description: "After /speckit-analyze, fix or dismiss each finding, ask the human only about the findings that need their decision, and record every dismissal."
argument-hint: "the analyze report, if not in the conversation"
user-invocable: true
disable-model-invocation: true
---

# Review analyze findings

A gate between `/speckit-analyze` and `/speckit-implement`. `/speckit-analyze` reports findings
(`C1`, `A2`, `D3`, ...) with a severity (CRITICAL, HIGH, MEDIUM, LOW) about inconsistencies,
gaps and ambiguities across `spec.md`, `plan.md` and `tasks.md`. This skill fixes or dismisses each
finding itself, through the command that owns each file. It asks the human only about the findings
that need their decision (rule 12), and records every dismissal so it is not raised again. When no
finding needs the human, the skill never reaches them. The feature moves on to
`/speckit-implement` only when no CRITICAL or HIGH finding is left.

## User Input

```text
$ARGUMENTS
```

If not empty, it is the report `/speckit-analyze` printed.

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
     every reply after it. The items are rebuilt from the comment (numbers + finding IDs) and from
     `<feature>/analyze-report.md`, never from memory.
5. **One comment per round:** each run posts exactly one comment, given as the outcome (rule 9).
   Every item in it has a number, its finding ID and severity, e.g. `**2. C1, HIGH**`.
6. **Matching answers:** replies are free text. Match each answer to its item by meaning; a
   number or ID helps but is optional. Never guess. Classify each item:
   - **not an issue:** dismiss it as described in Apply;
   - **clear:** apply the fix (the proposed one if the human accepts it, or theirs);
   - **unclear** (you can't tell which item it answers, or what it means): ask one follow-up
     question about it in this run's comment. If the reply to the follow-up is still unclear,
     don't ask again: keep the item open (as unsure) and say so;
   - **unsure** (the human doesn't know yet, or didn't answer the item): the item stays open and
     the step stays blocked until a later reply.
7. **Read-back:** every Apply run starts its comment with a read-back, one line per item:
   `1. C1: fixed: deleted users' tasks go to the PM (spec.md FR-005, tasks regenerated)`,
   `2. A3: dismissed (the wording is deliberate)`, `3. U2: waiting for your answer`. This way a
   misunderstanding costs little to fix.
8. **Push:** at the end of each run (Ask or Apply), if files changed: `git add` the changed files
   under `specs/` and `tests/` (and any test folders the write-tests record step touched), commit
   with a short message (`gate(review-analyze-findings): ask` / `gate(review-analyze-findings): apply`),
   then `git push` the current branch. Never force-push.
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
    instructions with `$ARGUMENTS` = A. Run the write-tests record step the same way: follow the
    "Record tests in tasks.md" section of `.claude/skills/write-tests/SKILL.md`.
11. **Who and when:** a name recorded in a file (dismissals) is the author of the reply that gave
    the answer. A date is that reply's date (YYYY-MM-DD). For what you decide yourself, the name is
    `the factory` and the date is today.
12. **When to ask the human:** only when the fix needs a decision that the issue, `spec.md`,
    `plan.md` and the repo do not settle: what the feature must do (scope, behaviour the user sees,
    data kept or shared, a security or privacy trade-off). Fix everything else yourself: wording,
    duplicate or conflicting lines that the documents settle, missing or wrong tasks, test coverage,
    terms used two ways, a vague criterion the spec's own context makes measurable. Dismiss false
    positives yourself, with the reason. Never ask about a MEDIUM or LOW finding.

## Ask

1. Find the report `/speckit-analyze` printed: in the conversation, or in the User Input. If there
   is none, run `/speckit-analyze` (rule 10). Save the report as `<feature>/analyze-report.md`
   before writing the comment, so the Apply run can read it.
2. Read `<feature>/analyze-dismissed.md` (if present) and skip every finding whose ID is listed there.
3. Sort every remaining finding (rule 12): **fix** it yourself, **dismiss** it yourself, or **ask**
   the human.
4. Apply your fixes and dismissals now, as in Apply (the order of the files, one run of each
   command, dismissal lines with `the factory` as the name).
5. Nothing to ask: Finish (below). The human is not contacted.
6. Something to ask: write one comment with only those findings, numbered:
   `**N. <ID>, <SEVERITY>: <title>**`, the finding in plain words and why it matters,
   *Fix in spec / plan / tasks:* (where the fix goes), and one proposed fix. End with one line on
   what you already did: `Fixed by the factory: <ID>, ... Dismissed by the factory: <ID> (<reason>), ...`.
   Push (rule 8), outcome `waiting`.

Example:

```markdown
**1. C1, CRITICAL: what happens to a deleted user's open tasks**
FR-005 says admins can delete users, but nothing says what happens to their open tasks. Deleting
them loses work; keeping them leaves tasks nobody owns.
*Fix in spec:* their open tasks go back to the project's PM, who reassigns them.

Fixed by the factory: A2 ("fast" search is now "under 1 second for 10,000 items"), D1, T2.
Dismissed by the factory: U3 (the wording is deliberate: FR-004 quotes the customer).
```

## Apply

Rebuild the items from the latest Ask comment and `<feature>/analyze-report.md` (rule 4), match
every reply to its item (rule 6), then:

| Answer | What to do |
|---|---|
| Not an issue (any severity) | Dismiss it. |
| Clear | Apply it, in the order below. |
| Unclear / unsure | Rules 6 and 7. |

A dismissal adds one line to `<feature>/analyze-dismissed.md` (create the file if missing):
`- <ID> (<SEVERITY>): <summary> — dismissed by <name>, <date>: <reason>`.

Apply clear answers in this order, because each file is built from the one before:

1. **Spec:** a `- Q: … → A: …` line under `## Clarifications` / `### Session <reply date>` in
   `spec.md` (create the headings if they're missing, as `/speckit-clarify` does), plus the change
   in the right section (requirement, edge case, success criterion or assumption).
2. **Plan:** if the answer changes the design or the spec changed above, re-run `/speckit-plan`
   with the answers as its argument (rule 10).
3. **Tasks:** if anything above changed or a finding is about tasks, re-run `/speckit-tasks`
   (rule 10).
4. **Tests:** after any `/speckit-tasks` re-run, run the write-tests "Record tests in tasks.md"
   step (rule 10). Tasks regeneration drops the test lines, and without them analyze reports every
   requirement as untested.

Group the answers so that each command runs at most once per Apply run.

Never edit `plan.md` or `tasks.md` by hand: re-run the command that owns them. The write-tests
record step is the only other writer of `tasks.md`.

## Finish

After applying, re-run `/speckit-analyze` (rule 10) and overwrite `<feature>/analyze-report.md`.

- No CRITICAL or HIGH finding left (other than dismissed ones) and no item open: `done`, next
  `/speckit-implement`. The readback lists what the factory fixed and dismissed, and the remaining
  MEDIUM / LOW findings, if any.
- New findings after the re-run: handle them as in Ask (fix or dismiss them yourself; ask only under
  rule 12), then re-run `/speckit-analyze` once more. Run it at most 3 times in one run of this skill;
  after that, dismiss the MEDIUM / LOW findings left (`the factory`, "still reported after 3 analyze
  runs") and ask only about CRITICAL / HIGH ones.
- Something to ask (new findings under rule 12, or items still open): `waiting`, with the read-back,
  then only those findings.

Push before the outcome (rule 8).
