import assert from 'node:assert/strict';
import { once } from 'node:events';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  extractDataUrlMedia,
  mergeStateIntoIndexHtml,
} from '../../skills/dashi-ppt/project/scripts/persist-deck-state.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROJECT_ROOT = path.join(REPO_ROOT, 'skills/dashi-ppt/project');
const TEMPLATE_PATH = path.join(
  PROJECT_ROOT,
  'assets/template-swiss.html',
);
const projectRequire = createRequire(pathToFileURL(path.join(PROJECT_ROOT, 'package.json')));

test('Swiss rich-text state sanitizes sync and ordinary key writes', () => {
  const template = readFileSync(TEMPLATE_PATH, 'utf8');

  assert.match(template, /B:1, STRONG:1, I:1, EM:1, BR:1, SPAN:1, SMALL:1/);
  assert.match(template, /SCRIPT:1, STYLE:1, SVG:1/);
  assert.match(template, /if\(synced !== undefined\) el\.innerHTML = sanitizeTextStateValue\(synced\)/);
  assert.match(
    template,
    /el\.innerHTML = sanitizeTextStateValue\(textState\[el\.dataset\.editableId\]\)/,
  );
  assert.match(template, /if\(value !== undefined\) element\.innerHTML = window\.__sanitizeRichText\(value\)/);
  assert.match(template, /el\.innerHTML = safeValue/);
});

test('browser removes active content, preserves safe layout, and reconciles prototype keys', {
  timeout: 15_000,
}, async t => {
  let chromium;
  try {
    ({ chromium } = projectRequire('playwright-core'));
  } catch (error) {
    if (error?.code === 'MODULE_NOT_FOUND') {
      return t.skip('run npm ci in skills/dashi-ppt/project for browser security coverage');
    }
    throw error;
  }

  const { getExportBrowserPath } = await import(pathToFileURL(
    path.join(PROJECT_ROOT, 'scripts/chrome-path.mjs'),
  ).href);
  const template = readFileSync(TEMPLATE_PATH, 'utf8');
  const rawData = 'data:image/png;base64,AA==';
  const storedPath = 'assets/user-media/security-test.png';
  const server = createServer((request, response) => {
    if (request.method === 'POST' && request.url === '/api/save-deck-state') {
      request.resume();
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ mediaMap: { [rawData]: storedPath } }));
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(template);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: getExportBrowserPath() });
    const page = await browser.newPage();
    const address = server.address();
    await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: 'load' });

    const sanitized = await page.evaluate(() => {
      const dirty = '<img src=x onerror=alert(1)>'
        + '<b class=x onclick=alert(1)>ok</b>'
        + '<svg onload=alert(1)><circle></circle></svg>'
        + '<span data-secret=x style="font-size:27px;color:red;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background-image:url(https://attacker.invalid/x)">safe</span>'
        + '<strong aria-hidden="true" data-editable-skip="true" style="text-align:right">42%</strong>'
        + '<iframe srcdoc="<script>alert(1)</script>"></iframe>';
      const html = window.__sanitizeRichText(dirty);
      const holder = document.createElement('template');
      holder.innerHTML = html;
      return {
        html,
        unsafeNodes: holder.content.querySelectorAll('img,script,svg,iframe,object,embed').length,
        unsafeAttrs: holder.content.querySelectorAll('[onerror],[onclick],[onload],[srcdoc],[data-secret]').length,
      };
    });
    assert.equal(sanitized.unsafeNodes, 0);
    assert.equal(sanitized.unsafeAttrs, 0);
    assert.match(sanitized.html, /<b class="x">ok<\/b>/);
    assert.match(sanitized.html, /font-size:\s*27px/);
    assert.match(sanitized.html, /color:\s*red/);
    assert.match(sanitized.html, /overflow:\s*hidden/);
    assert.match(sanitized.html, /text-overflow:\s*ellipsis/);
    assert.match(sanitized.html, /(?:white-space:\s*nowrap|text-wrap-mode:\s*nowrap)/);
    assert.match(sanitized.html, /text-align:\s*right/);
    assert.match(sanitized.html, /aria-hidden="true"/);
    assert.match(sanitized.html, /data-editable-skip="true"/);
    assert.doesNotMatch(sanitized.html, /url\s*\(/i);

    await page.evaluate(dataUrl => {
      const state = JSON.parse(`{
        "nested": {
          "__proto__": "${dataUrl}",
          "constructor": "${dataUrl}"
        }
      }`);
      window.__deckViewModel.setMediaState(state);
    }, rawData);
    await page.waitForFunction(expected => {
      const nested = window.__deckViewModel.peek('media')?.nested;
      return nested && nested.constructor === expected;
    }, storedPath);
    const reconciled = await page.evaluate(() => {
      const nested = window.__deckViewModel.peek('media').nested;
      return {
        nullPrototype: Object.getPrototypeOf(nested) === null,
        ownsProto: Object.prototype.hasOwnProperty.call(nested, '__proto__'),
        protoValue: nested.__proto__,
        constructorValue: nested.constructor,
      };
    });
    assert.deepEqual(reconciled, {
      nullPrototype: true,
      ownsProto: true,
      protoValue: storedPath,
      constructorValue: storedPath,
    });
  } finally {
    await browser?.close();
    server.close();
    await once(server, 'close');
  }
});

