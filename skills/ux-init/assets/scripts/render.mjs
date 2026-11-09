#!/usr/bin/env node
// ux-kit · render.mjs — measure a rendered UI (web, Tauri/Electron dev server, Storybook, Flutter web, RN web).
// Requires Playwright in the project or globally: npm i -D playwright && npx playwright install chromium
// Usage:
//   node render.mjs <url|file.html> [--out dir] [--viewports mobile,desktop,reflow] [--dark] [--axe path/axe.min.js] [--json]
// Measures per viewport (mobile 390×844 touch, desktop 1440×900, reflow 320×640):
//   targets < 24px (WCAG 2.5.8 incl. spacing exception) and < 44px on mobile · missing accessible names ·
//   images without alt · placeholder-only labels · computed text contrast (solid backgrounds) ·
//   visible focus via Tab · horizontal overflow at 320px · lang/title · observed CLS / approx LCP · screenshots.
// axe-core is injected automatically when node_modules/axe-core/axe.min.js exists (or with --axe).
// Severities are provisional (see knowledge/severity.md). Exit: 0 · 1 blockers found · 3 Playwright missing.
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { contrastRatio } from './contrast.mjs';

const VIEWPORTS = {
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 } },
  reflow: { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true },
};
const PERF_INIT = `window.__ux={cls:0,lcp:0};try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__ux.cls+=e.value}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>{const es=l.getEntries();const x=es[es.length-1];if(x)window.__ux.lcp=x.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch(e){}`;

function collect() {
  const SEL = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=menuitem],[role=option],[onclick],[tabindex]:not([tabindex="-1"])';
  const vis = (el) => { const s = getComputedStyle(el), r = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0 && r.width > 0 && r.height > 0; };
  const path = (el) => { const p = []; let e = el; while (e && e.nodeType === 1 && p.length < 4) { let s = e.tagName.toLowerCase();
    if (e.id) { p.unshift(s + '#' + e.id); break; } const c = (e.getAttribute('class') || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
    if (c.length) s += '.' + c.join('.'); p.unshift(s); e = e.parentElement; } return p.join(' > '); };
  const name = (el) => {
    const al = el.getAttribute('aria-label'); if (al && al.trim()) return al.trim();
    const lb = el.getAttribute('aria-labelledby'); if (lb) { const t = lb.split(/\s+/).map((i) => (document.getElementById(i) || {}).textContent || '').join(' ').trim(); if (t) return t; }
    if (el.labels && el.labels.length) { const t = [...el.labels].map((l) => l.textContent).join(' ').trim(); if (t) return t; }
    const t = (el.innerText || el.textContent || '').trim(); if (t) return t;
    const img = el.querySelector('img[alt]'); if (img && img.alt.trim()) return img.alt.trim();
    const st = el.querySelector('svg title'); if (st && st.textContent.trim()) return st.textContent.trim();
    if (el.title && el.title.trim()) return el.title.trim();
    if (['submit', 'reset', 'button'].includes(el.type) && el.value) return el.value;
    if (el.placeholder) return '__placeholder__:' + el.placeholder;
    return '';
  };
  const txt = (n) => n && n.nodeType === 3 && n.textContent.trim().length > 0;
  const targets = [...document.querySelectorAll(SEL)].filter(vis).map((el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return { sel: path(el), tag: el.tagName.toLowerCase(), w: r.width, h: r.height, x: r.left, y: r.top, cx: r.left + r.width / 2, cy: r.top + r.height / 2,
      inline: el.tagName === 'A' && s.display === 'inline' && (txt(el.previousSibling) || txt(el.nextSibling)), name: name(el), type: el.type || '' }; });
  const imgs = [...document.images].filter(vis).filter((i) => !i.hasAttribute('alt')).map((i) => ({ sel: path(i), src: (i.currentSrc || i.src).slice(-60) }));
  const bgOf = (el) => { let e = el; while (e) { const s = getComputedStyle(e);
    if (s.backgroundImage && s.backgroundImage !== 'none') return { img: true };
    const m = s.backgroundColor.match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(',').map(parseFloat); const a = p.length > 3 ? p[3] : 1;
      if (a > 0.99) return { c: s.backgroundColor }; if (a > 0) return { c: s.backgroundColor, partial: true }; }
    e = e.parentElement; } return { c: 'rgb(255, 255, 255)' }; };
  const texts = []; const seen = new Set(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode()) && texts.length < 400) { const t = n.textContent.trim(); if (t.length < 2) continue; const el = n.parentElement; if (!el || !vis(el)) continue;
    const s = getComputedStyle(el), bg = bgOf(el); const k = [s.color, bg.c || 'img', s.fontSize, s.fontWeight].join('|'); if (seen.has(k)) continue; seen.add(k);
    texts.push({ sel: path(el), text: t.slice(0, 40), color: s.color, bg: bg.c || null, bgImage: !!bg.img, partial: !!bg.partial, size: parseFloat(s.fontSize), weight: parseInt(s.fontWeight) || 400 }); }
  const de = document.documentElement;
  return { targets, imgs, texts, lang: de.getAttribute('lang') || '', title: document.title || '',
    overflowX: Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0) - de.clientWidth, perf: window.__ux || {} };
}

