# Quickstart: Validating Push Manager Check

Prerequisites: Node installed; repo checked out on the feature branch.

1. Diff size: `git diff --numstat main -- README.md` → expect `1	0	README.md` (SC-001).
2. Comment form: `git diff main -- README.md | grep '^+<!--'` → one added HTML comment mentioning a push/pipeline check (FR-001, FR-002).
3. Only README changed: `git diff --name-only main -- . ':!specs' ':!.specify'` → only `README.md` (FR-004).
4. Rendered output unchanged: view README on GitHub or a Markdown renderer; the comment is not visible (SC-002).
5. Tests: `npm test` → all pass (SC-003).
