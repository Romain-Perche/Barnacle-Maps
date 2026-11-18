# Test environment

## Services
- Nominatim (search): no fake needed. The feature only adds a `viewbox` query parameter to the request URL, and tests check the URL built by `searchUrl` without any network call. Nominatim publishes no machine-readable schema; the parameter is documented in its public Search API docs. Real test account wanted: no.

## Schemas

## Smoke checks
1. npm test

## Real runs
- AI scenarios run the real app in a browser with a mocked geolocation. Nominatim is reachable only if the run VM allows it; if not, the scenarios route the search request in Playwright to a canned JSON response whose shape matches Nominatim `jsonv2`.