const rgb = (s) => { const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].replace('/', ',').split(',').filter((x) => x.trim()).map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };

function analyze(d, vp) {
  const F = []; const add = (rule, sev, where, msg, ref) => F.push({ rule, sev, viewport: vp, where, msg, ref });
  const T = d.targets;
  const small = T.filter((t) => ['checkbox', 'radio'].includes(t.type) ? (t.w < 16 || t.h < 16) : ((t.w < 24 || t.h < 24) && !t.inline));
  for (const t of small) {
    let spaced = true;
    for (const o of T) { if (o === t) continue;
      const dx = Math.max(o.x - t.cx, 0, t.cx - (o.x + o.w)), dy = Math.max(o.y - t.cy, 0, t.cy - (o.y + o.h));
      if (Math.hypot(dx, dy) < 12 || (small.includes(o) && Math.hypot(o.cx - t.cx, o.cy - t.cy) < 24)) { spaced = false; break; } }
    const size = `${Math.round(t.w)}×${Math.round(t.h)}px`;
    if (['input', 'select', 'textarea'].includes(t.tag)) add('R-TARGET-24', 'major', t.sel, `Native control ${size} < 24px: exempt if unstyled by author (user-agent exception), otherwise blocker`, 'WCAG 2.5.8');
    else add('R-TARGET-24', spaced ? 'major' : 'blocker', t.sel, `Target ${size} < 24px${spaced ? ' (passes via spacing exception, still small)' : ''}`, 'WCAG 2.5.8 / Fitts');
  }
  if (vp === 'mobile') for (const t of T) if (!small.includes(t) && !t.inline && Math.min(t.w, t.h) < 44) add('R-TARGET-44', 'major', t.sel, `Touch target ${Math.round(t.w)}×${Math.round(t.h)}px < 44–48px`, 'touch-target-platform');
  for (const t of T) { if (!t.name) add('R-NAME', 'blocker', t.sel, `Interactive <${t.tag}> without accessible name`, 'WCAG 4.1.2');
    else if (t.name.startsWith('__placeholder__:')) add('R-PLACEHOLDER-LABEL', 'blocker', t.sel, 'Field whose only name is its placeholder', 'WCAG 3.3.2 / 1.3.1'); }
  for (const i of d.imgs) add('R-IMG-ALT', 'blocker', i.sel, `Image without alt (${i.src})`, 'WCAG 1.1.1');
  for (const t of d.texts) {
    if (t.bgImage) { add('R-CONTRAST-NV', 'suggestion', t.sel, `"${t.text}" over an image: contrast not verifiable automatically`, 'WCAG 1.4.3'); continue; }
    const fg = rgb(t.color), bg = rgb(t.bg); if (!fg || !bg) continue;
    const r = contrastRatio(fg, bg); const need = t.size >= 24 || (t.weight >= 700 && t.size >= 18.66) ? 3 : 4.5;
    if (r + 1e-9 < need) add('R-CONTRAST', 'blocker', t.sel, `Contrast ${r.toFixed(2)}:1 < ${need}:1 on "${t.text}" (${t.color} on ${t.bg}, ${Math.round(t.size)}px)${t.partial ? ' — semi-transparent background, verify' : ''}`, 'WCAG 1.4.3');
  }
  if (!d.lang) add('R-LANG', 'major', 'html', 'Document without lang', 'WCAG 3.1.1');
  if (!d.title) add('R-TITLE', 'major', 'head', 'Document without <title>', 'WCAG 2.4.2');
  if (vp === 'reflow' && d.overflowX > 1) add('R-REFLOW', 'blocker', 'document', `Horizontal scroll of ${d.overflowX}px at 320px width`, 'WCAG 1.4.10');
  if ((d.perf.cls || 0) > 0.1) add('R-CLS', d.perf.cls > 0.25 ? 'major' : 'minor', 'document', `Observed CLS ${d.perf.cls.toFixed(3)} (> 0.1)`, 'Core Web Vitals');
  if ((d.perf.lcp || 0) > 2500) add('R-LCP', 'minor', 'document', `Approx. LCP ${Math.round(d.perf.lcp)} ms (lab, no throttling)`, 'Core Web Vitals');
  return F;
}

