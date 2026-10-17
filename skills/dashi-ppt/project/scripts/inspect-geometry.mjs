#!/usr/bin/env node
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { getExportBrowserPath } from './chrome-path.mjs';

/**
 * Dashi PPT 幾何 Hit-Test 量測核心
 * 以 DOM Bounding Box 與 AABB 幾何計算取代昂貴的多模態 Vision 看圖，
 * 將跑版檢測輸出壓至 < 100 Tokens，供 AI Agent 進行精準自癒修正。
 */

export const GEOMETRY_INSPECTOR_SNIPPET = `
(function() {
  window.__inspectSlideGeometry = function(slideEl, options = {}) {
    const maxDefects = options.maxDefects || 8;
    const canvasWidth = options.canvasWidth || 1920;
    const canvasHeight = options.canvasHeight || 1080;
    const issues = [];

    if (!slideEl) return { pass: true, issues: [] };

    const slideRect = slideEl.getBoundingClientRect();
    const scale = slideRect.width > 0 ? (slideRect.width / canvasWidth) : 1;

    function describe(el) {
      if (!el) return 'element';
      const id = el.id ? '#' + el.id : '';
      const cls = el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.')
        : '';
      const tag = el.tagName.toLowerCase();
      return tag + id + cls;
    }

    // 1. 文字與容器滾動溢出檢查 (Text Scroll Overflow)
    const textCandidates = slideEl.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, .card, [class*="desc"], [class*="title"], [class*="text"], [class*="content"]');
    for (const el of textCandidates) {
      if (issues.length >= maxDefects) break;
      if (el.clientWidth <= 0 || el.clientHeight <= 0) continue;
      const vOverflow = Math.round((el.scrollHeight - el.clientHeight) / (scale || 1));
      const hOverflow = Math.round((el.scrollWidth - el.clientWidth) / (scale || 1));
      const style = window.getComputedStyle(el);

      // 垂直溢出超過 4px 且不屬於刻意捲動區域
      if (vOverflow > 4 && style.overflowY !== 'visible') {
        issues.push({
          type: 'text-overflow',
          element: describe(el),
          overflowPx: vOverflow,
          axis: 'vertical',
          message: describe(el) + ' vertical overflow ' + vOverflow + 'px (scrollHeight ' + el.scrollHeight + ' > clientHeight ' + el.clientHeight + ')'
        });
      } else if (hOverflow > 8 && style.overflowX !== 'visible') {
        issues.push({
          type: 'text-overflow',
          element: describe(el),
          overflowPx: hOverflow,
          axis: 'horizontal',
          message: describe(el) + ' horizontal overflow ' + hOverflow + 'px'
        });
      }
    }

    // 2. 邊界溢出檢查 (Canvas / Boundary Overflow)
    const visualElements = slideEl.querySelectorAll('[class*="card"], [class*="badge"], [class*="btn"], button, [class*="tag"], [class*="item"], img, svg, [class*="metric"]');
    for (const el of visualElements) {
      if (issues.length >= maxDefects) break;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      const relRight = Math.round((rect.right - slideRect.left) / scale);
      const relBottom = Math.round((rect.bottom - slideRect.top) / scale);
      const relLeft = Math.round((rect.left - slideRect.left) / scale);
      const relTop = Math.round((rect.top - slideRect.top) / scale);

      if (relRight > canvasWidth + 4) {
        const diff = relRight - canvasWidth;
        issues.push({
          type: 'canvas-overflow',
          element: describe(el),
          side: 'right',
          overflowPx: diff,
          message: describe(el) + ' overflows slide right edge by ' + diff + 'px'
        });
      }
      if (relBottom > canvasHeight + 4) {
        const diff = relBottom - canvasHeight;
        issues.push({
          type: 'canvas-overflow',
          element: describe(el),
          side: 'bottom',
          overflowPx: diff,
          message: describe(el) + ' overflows slide bottom edge by ' + diff + 'px'
        });
      }

      // 檢查是否超出其父級卡片 (Parent Container Overflow)
      const parentCard = el.closest('.card, [class*="card-"], [class*="container-"]');
      if (parentCard && parentCard !== el) {
        const pRect = parentCard.getBoundingClientRect();
        const pRelRight = Math.round((rect.right - pRect.right) / scale);
        const pRelBottom = Math.round((rect.bottom - pRect.bottom) / scale);
        if (pRelRight > 8) {
          issues.push({
            type: 'parent-overflow',
            element: describe(el),
            parent: describe(parentCard),
            side: 'right',
            overflowPx: pRelRight,
            message: describe(el) + ' exceeds parent ' + describe(parentCard) + ' right by ' + pRelRight + 'px'
          });
        }
      }
    }

    // 3. AABB 元件碰撞檢查 (Element Collision / Overlap)
    const collidables = [...slideEl.querySelectorAll('[class*="card"], button, [class*="btn"], [class*="badge"], [class*="box"]')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 20 && r.height > 15;
    });

    for (let i = 0; i < collidables.length; i++) {
      if (issues.length >= maxDefects) break;
      for (let j = i + 1; j < collidables.length; j++) {
        if (issues.length >= maxDefects) break;
        const a = collidables[i];
        const b = collidables[j];
        if (a.contains(b) || b.contains(a)) continue;

        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();

        const overlapX = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
        const overlapY = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));

        const overlapPxX = Math.round(overlapX / scale);
        const overlapPxY = Math.round(overlapY / scale);

        if (overlapPxX > 10 && overlapPxY > 10) {
          issues.push({
            type: 'collision',
            elementA: describe(a),
            elementB: describe(b),
            overlapPx: Math.min(overlapPxX, overlapPxY),
            message: describe(a) + ' overlaps ' + describe(b) + ' by ' + Math.min(overlapPxX, overlapPxY) + 'px'
          });
        }
      }
    }

    return {
      pass: issues.length === 0,
      issueCount: issues.length,
      issues
    };
  };

  window.__renderGeometryOverlay = function(slideEl) {
    if (!slideEl) return;
    const existing = slideEl.querySelector('.dashi-geometry-overlay-layer');
    if (existing) {
      existing.remove();
      return false;
    }

    const report = window.__inspectSlideGeometry(slideEl);
    const layer = document.createElement('div');
    layer.className = 'dashi-geometry-overlay-layer';
    layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:9999;';

    report.issues.forEach(issue => {
      // 繪製紅框與提示文字
      const banner = document.createElement('div');
      banner.style.cssText = 'position:absolute;background:rgba(239,68,68,0.85);color:white;font-size:12px;padding:3px 8px;border-radius:4px;font-family:sans-serif;margin:4px;box-shadow:0 2px 6px rgba(0,0,0,0.4);';
      banner.textContent = issue.message;
      layer.appendChild(banner);
    });

    slideEl.style.position = 'relative';
    slideEl.appendChild(layer);
    return true;
  };

  // 支援鍵盤快速鍵 'G' 切換量測視圖
  window.addEventListener('keydown', function(e) {
    if ((e.key === 'g' || e.key === 'G') && !e.target.matches('input, textarea, [contenteditable]')) {
      const activeSlide = document.querySelector('#deck > .slide:not([hidden]), .slide.active, .slide') || document.body;
      const active = window.__renderGeometryOverlay(activeSlide);
      console.log('Geometry Inspector ' + (active ? 'Enabled' : 'Disabled'));
    }
  });
})();
`;

