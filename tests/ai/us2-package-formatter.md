# US2: Maintainers rely on a well-known formatter
Covers: FR-005, FR-006, FR-010, SC-003, SC-005, US2 scenarios 1, 2, 3

## Scenario 1: one new dependency, pinned identically in both places (US2 scenario 1, FR-005, SC-003)
### Setup
A checkout of the feature branch. No server needed.
### Steps
1. Run `node -e "console.log(JSON.stringify(require('./package.json').dependencies))"`.
2. Run `git diff main -- package.json` and look at the `dependencies` and `scripts` blocks.
3. Run `grep -o 'https://unpkg.com/convert@[^"]*' index.html`.
4. Run `curl -s https://unpkg.com/convert@8.0.2/package.json | python3 -c "import json,sys; p=json.load(sys.stdin); print(p.get('license'), p.get('dependencies'))"`.
### Expected
- [ ] Step 1 prints exactly `{"convert":"8.0.2"}`.
- [ ] Step 2 shows no change to `"scripts"` (`start` is still `python3 -m http.server 8000`, `test` is still `node --test test/`, no `build` script).
- [ ] Step 3 prints exactly `https://unpkg.com/convert@8.0.2/dist/index.js`.
- [ ] Step 4 prints a licence in {MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0} and `None` or `{}` for dependencies.

## Scenario 2: the browser runs the package with no install or build step (US2 scenario 2, FR-006)
### Setup
Copy the repo to a fresh temp folder WITHOUT `node_modules/` (`git clone` of the branch, or `git archive HEAD | tar -x -C /tmp/fresh`). In that folder run `npm start` (do not run `npm install` or any build). Headless Playwright with the same geolocation, Nominatim mock and car-routing mock as in `tests/ai/us1-route-distances.md` (common setup), with OSRM = one route `{ distance: 1500, duration: 300 }`. Record all network responses with `page.on("response")`.
### Steps
1. Open http://localhost:8000.
2. Run `await page.evaluate(() => import("/src/geo.js").then(m => m.distanceFormatReady))`.
3. Select Car, search `test`, click "Test Place", wait for one `#routes li`.
4. Read the route entry.
### Expected
- [ ] A response for `https://unpkg.com/convert@8.0.2/dist/index.js` was recorded with status 200.
- [ ] No request was made to `/node_modules/`.
- [ ] The route entry reads exactly `Route 1 · 1.5 km · 5 min` (km output only comes from the package; the fallback would show `1500 m`).

## Scenario 3: automated tests use the package (US2 scenario 3, SC-004, SC-005)
### Setup
A checkout of the feature branch.
### Steps
1. Run `npm install`.
2. Run `npm test`.
3. Run `grep -n "1000\|1e3" src/geo.js` and look at the lines inside `function formatDistance`.
### Expected
- [ ] `npm test` exits with code 0 and reports 0 failed tests.
- [ ] `ls node_modules` lists `convert` and no other top-level package (except the `.package-lock.json` file).
- [ ] None of the lines from step 3 are inside `formatDistance`.

## Scenario 4: documentation (FR-010)
### Setup
A checkout of the feature branch.
### Steps
1. Open `README.md`.
### Expected
- [ ] It no longer contains the sentence "No build step or dependencies".
- [ ] It names the `convert` package as the distance formatter.
- [ ] It says to run `npm install` once before `npm test`.
- [ ] It still says `npm start` runs the app with no build step.
