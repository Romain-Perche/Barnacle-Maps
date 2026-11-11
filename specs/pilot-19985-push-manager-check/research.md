# Research: Push Manager Check

No NEEDS CLARIFICATION items remained after reading the spec.

## Decision: Comment syntax
- **Decision**: HTML comment `<!-- ... -->` on a single line.
- **Rationale**: Markdown has no native comment; HTML comments are hidden by GitHub and common renderers (FR-001, SC-002).
- **Alternatives considered**: Link-reference trick `[//]: # (text)` (also hidden, but less widely recognised); visible prose (violates SC-002).

## Decision: Placement
- **Decision**: End of README.
- **Rationale**: Cannot disturb lists or paragraphs above (edge case in spec).
- **Alternatives considered**: Top of file (can interfere with title/badges tooling).

## Decision: Idempotency
- **Decision**: Check with grep for an existing identical line before appending.
- **Rationale**: Spec edge case: no duplicate line.
