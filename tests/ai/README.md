# AI test scenarios (SF-73 bicycle mode)

An agent performs each `us<N>-*.md` file on the real app in headless Chromium, using
`harness.mjs`. The sandbox cannot reach the outside services, so the harness answers them with fakes.

Common setup for every scenario (from the repo root):

1. `(cd /tmp && npm pack leaflet@1.9.4 && mkdir -p leaflet && tar -xzf leaflet-1.9.4.tgz -C leaflet)`
2. `python3 -m http.server 8000 &` (or `npm start &`), then wait until `curl -s localhost:8000` answers.
3. Write a small script in the repo root (`node`, ES module) that:
   - runs `const { page, log, close } = await openApp(<options>)` from `./tests/ai/harness.mjs`
   - performs the steps with Playwright
   - prints what the checks need
   - saves a screenshot
   - calls `close()`

Shorthand used in the scenarios:
- "Select Bike": click the `🚲 Bike` segment, for example `page.click("#mode label:nth-child(3)")`.
- "Search X": fill `#search-input` with X, click `Go`, then click the first button in `#results`.
- "Routes ready": wait until `#routes` has at least one `button` and `#status` does not start with `Computing`.
- "Add stop here": click the last `.add-stop-here` button on the page (`page.locator(".add-stop-here").last()`).
  The popup that closed before can still be in the page, so do not click the first one. Wait 500 ms after the click.