export async function inspectDeckGeometry(options) {
  const deckPath = path.resolve(options.deck);
  if (!existsSync(deckPath)) {
    throw new Error(`Deck file not found: ${deckPath}`);
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: getExportBrowserPath(),
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    const deckUrl = 'file:///' + deckPath.replace(/\\\\/g, '/');
    await page.goto(deckUrl, { waitUntil: 'load' });
    await page.addScriptTag({ content: GEOMETRY_INSPECTOR_SNIPPET });

    const results = await page.evaluate(async (maxDefects) => {
      const slides = [...document.querySelectorAll('#deck > .slide')];
      const targetSlides = slides.length ? slides : [document.body];

      return targetSlides.map((slide, index) => {
        const report = window.__inspectSlideGeometry(slide, { maxDefects });
        return {
          slideIndex: index + 1,
          slideId: slide.id || slide.dataset.vmSlideId || `slide-${index + 1}`,
          ...report,
        };
      });
    }, options.maxDefects || 8);

    return {
      deck: deckPath,
      totalSlides: results.length,
      passedSlides: results.filter(r => r.pass).length,
      failedSlides: results.filter(r => !r.pass).length,
      results,
    };
  } finally {
    await browser.close();
  }
}

/**
 * 格式化為極簡文字 (< 100 Tokens / 頁)，專供 Agent 讀取進行自癒微調
 */
export function formatCompactReport(report) {
  const lines = [];
  lines.push(`Geometry Audit: ${report.passedSlides}/${report.totalSlides} slides PASS`);

  for (const slide of report.results) {
    if (slide.pass) {
      lines.push(`- Slide ${slide.slideIndex}: PASS`);
    } else {
      lines.push(`- Slide ${slide.slideIndex}: ${slide.issueCount} defect(s)`);
      for (const issue of slide.issues) {
        lines.push(`  * ${issue.message}`);
      }
    }
  }

  if (report.failedSlides > 0) {
    lines.push('Fix advice: shrink text length/font-size on overflow text, reduce padding or shift elements inward.');
  }

  return lines.join('\n');
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]?.replace(/\\\\/g, '/')}`) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.deck) {
    console.error('Usage: node scripts/inspect-geometry.mjs --deck <path/to/index.html> [--json] [--out report.json]');
    process.exit(2);
  }

  inspectDeckGeometry(args).then(report => {
    if (args.out) {
      writeFileSync(path.resolve(args.out), JSON.stringify(report, null, 2), 'utf8');
    }

    if (args.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatCompactReport(report));
    }

    process.exit(report.failedSlides > 0 ? 1 : 0);
  }).catch(err => {
    console.error(`Geometry inspection failed: ${err.message}`);
    process.exit(1);
  });
}

function parseArgs(argv) {
  const args = { maxDefects: 8, json: false };
  for (let i = 0; i < argv.length; i++) {
    const item = argv[i];
    if (item === '--deck' && argv[i + 1]) {
      args.deck = argv[++i];
    } else if (item === '--out' && argv[i + 1]) {
      args.out = argv[++i];
    } else if (item === '--json') {
      args.json = true;
    } else if (item === '--max-defects' && argv[i + 1]) {
      args.maxDefects = parseInt(argv[++i], 10);
    }
  }
  return args;
}
