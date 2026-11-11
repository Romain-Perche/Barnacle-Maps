# Quickstart: Validation

1. Apply the change (one line appended to `README.md`).
2. `git diff --numstat README.md` → expect `1  0  README.md`.
3. `git diff --stat` → only `README.md` and the two test files changed (besides `specs/`).
4. `tail -n 1 README.md` → the one-line `<!-- ... -->` comment mentioning the push manager check.
5. `npm test` → all tests pass.
6. Preview the README rendered: no visible difference.
