import test from 'node:test';
import assert from 'node:assert/strict';
import {posix,win32} from 'node:path';
import {isInsideRoot} from '../lib/path-guard.mjs';

test('Windows serves assets inside the project despite backslash separators', () => {
  const root = 'C:\\Users\\Student\\Projects\\veil-ai';
  assert.equal(isInsideRoot(root, win32.resolve(root, 'index.html'), win32), true);
  assert.equal(isInsideRoot(root, win32.resolve(root, 'src\\styles.css'), win32), true);
  assert.equal(isInsideRoot(root, win32.resolve(root, 'src\\main.mjs'), win32), true);
});

test('Windows rejects sibling folders, parent traversal, other drives and root itself', () => {
  const root = 'C:\\Users\\Student\\Projects\\veil-ai';
  assert.equal(isInsideRoot(root, win32.resolve(root, '..\\veil-ai-copy\\secret.js'), win32), false);
  assert.equal(isInsideRoot(root, win32.resolve(root, '..\\private.txt'), win32), false);
  assert.equal(isInsideRoot(root, 'D:\\secrets\\key.env', win32), false);
  assert.equal(isInsideRoot(root, root, win32), false);
});

test('POSIX serves nested assets and blocks traversal', () => {
  const root = '/home/student/veil-ai';
  assert.equal(isInsideRoot(root, posix.resolve(root, 'index.html'), posix), true);
  assert.equal(isInsideRoot(root, posix.resolve(root, 'src/main.mjs'), posix), true);
  assert.equal(isInsideRoot(root, posix.resolve(root, '../elsewhere/keys.txt'), posix), false);
  assert.equal(isInsideRoot(root, root, posix), false);
});
