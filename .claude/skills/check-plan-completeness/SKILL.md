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
This skill settles every item not yet ticked. It asks the human about the few items that matter
most (5 questions at most for the whole feature, rule 12) and decides every other item itself with
its proposal. It writes the answers and its decisions into the spec (and the plan when the design
changes), and ticks the items. The feature moves on to `/speckit-tasks` only when every item is ticked.

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
7. **Read-back:** every Apply run starts its comment with a read-back, one line per item the human
   was asked about (rule 13):
   `1. CHK007: covered, ticked`, `2. CHK009: noted: the PM reassigns them (spec.md FR-005)`,
   `3. CHK011: waiting for your answer`. This way a misunderstanding costs little to fix.
8. **Commit:** at the end of each run (Ask or Apply), if files changed: `git add` the changed files
   under `specs/`, commit with a short message (`gate(check-plan-completeness): ask` /
   `gate(check-plan-completeness): apply`). Do not push: the factory checks your commits and pushes them after the run.
9. **Outcome:** the run's LAST message ends with exactly one fenced json block, and nothing after it:
   - `{"status": "waiting", "ask": "<the comment in markdown>"}` when anything needs a human
     answer (new items, a follow-up question, items still open). On Apply rounds the `ask` starts
     with the read-back.
   - `{"status": "done", "readback": "<the read-back and the outcome>", "next": "<next command>"}`
     when nothing is open.
   The orchestrator posts `ask` or `readback` to the Linear issue and runs the next round with the
   reply. For a manual test, a person copies `ask` into Linear by hand.
   **Style:** read `.claude/skills/visual-briefing/SKILL.md` and write every `ask` and `readback` as it
   says. Keep the format these rules set (numbers, IDs, read-back lines).
10. **Running other skills from this one:** the Spec Kit skills and the factory skills have
    `disable-model-invocation: true`, so you can't start them with the Skill tool. To "re-run
    `/speckit-X` with argument A", read `.claude/skills/speckit-X/SKILL.md` and follow its
    instructions with `$ARGUMENTS` = A.
11. **Who and when:** a name recorded in a file (ticks) is the author of the reply that gave the
    answer. A date is that reply's date (YYYY-MM-DD). For an item you decide yourself, the name is
    `the factory` and the date is today.
12. **Question budget: 5 questions at most for the whole feature.** Count every numbered item in
    every earlier Ask comment of this skill in the history (follow-up questions count too); what is
    left of 5 is this run's budget. Spend it only on the gaps where a wrong guess costs the most:
    scope, data kept or shared, security and privacy, or what the user sees and does. Decide every
    other item yourself (Apply, "Decided by the factory"). When the budget is spent, never ask again:
    decide unclear or unanswered items yourself with your proposal.
13. **The human sees only their questions.** Your own decisions and the items you tick as covered
    go into the files (`spec.md` Clarifications, the ticks), never into a comment or a read-back:
    no list of them, no count of them.

## Ask

1. Read every `- [ ]` item in `<feature>/checklists/*.md` except `requirements.md` (the spec
   quality checklist that `/speckit-specify` already handled).
2. For each item, read what `spec.md`, `plan.md` and the other design files (`data-model.md`,
   `contracts/`, `research.md`, `quickstart.md`) say about it. Decide whether it is a gap or
   already looks covered.
3. Pick the gaps to ask about: at most the budget left (rule 12), the most important first. Every
   other item: decide it now (Apply, "Decided by the factory") and tick it. Items that already look
   covered: tick them (` — covered, ticked by the factory, <date>`).
4. If you ask nothing: commit (rule 8), outcome `done`, next `/speckit-tasks`, with the
   read-back `Every checklist item is settled.` and nothing else (rule 13).
5. Otherwise write one comment, numbered, one entry per question:
   - `**N. CHK0xx** (checklists/<file>.md)`
   - the gap in plain words;
   - what the spec or plan says today: one quoted line at most, with its reference (e.g. FR-005);
   - *Proposal:* one concrete solution the human can accept as is.
6. Nothing else goes in the comment (rule 13).
7. Commit your decisions (rule 8). Outcome: `waiting`.

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

```

## Apply

Rebuild the items from the latest Ask comment and the checklist files (rule 4), match every reply
to its item (rule 6), then for each item:

| Answer | What to do |
|---|---|
| Covered | Tick it. |
| Decided by the factory (not asked, rule 12) | As "Clear", with your proposal as the answer and `A: <proposal> (decided by the factory, no question asked)`. Then tick. |
| Clear | Write a `- Q: <the gap as a question> → A: <the answer>` line under `## Clarifications` / `### Session <reply date>` in `spec.md` (create the headings if they're missing, as `/speckit-clarify` does: `## Clarifications` just after the overview section), plus the change in the right section of `spec.md` (requirement, edge case, success criterion or assumption). Then tick. |
| Clear, and it changes the design (an entity, field, interface, integration or constraint) | As above, then re-run `/speckit-plan` with the answer as its argument (rule 10). Run it once per run, with all the design answers together. |
| Unclear / unsure | Rules 6 and 7; no tick, while the budget allows a follow-up. Budget spent: decide it yourself. |

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

Commit before the outcome (rule 8).
