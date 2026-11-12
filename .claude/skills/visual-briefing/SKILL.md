---
name: visual-briefing
description: Present technical findings, codebase summaries, plans, incident reports, architecture explanations, trade-offs, and execution results for rapid operator understanding. Use when the operator asks to explain, summarise, review, compare, diagnose, map, or present a technical system or workflow. Select concise ASD STE100 text, Mermaid terminal diagrams, tables, SVG, or self-contained interactive HTML based on the operator question and terminal constraints.
disable-model-invocation: true
---
# Visual briefing

In the factory, the operator reads your text as Markdown in a Linear comment or a GitHub pull request,
not in a terminal. Use ASD STE100 text, tables and direct `mermaid` fences only. Do not make SVG or HTML
files. When the skill that called this one sets a format (numbered items, IDs, read-back lines, a json
outcome), keep that format and write its text as this skill says.

Transfer the useful insight with the least operator effort.
Use ASD STE100 in all prose:
- Use short, direct sentences.
- State one action per procedural sentence.
- Use one stable name for each object.
- Prefer concrete verbs.
- Remove filler and repeated conclusions.
## Start with the operator question
Identify the one question the operator needs answered.
Examples:
- What exists?
- What changed?
- What connects to what?
- What failed?
- What should I do now?
- Which option is safer?
- How does a system react when an input changes?
Do not create a visual artifact until it answers that question faster than concise text.
## Use progressive disclosure
Use this order unless the operator requests another format:
1. State the result in one to five direct lines.
2. State current status, evidence, risks, and unknowns separately.
3. Add one compact visual artifact when it reduces reading effort.
4. Add source files, commands, or evidence links for verification.
5. State the next operator action when one exists.
Do not make the operator open an artifact to learn the main conclusion.
## Select the smallest useful artifact
| Need | Default artifact |
|---|---|
| One conclusion or one action | ASD STE100 text |
| Comparison of a few items | Table |
| Process, dependency path, or architecture overview | Mermaid flowchart |
| Interaction over time | Mermaid sequence diagram |
| Incident response | Mermaid decision tree |
| Large static map, dense layout, or annotation | SVG with a text summary |
| Search, filtering, zoom, expandable evidence, or file links | Self-contained local HTML |
| Parameter exploration or simulation | Interactive local HTML micro-app |
Do not add a diagram that only repeats nearby text.
Use one diagram per operator question. Split unrelated questions into separate artifacts.
## Mermaid rules
Use Mermaid as the portable visual default.
- Keep node labels short.
- Keep the diagram narrow enough for the terminal.
- Use stable labels.
- Prefer flowcharts for structure.
- Prefer sequence diagrams for time order.
- Prefer decision trees for incident actions.
- Include only decision-relevant nodes.
- Follow Mermaid with a short text interpretation when ambiguity is possible.
Emit a direct top-level `mermaid` fence when the operator should see a rendered diagram.
Use an outer four-backtick fence only when the operator must see Mermaid source. Explain that the nested form is source text and will not render as a diagram when submitted unchanged.
## Evidence and uncertainty
Never mix evidence, conclusions, and hypotheses.
Label them clearly:
- **Observed:** directly read, measured, or tested.
- **Configured:** declared in a source file or settings file.
- **Inference:** a reasoned conclusion from evidence.
- **Unknown:** a question that needs evidence.
- **Risk:** a condition that could cause harm or failure.
Do not claim a test passed unless this turn includes its command output.
## SVG and HTML escalation
Escalate past Mermaid only when terminal diagrams are too dense or the operator needs interaction.
For SVG:
- Use SVG for detailed static diagrams.
- Keep a text or Mermaid summary beside it.
- Provide a browser-openable path.
- Generate a PNG preview only when inline terminal images are supported.
For interactive HTML:
- Create one self-contained local artifact for one operator question.
- Put the conclusion at the top.
- Make detail expandable.
- Link nodes to source files, commands, logs, or raw data.
- Include source inputs, generation time, assumptions, and deletion guidance.
- Do not load remote scripts, fonts, analytics, or assets.
- Do not include secrets, credentials, or full environment values.
Do not start a local server unless browser restrictions require one. Prefer a self-contained `file://` artifact first.
## Terminal compatibility
Treat Unicode text and Mermaid terminal diagrams as the universal baseline.
Inline graphics are optional. Do not make understanding depend on inline images.
When terminal image support is unknown or unavailable:
1. Show the text or Mermaid fallback.
2. Provide the SVG or HTML artifact path.
3. Explain how to open it in a browser.
Do not force a terminal image protocol. Use detected capability or an operator-confirmed setting.
## Completion format
For a substantial explanation, use these sections when relevant:
```text
RESULT
STATUS
VISUAL
EVIDENCE
RISKS AND UNKNOWNS
NEXT ACTION
SOURCES
```
