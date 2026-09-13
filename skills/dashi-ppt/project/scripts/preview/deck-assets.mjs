import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from 'node:fs';
import path from 'node:path';

function isWithin(root, target) {
  return target === root || target.startsWith(`${root}${path.sep}`);
}

function sameFile(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function requestKey(requestPath) {
  const raw = String(requestPath || 'index.html').replaceAll('\\', '/');
  if (raw.startsWith('/') || raw.includes('\0')) return null;
  const normalized = path.posix.normalize(raw);
  if (normalized === '..' || normalized.startsWith('../')) return null;
  return normalized.replace(/^\.\//, '');
}

export function createDeckAssetManifest(rootDir) {
  const root = realpathSync(path.resolve(rootDir));
  const files = new Map();
  visit(root, '');
  return { root, files };

  function visit(directory, relativeDir) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const source = path.join(directory, entry.name);
      const relative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      const linkInfo = lstatSync(source, { bigint: true });
      if (linkInfo.isSymbolicLink()) continue;
      if (linkInfo.isDirectory()) {
        visit(source, relative);
        continue;
      }
      if (!linkInfo.isFile()) continue;
      const canonical = realpathSync(source);
      if (!isWithin(root, canonical)) continue;
      const identity = statSync(canonical, { bigint: true });
      if (!identity.isFile() || !sameFile(linkInfo, identity)) continue;
      files.set(relative, { file: canonical, identity });
    }
  }
}

export function readDeckAsset(manifest, requestPath, { beforeOpen } = {}) {
  const key = requestKey(requestPath);
  if (!key) return { status: 403 };
  const entry = manifest.files.get(key) || manifest.files.get(`${key}/index.html`);
  if (!entry) return { status: 404 };

  let fd;
  try {
    beforeOpen?.(entry.file);
    const noFollow = constants.O_NOFOLLOW || 0;
    fd = openSync(entry.file, constants.O_RDONLY | noFollow);
    const opened = fstatSync(fd, { bigint: true });
    if (!opened.isFile() || !sameFile(opened, entry.identity)) return { status: 403 };

    if (process.platform === 'linux') {
      const openedPath = realpathSync(`/proc/self/fd/${fd}`);
      if (!isWithin(manifest.root, openedPath)) return { status: 403 };
    }
    return { status: 200, file: entry.file, body: readFileSync(fd) };
  } catch {
    return { status: 404 };
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}
