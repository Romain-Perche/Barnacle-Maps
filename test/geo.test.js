import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSearchUrl, parseSearchResults, buildRouteUrl, parseRoute, formatDistance, formatDuration,
} from '../src/geo.js';

test('buildSearchUrl encodes the query', () => {
  const url = new URL(buildSearchUrl(' eiffel tower '));
  assert.equal(url.searchParams.get('q'), 'eiffel tower');
  assert.equal(url.searchParams.get('format'), 'jsonv2');
});

test('parseSearchResults converts coordinates to numbers', () => {
  assert.deepEqual(parseSearchResults([{ display_name: 'A', lat: '1.5', lon: '2.5' }]),
    [{ name: 'A', lat: 1.5, lon: 2.5 }]);
  assert.deepEqual(parseSearchResults(null), []);
});

test('buildRouteUrl uses lon,lat order', () => {
  const url = buildRouteUrl({ lat: 1, lon: 2 }, { lat: 3, lon: 4 });
  assert.match(url, /\/2,1;4,3\?/);
});

test('parseRoute flips geojson coordinates to lat,lon', () => {
  const r = parseRoute({
    code: 'Ok',
    routes: [{ distance: 100, duration: 60, geometry: { coordinates: [[2, 1], [4, 3]] } }],
  });
  assert.deepEqual(r, { distance: 100, duration: 60, path: [[1, 2], [3, 4]] });
  assert.equal(parseRoute({ code: 'NoRoute' }), null);
});

test('formatDistance', () => {
  assert.equal(formatDistance(420.4), '420 m');
  assert.equal(formatDistance(1520), '1.5 km');
});

test('formatDuration', () => {
  assert.equal(formatDuration(10), '1 min');
  assert.equal(formatDuration(1800), '30 min');
  assert.equal(formatDuration(4500), '1 h 15 min');
});
