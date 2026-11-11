# US1: Verify the delivery pipeline with a trivial README change
Covers: FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, SC-001, SC-003, US1 scenario 1, 2, 3

## Scenario 1: README diff is one added comment line
### Setup
Repo checked out on the feature branch; `main` branch available locally.
### Steps
1. Run `git diff --numstat main -- README.md`.
2. Run `git diff --name-only main -- . ':!specs' ':!test' ':!tests'`.
3. Run `tail -n 1 README.md`.
### Expected
- [ ] Step 1 prints `1	0	README.md`.
- [ ] Step 2 prints only `README.md`.
- [ ] Step 3 prints a line starting with `<!--` and ending with `-->`, containing "push manager check", under 100 characters.

## Scenario 2: Comment is hidden when rendered
### Setup
Render with GitHub's API-free local renderer: `npx --yes marked` (or `python3 -m markdown`) on README.md from main and from the branch.
### Steps
1. Render `git show main:README.md` to HTML (file A).
2. Render the branch `README.md` to HTML (file B).
3. Strip HTML comments from B and compare with A using `diff`.
### Expected
- [ ] The text content of B, with HTML comments removed, is identical to A.
- [ ] No visible text "push manager check" appears outside an HTML comment in B.

## Scenario 3: Existing tests still pass
### Setup
Node installed.
### Steps
1. Run `npm test` from the repo root.
### Expected
- [ ] The command exits with code 0 and reports 0 failed tests.
