import path from 'node:path';

/**
 * Return true only when target is a file beneath root, never root itself.
 * A path.relative() comparison avoids hard-coded '/' separators and is safe
 * on Windows, macOS and Linux. `pathApi` permits regression-testing win32.
 */
export function isInsideRoot(root, target, pathApi = path) {
  const rel = pathApi.relative(root, target);
  return rel !== '' && rel !== '..' &&
    !rel.startsWith(`..${pathApi.sep}`) &&
    !pathApi.isAbsolute(rel);
}