const FOCUS_STYLE = (el) => { const s = getComputedStyle(el); return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor, s.backgroundColor, s.textDecorationLine, s.color].join('|'); };

async function checkFocus(page, max = 40) {
  const F = []; const seen = new Set(); await page.keyboard.press('Tab');
  for (let i = 0; i < max; i++) {
    const el = (await page.evaluateHandle(() => document.activeElement)).asElement(); if (!el) break;
    const tag = await el.evaluate((e) => e.tagName); if (tag === 'BODY' || tag === 'HTML') break;
    const sel = await el.evaluate((e) => { let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id; const t = (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30); return s + (t ? ` "${t}"` : ''); });
    if (seen.has(sel)) break; seen.add(sel);
    const focused = await el.evaluate(FOCUS_STYLE); await el.evaluate((e) => e.blur()); const blurred = await el.evaluate(FOCUS_STYLE); await el.evaluate((e) => e.focus());
    if (focused === blurred) F.push({ rule: 'R-FOCUS', sev: 'blocker', viewport: 'desktop', where: sel, msg: 'No visual change when focused by keyboard', ref: 'WCAG 2.4.7' });
    else { const p = focused.split('|'); if ((p[0] === 'none' || !p[0]) && p[3] === 'none' && p[4] === blurred.split('|')[4])
      F.push({ rule: 'R-FOCUS-WEAK', sev: 'minor', viewport: 'desktop', where: sel, msg: 'Focus only changes color/background: verify indicator contrast ≥ 3:1', ref: 'WCAG 2.4.7 / 2.4.13' }); }
    await page.keyboard.press('Tab');
  }
  return [F, seen.size];
}

async function loadPlaywright() {
  for (const base of [process.cwd() + '/', import.meta.url]) {
    try { const req = createRequire(base.startsWith('file:') ? base : pathToFileURL(base).href); return req('playwright'); } catch {}
  }
  try { return await import('playwright'); } catch { return null; }
}

