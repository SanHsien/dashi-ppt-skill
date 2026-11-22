import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { createServer, request } from 'node:http';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  isExportRequestAllowed,
  isLoopbackAddress,
} from '../../skills/dashi-ppt/project/scripts/preview-export-auth.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPTS = path.join(REPO_ROOT, 'skills/dashi-ppt/project/scripts');
const allowedOrigins = new Set(['http://localhost:4178', 'https://localhost:4178']);

test('loopback peer addresses are recognised, everything else is not', () => {
  for (const address of ['127.0.0.1', '127.1.2.3', '::1', '::ffff:127.0.0.1', '::FFFF:127.0.0.1']) {
    assert.equal(isLoopbackAddress(address), true, address);
  }
  for (const address of [
    '192.168.1.20', '10.0.0.5', '0.0.0.0', '::', 'fe80::1', '::ffff:192.168.1.20',
    '127.0.0.1.evil', '127.0.0.256', '1127.0.0.1', 'localhost', '', undefined, null,
  ]) {
    assert.equal(isLoopbackAddress(address), false, String(address));
  }
});

test('no Origin/Referer: a LAN peer is refused even when it forges Host: localhost', () => {
  // A forged Host header is not even an input any more; the decision is the socket peer.
  assert.equal(
    isExportRequestAllowed({
      origin: undefined, referer: undefined, remoteAddress: '192.168.1.20', allowedOrigins,
    }),
    false,
  );
  assert.equal(
    isExportRequestAllowed({
      origin: undefined, referer: undefined, remoteAddress: undefined, allowedOrigins,
    }),
    false,
  );
});

test('no Origin/Referer: a loopback peer (curl on the same machine) is allowed', () => {
  for (const remoteAddress of ['127.0.0.1', '::1', '::ffff:127.0.0.1']) {
    assert.equal(
      isExportRequestAllowed({ origin: undefined, referer: undefined, remoteAddress, allowedOrigins }),
      true,
      remoteAddress,
    );
  }
});

test('the bind address no longer grants access to peers without an Origin', () => {
  // Old signature took `host` (the configured bind host). Passing it must not matter.
  assert.equal(
    isExportRequestAllowed({
      origin: undefined, referer: undefined, host: '127.0.0.1', remoteAddress: '192.168.1.20', allowedOrigins,
    }),
    false,
  );
});

test('Origin and Referer rules are unchanged', () => {
  const base = { remoteAddress: '192.168.1.20', allowedOrigins };
  assert.equal(isExportRequestAllowed({ ...base, origin: 'http://localhost:4178' }), true);
  assert.equal(isExportRequestAllowed({ ...base, origin: 'https://evil.example' }), false);
  assert.equal(
    isExportRequestAllowed({ ...base, referer: 'https://localhost:4178/deck/index.html' }),
    true,
  );
  assert.equal(isExportRequestAllowed({ ...base, referer: 'https://evil.example/x' }), false);
  // A bad Origin is not rescued by a loopback peer.
  assert.equal(
    isExportRequestAllowed({ remoteAddress: '127.0.0.1', allowedOrigins, origin: 'https://evil.example' }),
    false,
  );
});

test('a real loopback connection with a forged non-loopback Host header is still judged by its socket', async () => {
  const server = createServer((req, res) => {
    const allowed = isExportRequestAllowed({
      origin: req.headers.origin,
      referer: req.headers.referer,
      remoteAddress: req.socket.remoteAddress,
      allowedOrigins,
    });
    res.end(String(allowed));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const body = await new Promise((resolve, reject) => {
      const req = request(
        { host: '127.0.0.1', port: server.address().port, headers: { Host: '203.0.113.9' } },
        (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => resolve(data));
        },
      );
      req.on('error', reject);
      req.end();
    });
    assert.equal(body, 'true');
  } finally {
    server.close();
  }
});

test('preview servers bind to loopback unless LAN is explicitly requested', () => {
  const serve = readFileSync(path.join(SCRIPTS, 'serve-preview-https.mjs'), 'utf8');
  const start = readFileSync(path.join(SCRIPTS, 'start-preview-server.mjs'), 'utf8');
  for (const [name, source] of [['serve-preview-https', serve], ['start-preview-server', start]]) {
    assert.doesNotMatch(source, /\|\|\s*'0\.0\.0\.0'/, `${name}: default host must not be 0.0.0.0`);
    assert.match(
      source,
      /process\.env\.DASHI_PPT_PREVIEW_HOST \|\| process\.env\.HOST \|\| '127\.0\.0\.1'/,
      `${name}: default host must be 127.0.0.1`,
    );
  }
});

test('export routes decide on the socket peer, not the configured bind host', () => {
  const routes = readFileSync(path.join(SCRIPTS, 'preview/export-routes.mjs'), 'utf8');
  assert.match(routes, /remoteAddress: req\.socket\?\.remoteAddress/);
  assert.doesNotMatch(routes, /isExportRequestAllowed\(\{[^}]*\bhost: HOST/);
});
