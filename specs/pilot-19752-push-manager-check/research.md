# Research: Push Manager Check

No NEEDS CLARIFICATION items remained.

## Comment syntax
- **Decision**: Use an HTML comment, e.g. `<!-- push manager check: verifies the delivery pipeline -->`.
- **Rationale**: Hidden in rendered Markdown on GitHub and elsewhere (FR-002); standard and portable.
- **Alternatives considered**: Link-reference-style comment (`[//]: # (...)`) — also hidden but less readable; visible sentence — rejected, changes rendered docs.

## Placement
- **Decision**: Append on its own line at the end of `README.md`, after a trailing newline-terminated last line.
- **Rationale**: Cannot affect lists, code spans, or links; yields a clean +1/−0 diff (FR-001, FR-004). The file already ends with a newline.
- **Alternatives considered**: Top of file — could interfere with headings/front matter conventions; mid-file — risks altering rendering.

## Wording
- **Decision**: Short purpose note mentioning the push manager / pipeline check (FR-003).