export async function run(target, { viewports = ['mobile', 'desktop', 'reflow'], out = '.ux/reports/render', dark = false, axe = null } = {}) {
  const pw = await loadPlaywright(); if (!pw) return null;
  const url = /^[a-z]+:\/\//i.test(target) ? target : pathToFileURL(resolve(target)).href;
  mkdirSync(out, { recursive: true });
  const findings = []; const meta = { url, screenshots: [], tabbed: 0, axe: null };
  const browser = await pw.chromium.launch();
  try {
    for (const vp of viewports) {
      const ctx = await browser.newContext({ ...VIEWPORTS[vp], ...(dark ? { colorScheme: 'dark' } : {}) });
      await ctx.addInitScript(PERF_INIT); const page = await ctx.newPage();
      try { await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); } catch { await page.goto(url, { waitUntil: 'load', timeout: 30000 }); }
      await page.waitForTimeout(500);
      const shot = join(out, `screenshot-${vp}${dark ? '-dark' : ''}.png`); await page.screenshot({ path: shot, fullPage: true }); meta.screenshots.push(shot);
      findings.push(...analyze(await page.evaluate(collect), vp));
      if (vp === 'desktop') {
        const [ff, n] = await checkFocus(page); findings.push(...ff); meta.tabbed = n;
        if (axe && existsSync(axe)) {
          await page.addScriptTag({ path: axe });
          const res = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }))
            .violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, target: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })));
          meta.axe = res;
          for (const v of res) findings.push({ rule: 'AXE-' + v.id, sev: ['critical', 'serious'].includes(v.impact) ? 'blocker' : 'major', viewport: 'desktop', where: v.target.join(', '), msg: `${v.help} (${v.nodes} nodes)`, ref: 'axe-core' });
        }
      }
      await ctx.close();
    }
  } finally { await browser.close(); }
  const uniq = []; const seen = new Map();
  for (const f of findings) { const k = `${f.rule}|${f.where}|${f.msg}`; if (seen.has(k)) { const p = seen.get(k); if (!p.viewport.split(',').includes(f.viewport)) p.viewport += ',' + f.viewport; continue; } seen.set(k, f); uniq.push(f); }
  const ORD = { blocker: 0, major: 1, minor: 2, suggestion: 3 }; uniq.sort((a, b) => ORD[a.sev] - ORD[b.sev] || a.rule.localeCompare(b.rule));
  const counts = Object.fromEntries(Object.keys(ORD).map((s) => [s, uniq.filter((f) => f.sev === s).length]));
  return { meta, counts, findings: uniq };
}

function toMd(r) {
  const I = { blocker: '❌', major: '🟠', minor: '🟡', suggestion: '💡' }; const c = r.counts, m = r.meta;
  const out = [`# Render audit — ${m.url}`, '', `❌ ${c.blocker} · 🟠 ${c.major} · 🟡 ${c.minor} · 💡 ${c.suggestion} · elements reached with Tab: ${m.tabbed}`, '', 'Screenshots: ' + m.screenshots.join(', ')];
  let cur = null;
  for (const f of r.findings.slice(0, 200)) { if (f.sev !== cur) { cur = f.sev; out.push('', `## ${I[cur]} ${cur}`, ''); } out.push(`- **[${f.rule}]** (${f.viewport}) \`${f.where}\` — ${f.msg} _(ref: ${f.ref})_`); }
  if (m.axe == null) out.push('', '_axe-core not run (add it with --axe node_modules/axe-core/axe.min.js)._');
  return out.join('\n');
}

async function main(argv) {
  const o = { viewports: ['mobile', 'desktop', 'reflow'], out: '.ux/reports/render', dark: false, axe: null }; let json = false; let target = null;
  for (let i = 0; i < argv.length; i++) { const a = argv[i];
    if (a === '--viewports') o.viewports = argv[++i].split(',').filter((v) => VIEWPORTS[v]);
    else if (a === '--out') o.out = argv[++i]; else if (a === '--dark') o.dark = true; else if (a === '--axe') o.axe = argv[++i];
    else if (a === '--json') json = true; else target = a; }
  if (!target) { console.error('usage: node render.mjs <url|file.html> [--out dir] [--viewports mobile,desktop,reflow] [--dark] [--axe path] [--json]'); return 2; }
  if (!o.axe) { const c = join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js'); if (existsSync(c)) o.axe = c; }
  const r = await run(target, o);
  if (!r) { console.error('Playwright not found. Install: npm i -D playwright && npx playwright install chromium'); return 3; }
  console.log(json ? JSON.stringify(r, null, 2) : toMd(r));
  return r.counts.blocker ? 1 : 0;
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main(process.argv.slice(2)).then((c) => { process.exitCode = c; });
