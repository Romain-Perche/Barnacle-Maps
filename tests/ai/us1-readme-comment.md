# US1: Maintainer adds a one-line comment to the README
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, US1 scenario 1, 2, 3

## Scenario 1: Diff is exactly one added line
### Setup
Implementation committed on the feature branch; `main` available as base.
### Steps
1. Run `git diff --numstat main -- README.md`.
2. Run `git diff --stat main` and list the changed files.
3. Run `tail -n 1 README.md`.
### Expected
- [ ] Step 1 prints `1	0	README.md`
- [ ] Step 2 lists only `README.md` and files under `specs/`
- [ ] Step 3 prints exactly `<!-- Push manager check 2 -->`

## Scenario 2: Rendered README is unchanged
### Setup
Render both versions: `git show main:README.md` and the current `README.md` to HTML with `gh api -X POST markdown -f text=@... ` or `python3 -m markdown` (install if absent).
### Steps
1. Render the old README to HTML.
2. Render the new README to HTML.
3. Strip HTML comments from both outputs and diff them.
### Expected
- [ ] The visible text of both renderings is identical (empty diff)

## Scenario 3: Existing tests still pass
### Setup
None.
### Steps
1. Run `npm test` from the repo root.
### Expected
- [ ] The command exits with code 0 and reports 0 failures
