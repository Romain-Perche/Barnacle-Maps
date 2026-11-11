import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const COMMENT = '<!-- Push manager check 2 -->';
const text = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const lines = text.split('\n'); // last element is '' when file ends with LF

// covers FR-001, FR-003, US1 scenario 1
test('README ends with the one-line comment, exactly once', () => {
  assert.equal(lines.filter((l) => l === COMMENT).length, 1);
  assert.equal(lines[lines.length - 2], COMMENT);
});

// covers FR-002, US1 scenario 1
test('comment opens and closes on its own single line', () => {
  const idx = lines.indexOf(COMMENT);
  assert.ok(idx >= 0);
  assert.ok(lines[idx].startsWith('<!--') && lines[idx].endsWith('-->'));
  assert.equal(text.split('<!--').length - 1, 1);
  assert.equal(text.split('-->').length - 1, 1);
});

// covers FR-001, US1 scenario 2 (comment is outside code blocks, so it stays hidden)
test('comment is not inside a code fence', () => {
  const idx = lines.indexOf(COMMENT);
  const fences = lines.slice(0, idx).filter((l) => /^\s*(```|~~~)/.test(l)).length;
  assert.equal(fences % 2, 0);
});

// covers FR-001, edge cases: no blank separator line, LF endings only
test('no blank line before the comment, LF endings kept', () => {
  const idx = lines.indexOf(COMMENT);
  assert.ok(idx > 0);
  assert.notEqual(lines[idx - 1].trim(), '');
  assert.ok(text.endsWith(COMMENT + '\n'));
  assert.ok(!text.includes('\r'));
});
