import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

import {
  createDeckAssetManifest,
  readDeckAsset,
} from '../../skills/dashi-ppt/project/scripts/preview/deck-assets.mjs';

const startServerModule = pathToFileURL(path.resolve(
  'skills/dashi-ppt/project/scripts/start-preview-server.mjs',
));

function tempRoot(prefix) {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('deck asset reader serves a regular file inside the deck root', () => {
  const root = tempRoot('dashi-deck-root-');
  writeFileSync(path.join(root, 'index.html'), 'safe deck');
  const manifest = createDeckAssetManifest(root);
  assert.equal(typeof manifest.files.get('index.html').identity.ino, 'bigint');
  const result = readDeckAsset(manifest, 'index.html');
  assert.equal(result.status, 200);
  assert.equal(result.body.toString('utf8'), 'safe deck');
});

test('deck asset reader rejects lexical traversal', () => {
  const root = tempRoot('dashi-deck-root-');
  assert.equal(readDeckAsset(createDeckAssetManifest(root), '../outside.txt').status, 403);
});

test('deck asset reader rejects a symlink that escapes the deck root', t => {
  const base = tempRoot('dashi-deck-symlink-');
  const root = path.join(base, 'deck');
  const outside = path.join(base, 'outside.txt');
  mkdirSync(root);
  writeFileSync(outside, 'private sentinel');
  try {
    symlinkSync(outside, path.join(root, 'leak.txt'), 'file');
  } catch (error) {
    if (error?.code === 'EPERM') {
      return t.skip('symlink creation is unavailable');
    } else {
      throw error;
    }
  }
  assert.equal(readDeckAsset(createDeckAssetManifest(root), 'leak.txt').status, 404);
});

test('deck asset reader rejects an ancestor swapped after validation', t => {
  if (process.platform !== 'linux') return t.skip('fd-backed path verification uses /proc on Linux');
  const base = tempRoot('dashi-deck-race-');
  const root = path.join(base, 'deck');
  const inside = path.join(root, 'assets');
  const captured = path.join(root, 'assets.safe');
  const outside = path.join(base, 'outside');
  mkdirSync(inside, { recursive: true });
  mkdirSync(outside);
  writeFileSync(path.join(inside, 'sentinel.txt'), 'safe');
  writeFileSync(path.join(outside, 'sentinel.txt'), 'private sentinel');
  const manifest = createDeckAssetManifest(root);

  const result = readDeckAsset(manifest, 'assets/sentinel.txt', {
    beforeOpen() {
      renameSync(inside, captured);
      symlinkSync(outside, inside, 'dir');
    },
  });

  assert.equal(result.status, 403);
});

test('deck asset reader rejects file identity replacement after validation', () => {
  const root = tempRoot('dashi-deck-identity-');
  const asset = path.join(root, 'sentinel.txt');
  const captured = path.join(root, 'sentinel.safe.txt');
  writeFileSync(asset, 'safe');
  const manifest = createDeckAssetManifest(root);

  const result = readDeckAsset(manifest, 'sentinel.txt', {
    beforeOpen() {
      renameSync(asset, captured);
      writeFileSync(asset, 'replacement');
    },
  });

  assert.equal(result.status, 403);
});

test('preview log open refuses a symlink on platforms with O_NOFOLLOW', async t => {
  if (process.platform === 'win32') return t.skip('O_NOFOLLOW is a POSIX control');
  const base = tempRoot('dashi-preview-log-');
  const runtime = path.join(base, 'runtime');
  const previous = process.env.DASHI_PPT_PREVIEW_LOCK_DIR;
  try {
    process.env.DASHI_PPT_PREVIEW_LOCK_DIR = runtime;
    const { ensurePrivateDirectory, openPrivateAppendFile } = await import(`${startServerModule.href}?log=${Date.now()}`);
    ensurePrivateDirectory(runtime);
    const target = path.join(base, 'sentinel.txt');
    const log = path.join(runtime, 'preview.log');
    writeFileSync(target, 'unchanged');
    symlinkSync(target, log, 'file');
    assert.throws(() => openPrivateAppendFile(log));
    assert.equal(readFileSync(target, 'utf8'), 'unchanged');
  } finally {
    if (previous === undefined) delete process.env.DASHI_PPT_PREVIEW_LOCK_DIR;
    else process.env.DASHI_PPT_PREVIEW_LOCK_DIR = previous;
  }
});

test('port reservation commit writes through the original exclusive fd', async t => {
  if (process.platform === 'win32') return t.skip('symlink replacement simulation is POSIX-only');
  const base = tempRoot('dashi-preview-lock-');
  const runtime = path.join(base, 'runtime');
  const previous = process.env.DASHI_PPT_PREVIEW_LOCK_DIR;
  try {
    process.env.DASHI_PPT_PREVIEW_LOCK_DIR = runtime;
    const { reservePortLock } = await import(`${startServerModule.href}?lock=${Date.now()}`);
    const port = 49123;
    const reservation = await reservePortLock(port, '127.0.0.1');
    assert.ok(reservation);
    const lock = path.join(runtime, `preview-${port}.lock`);
    const captured = `${lock}.captured`;
    const target = path.join(base, 'sentinel.txt');
    writeFileSync(target, 'unchanged');
    renameSync(lock, captured);
    symlinkSync(target, lock, 'file');
    reservation.commit(4242, { logFile: 'preview.log' });
    assert.equal(readFileSync(target, 'utf8'), 'unchanged');
    assert.equal(JSON.parse(readFileSync(captured, 'utf8')).pid, 4242);
  } finally {
    if (previous === undefined) delete process.env.DASHI_PPT_PREVIEW_LOCK_DIR;
    else process.env.DASHI_PPT_PREVIEW_LOCK_DIR = previous;
  }
});

test('legacy preview lock stops the exact prior-version daemon', { timeout: 20_000 }, async () => {
  const previous = process.env.DASHI_PPT_PREVIEW_LOCK_DIR;
  delete process.env.DASHI_PPT_PREVIEW_LOCK_DIR;
  const root = tempRoot('dashi-preview-migration-');
  const legacy = path.join(root, 'legacy-locks');
  mkdirSync(legacy, { recursive: true });
  const port = 49_123;
  const lock = path.join(legacy, `preview-${port}.lock`);

  const child = spawn(process.execPath, [
    '-e',
    'setInterval(() => {}, 1000)',
    'serve-preview-https.mjs',
  ], { stdio: 'ignore' });
  try {
    const module = await import(`${startServerModule.href}?migration=${Date.now()}`);
    await delay(500);
    assert.equal(module.isPidAlive(child.pid), true);
    writeFileSync(path.join(root, '.preview-server.json'), `${JSON.stringify({ pid: child.pid, port })}\n`);
    writeFileSync(lock, `${JSON.stringify({ pid: child.pid, port, serveRoot: root })}\n`);

    await module.stopExistingPreviewForServeRoot(root, { legacyLockDirectory: legacy });

    assert.equal(module.isPidAlive(child.pid), false);
    assert.equal(existsSync(lock), false);
  } finally {
    try { process.kill(child.pid, 'SIGKILL'); } catch {}
    rmSync(lock, { force: true });
    if (previous === undefined) delete process.env.DASHI_PPT_PREVIEW_LOCK_DIR;
    else process.env.DASHI_PPT_PREVIEW_LOCK_DIR = previous;
  }
});
