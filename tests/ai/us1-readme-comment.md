# US1: Verify the delivery pipeline with a trivial README change
Covers: FR-001, FR-002, FR-002a, FR-003, FR-004, US1 scenario 1, 2, 3

## Scenario 1: README diff is one hidden comment line
### Setup
Repo checked out on the feature branch with the change applied.
### Steps
1. Run `git diff --numstat main -- README.md`.
2. Run `git diff main -- README.md | grep '^+<!--'`.
3. Run `git diff --name-only main -- . ':!specs' ':!.specify' ':!.claude' ':!test' ':!tests'`.
### Expected
- [ ] Step 1 prints `1	0	README.md`.
- [ ] Step 2 prints exactly one line, an HTML comment containing "push check".
- [ ] Step 3 prints only `README.md`.

## Scenario 2: Rendered README is unchanged
### Setup
`npm start` (serves on http://localhost:8000); render README with a Markdown renderer (or GitHub's README view) for both `main` and the branch.
### Steps
1. Render `README.md` from main to HTML, save as before.html.
2. Render the branch's `README.md` to HTML, save as after.html.
3. Strip HTML comments from after.html and compare the visible text with before.html.
### Expected
- [ ] The visible text of both renders is identical.
- [ ] The text "push check" does not appear in the visible text of after.html.

## Scenario 3: Existing tests and app unaffected
### Setup
Repo root, dependencies none.
### Steps
1. Run `npm test`.
2. Start `npm start`, run `curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/`.
### Expected
- [ ] `npm test` exits 0 with 0 failing tests.
- [ ] curl prints `200`.
