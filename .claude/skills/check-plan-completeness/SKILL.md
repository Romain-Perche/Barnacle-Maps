---
name: "check-plan-completeness"
description: "After /speckit-checklist, turn every unticked checklist item into a question for the human, apply their answers to the spec (and plan), and tick the items they confirm."
argument-hint: ""
user-invocable: true
disable-model-invocation: true
---

# Check plan completeness

A gate between `/speckit-checklist` and `/speckit-tasks`. `/speckit-checklist` writes items
(`CHK001`, `CHK002`, ...) that ask whether the requirements are complete, clear and consistent.
This skill shows the human every item not yet ticked, with a proposed answer, writes their answers
into the spec (and the plan when the design changes), and ticks the items they settled. The
feature moves on to `/speckit-tasks` only when every item is ticked.

## User Input

```text
$ARGUMENTS
```

No argument is needed: the inputs come from the run's `history` (rule 3).

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
     every reply after it. The items are rebuilt from the comment (numbers + `CHK` IDs) and from
     the checklist files in the repo, never from memory.
5. **One comment per round:** each run posts exactly one comment, given as the outcome (rule 9).
   Every item in it has a number and its checklist ID, e.g. `**1. CHK007**`.
6. **Matching answers:** replies are free text. Match each answer to its item by meaning; a
   number or ID helps but is optional. Never guess. Classify each item:
   - **covered:** the human confirms the spec or plan already covers it: tick it;
   - **clear:** apply the answer (see Apply);
   - **unclear** (you can't tell which item it answers, or what it means): ask one follow-up
     question about it in this run's comment. If the reply to the follow-up is still unclear,
     don't ask again: keep the item open (as unsure) and say so;
   - **unsure** (the human doesn't know yet, or didn't answer the item): the item stays open and
     the step stays blocked until a later reply.
7. **Read-back:** every Apply run starts its comment with a read-back, one line per item:
   `1. CHK007: covered, ticked`, `2. CHK009: noted: the PM reassigns them (spec.md FR-005)`,
   `3. CHK011: waiting for your answer`. This way a misunderstanding costs little to fix.
8. **Push:** at the end of each run (Ask or Apply), if files changed: `git add` the changed files
   under `specs/`, commit with a short message (`gate(check-plan-completeness): ask` /
   `gate(check-plan-completeness): apply`), then `git push` the current branch. Never force-push.
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
    instructions with `$ARGUMENTS` = A.
11. **Who and when:** a name recorded in a file (ticks) is the author of the reply that gave the
    answer. A date is that reply's date (YYYY-MM-DD).

## Ask

1. Read every `- [ ]` item in `<feature>/checklists/*.md` except `requirements.md` (the spec
   quality checklist that `/speckit-specify` already handled).
2. For each item, read what `spec.md`, `plan.md` and the other design files (`data-model.md`,
   `contracts/`, `research.md`, `quickstart.md`) say about it. Decide whether it is a gap or
   already looks covered.
3. Write one comment, numbered, one entry per gap:
   - `**N. CHK0xx** (checklists/<file>.md)`
   - the gap in plain words;
   - what the spec or plan says today: one quoted line at most, with its reference (e.g. FR-005);
   - *Proposal:* one concrete solution the human can accept as is.
4. End with one line listing the items that already look covered:
   `Look covered, confirm in bulk: N. CHK0xx, ...`.
5. Write no file. Outcome: `waiting`.

If there are no unticked items: outcome `done`, next `/speckit-tasks`.

Example:

```markdown
**1. CHK007** (checklists/ux.md)
What happens to a deleted user's open tasks is not said.
Today: "Admins can delete users" (FR-005).
*Proposal:* their open tasks go back to the project's PM, who reassigns them.

**2. CHK012** (checklists/security.md)
No limit on login attempts.
Today: nothing in spec.md or plan.md.
*Proposal:* lock the account for 15 minutes after 5 failed attempts in a row.

Look covered, confirm in bulk: 3. CHK003, 4. CHK009
```

## Apply

Rebuild the items from the latest Ask comment and the checklist files (rule 4), match every reply
to its item (rule 6), then for each item:

| Answer | What to do |
|---|---|
| Covered | Tick it. |
| Clear | Write a `- Q: <the gap as a question> → A: <the answer>` line under `## Clarifications` / `### Session <reply date>` in `spec.md` (create the headings if they're missing, as `/speckit-clarify` does: `## Clarifications` just after the overview section), plus the change in the right section of `spec.md` (requirement, edge case, success criterion or assumption). Then tick. |
| Clear, and it changes the design (an entity, field, interface, integration or constraint) | As above, then re-run `/speckit-plan` with the answer as its argument (rule 10). Run it once per run, with all the design answers together. |
| Unclear / unsure | Rules 6 and 7; no tick. |

**Ticking:** change `- [ ]` to `- [x]` on that item's line only, and append
` — reviewed by <name>, <date>` (rule 11). Never tick an item the human didn't answer. Never change
any other line of a checklist.

Example: `- [x] CHK007 Are deleted users' open tasks handled? [Gap] — reviewed by Alice Martin, 2026-11-06`

## Finish

- Items still open (unclear or unsure): outcome `waiting`. The `ask` has the read-back, the
  follow-up questions, and the list of items still waiting
  (`Blocked until these are answered: 3. CHK011, ...`).
- All ticked and no design change: `done`, next `/speckit-tasks`.
- All ticked and the design changed (`/speckit-plan` ran): `done`, next `/speckit-checklist`, then
  this skill again (it only sees the new unticked items).

Push before the outcome (rule 8).
