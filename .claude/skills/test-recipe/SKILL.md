---
name: "test-recipe"
description: "How Build and AI review read and write the repo's test recipe (.factory/test-env.md): how the tests run, not which tests. Outside services faked and checked against their schemas from GitHub, Docker images, how to run the app, smoke checks. Read by Build, AI review and the fix round."
argument-hint: ""
user-invocable: true
disable-model-invocation: true
---

# The test recipe

`.factory/test-env.md` is the repo's test recipe. It says **how the tests run**, never which tests to run:
the spec's acceptance scenarios and edge cases say what is checked, and Build's tests check them.

Build and the AI review both read it and change it, each for what its work needs:

- Build writes the deterministic tests (pass/fail tests on the code) and the fakes they use.
- The AI review runs the app and performs the spec's scenarios, with the recipe as its setup.

Plan does not write the recipe. Plan lists the outside services in `plan.md` (`## Outside services`), with
the GitHub URL of each one's schema, or a warning when it found none. Never ask a person how to test.

## The rules

1. **A fake only for an outside service or device.** An *outside service* is anything the code reaches over
   the network that is not part of this repo (an API, a hosted product, a database someone else runs). A
   *device* is hardware the VM does not have. Never fake the repo's own code, and never write a fake that
   answers anything: it would only prove that the code runs.
2. **Everything the VM can run is tested for real.** Docker in the VM (`## Docker images`), headless
   Playwright, more VMs through `sbx` (at most 2 at a time, deleted when the step ends), a copy of a service
   that runs in Docker. Prefer the real program over a fake whenever the VM can run it.
3. **Schemas come from GitHub.** Check each fake against the service's public schema (GraphQL SDL,
   OpenAPI, ...), so that a request with a wrong field fails a test. The plan's `## Outside services` gives
   the schema's GitHub URL. Get it with git, outside the repo, then copy the file:
   `git clone --depth 1 https://github.com/<owner>/<repo> /tmp/<repo> && mkdir -p .factory/schemas && cp
   /tmp/<repo>/<path> .factory/schemas/<file name>`. Git never sees `.factory/schemas/`. The VM reaches
   github.com only: no other site, and no web page.
4. **No schema on GitHub.** The plan's line says `no public schema found on GitHub`. The fake then follows
   the service's documentation (search the web for it). Say so on the service's line in the recipe. The
   factory already warns about it in the pull request.
5. **When the feature depends on how the service behaves** (its rules, limits, errors, side effects), the
   fake behaves that way too, as the service's schema and documentation say. Write on the recipe line which
   behaviours the fake copies.
6. **A new Docker image.** The VM cannot reach Docker Hub. Add the official image, with a version tag, to
   `## Docker images` (`- postgres:16-alpine`; never `latest`, never an image outside Docker Hub's official
   ones), then end the step with `"restart": true`. The factory runs the step again in a VM that has the
   image loaded. Once only: a second restart in a row is an error.
7. **Never write a fake of a program's output from what you think it prints.** The real output comes first:
   the real program run in the VM (or through `sbx`), or the service's schema.

## The format

```markdown
# Test environment

## Services
- Linear: fake (tests/fakes/linear.py), checked against the schema `linear.graphql`; copies its error for an
  unknown issue.
- Acme Pay: fake (tests/fakes/acme_pay.py), follows its docs (no public schema on GitHub).

## Schemas
- linear.graphql: https://github.com/linear/linear/blob/<tag or commit>/packages/sdk/src/schema.graphql

## Docker images
- postgres:16-alpine

## How to run the app
- `npm start` with `LINEAR_URL=http://localhost:4010` (the fake Linear: `python3 tests/fakes/linear.py`).
- The map tiles come from a site the VM cannot reach: set `TILE_URL=http://localhost:8081` (a local tile server).

## Smoke checks
1. test -s .factory/schemas/linear.graphql
2. curl -fs http://localhost:4010/health
3. curl -fs http://localhost:3000/ | grep -q '<title>'
```

- **Services:** how the tests reach each outside service: a fake file, a schema, a copy in Docker. Never "no
  test needed".
- **Schemas:** where each schema comes from on GitHub.
- **Docker images:** the images the tests and the app need.
- **How to run the app:** how to start the app in the VM, and how to work around sites the VM blocks.
- **Smoke checks:** only checks that the setup works: the schema is there, the fake starts, the app starts.
  Never the feature's tests (no `npm test`). A smoke check must never pass on a skip: start a schema check
  with `test -s .factory/schemas/<file name>`. The AI review runs them first.

The factory cannot use real test accounts yet: always use the fake for an outside service.
