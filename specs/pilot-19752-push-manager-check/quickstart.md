# Quickstart: Validate Push Manager Check

Prerequisites: Node installed; repo checked out on the feature branch.

1. **Diff size** (SC-001): `git diff --numstat main -- README.md` → `1	0	README.md`.
2. **Only README changed** (FR-005): `git diff --name-only main -- . ':!specs'` → `README.md` only.
3. **Comment is hidden** (SC-002): the added line matches `<!-- ... -->`; preview the README and confirm visible content is unchanged.
4. **Tests pass** (SC-003): `npm test` → all tests pass.
