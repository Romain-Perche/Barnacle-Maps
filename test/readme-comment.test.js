// Tests for specs/pilot-19985-push-manager-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const base = git('show', 'main:README.md');
const now = readFileSync('README.md', 'utf8');
const COMMENT = /^<!--.*push check.*-->$/;

// covers FR-001, SC-001, US1 scenario 1
test('README gains exactly one line and removes none', () => {
  const [a, d] = git('diff', '--numstat', 'main', '--', 'README.md').split('\t');
  assert.equal(`${a} ${d}`, '1 0');
});

// covers FR-001, FR-002, FR-002a, US1 scenario 1
test('the added line is a single-line HTML comment containing "push check"', () => {
  const lines = git('diff', '-U0', 'main', '--', 'README.md').split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'));
  assert.equal(lines.length, 1);
  assert.match(lines[0].slice(1), COMMENT);
});

// covers FR-003, edge case: placed at the end, no other line changed
test('comment is the last line, file ends with a newline, other lines intact', () => {
  assert.ok(now.endsWith('\n'));
  const lines = now.trimEnd().split('\n');
  assert.match(lines.at(-1), COMMENT);
  assert.equal(lines.slice(0, -1).join('\n').trimEnd(), base.trimEnd());
});

// covers idempotency edge case
test('the comment appears only once', () => {
  assert.equal(now.split('\n').filter((l) => COMMENT.test(l)).length, 1);
});

// covers FR-004
test('no product file other than README.md changed', () => {
  const files = git('diff', '--name-only', 'main', '--', '.', ':!specs', ':!.specify', ':!test', ':!tests', ':!.claude')
    .split('\n').filter(Boolean);
  assert.deepEqual(files, ['README.md']);
});
