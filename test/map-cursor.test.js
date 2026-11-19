import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');
const svg = readFileSync(new URL('../assets/map-cursor.svg', import.meta.url), 'utf8');
const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(m => ({ sel: m[1].replace(/\/\*.*?\*\//gs, '').trim(), body: m[2] }));
const bodyFor = (part) => rules.filter(r => r.sel.split(',').map(s => s.trim()).includes(part)).map(r => r.body).join(';');

test('cursor svg matches blueprint // covers FR-001, US1 scenario 1', () => {
  assert.match(svg, /width="24" height="24" viewBox="0 0 24 24"/);
  assert.match(svg, /r="7" fill="none" stroke="#FFFFFF" stroke-width="4"/);
  assert.match(svg, /r="7" fill="none" stroke="#2B00FF" stroke-width="2"/);
  assert.match(svg, /r="2" fill="#2B00FF" stroke="#FFFFFF" stroke-width="1"/);
});

test('map uses local cursor, hot spot 12 12, crosshair fallback // covers FR-002, FR-003, FR-004', () => {
  for (const s of ['.leaflet-container', '.leaflet-grab']) {
    const b = bodyFor(s);
    assert.ok(b.includes('cursor: url("assets/map-cursor.svg") 12 12, crosshair'), s);
    assert.ok(!/http/.test(b));
  }
});

test('grabbing while dragging // covers FR-005', () => {
  assert.match(bodyFor('.leaflet-dragging .leaflet-grab'), /cursor:\s*grabbing/);
});

test('pointer on clickable items, auto on popup body // covers FR-006', () => {
  for (const s of ['.leaflet-interactive', '.leaflet-bar a', '.leaflet-popup-content button', '.leaflet-control-attribution a', '.leaflet-popup-close-button'])
    assert.match(bodyFor(s), /cursor:\s*pointer/, s);
  for (const s of ['.leaflet-popup-content-wrapper', '.leaflet-popup-tip'])
    assert.match(bodyFor(s), /cursor:\s*auto/, s);
});

test('panel rules do not use the map cursor // covers FR-007', () => {
  for (const r of rules.filter(r => /#(panel|results|routes|search-input)/.test(r.sel)))
    assert.ok(!r.body.includes('map-cursor'), r.sel);
});

// covers FR-008, edge case 2 (touch): the cursor block must not change touch handling
test('map cursor block sets only cursor properties, no src/ change // covers FR-008, Edge case 2', async () => {
  const start = css.indexOf('/* map cursor (ui/map-cursor@1) */');
  assert.ok(start >= 0, 'map cursor block marker missing');
  const next = css.indexOf('/*', start + 2);
  const block = css.slice(start, next < 0 ? undefined : next).replace(/\/\*.*?\*\//gs, '');
  const decls = [...block.matchAll(/\{([^}]*)\}/g)].flatMap(m => m[1].split(';')).map(d => d.trim()).filter(Boolean);
  assert.ok(decls.length > 0);
  for (const d of decls) assert.match(d, /^cursor\s*:/, `non-cursor declaration in map cursor block: ${d}`);
  assert.ok(!/touch-action|pointer-events|user-select/.test(block));

  const { execFileSync } = await import('node:child_process');
  let changed;
  try {
    changed = execFileSync('git', ['diff', 'origin/main...HEAD', '--name-only'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { return; } // no git or no origin/main: skip the src/ check
  assert.deepEqual(changed.split('\n').filter(f => f.startsWith('src/')), []);
});