test('recursive media replacement keeps nested __proto__ and constructor keys as data', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'dashi-state-security-'));
  const raw = 'data:image/png;base64,AA==';
  const input = JSON.parse(`{
    "text": {"normal": "${raw}", "sync": "${raw}"},
    "props": {
      "slide": {
        "nested": {
          "__proto__": {"asset": "${raw}"},
          "constructor": {"asset": "${raw}"}
        }
      }
    }
  }`);

  const result = extractDataUrlMedia(input, root);
  const relative = result.mediaMap[raw];

  assert.equal(typeof relative, 'string');
  assert.equal(Object.getPrototypeOf(result.mediaMap), null);
  assert.equal(Object.getPrototypeOf(result.state.props), null);
  assert.equal(Object.getPrototypeOf(result.state.props.slide), null);
  assert.equal(Object.getPrototypeOf(result.state.props.slide.nested), null);
  assert.equal(Object.getPrototypeOf(result.state.props.slide.nested.__proto__), null);
  assert.equal(Object.getPrototypeOf(result.state.props.slide.nested.constructor), null);
  assert.equal(result.state.props.slide.nested.__proto__.asset, relative);
  assert.equal(result.state.props.slide.nested.constructor.asset, relative);
  assert.equal(result.state.text.normal, relative);
  assert.equal(result.state.text.sync, relative);
  assert.equal(Object.prototype.asset, undefined);
  assert.equal(existsSync(path.join(root, relative)), true);
});

test('null-prototype state remains JSON-serializable and merge-compatible', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'dashi-state-json-'));
  const raw = 'data:image/png;base64,AA==';
  const { state, mediaMap } = extractDataUrlMedia(
    { props: { slide: { normal: raw } } },
    root,
  );
  const serialized = JSON.stringify(state);
  const roundTrip = JSON.parse(serialized);

  assert.equal(roundTrip.props.slide.normal, mediaMap[raw]);

  const html = '<script id="deck-view-model" type="application/json">'
    + '{"title":"compat","slides":[{"id":"slide-1"}],"state":{}}'
    + '</script><main>unchanged</main>';
  const merged = mergeStateIntoIndexHtml(html, state);
  const block = /<script id="deck-view-model" type="application\/json">([\s\S]*?)<\/script>/.exec(merged);
  assert.ok(block);
  const parsed = JSON.parse(block[1]);
  assert.equal(parsed.title, 'compat');
  assert.deepEqual(parsed.state, roundTrip);
  assert.match(merged, /<main>unchanged<\/main>/);
});
