#!/usr/bin/env node
// ux-kit · contrast.mjs — WCAG 2.x contrast ratio (+ APCA Lc as reference only).
// Usage:
//   node contrast.mjs "#777" "#fff" [--size 14] [--bold] [--ui] [--json]
//   node contrast.mjs --pairs pairs.txt      (one "fg bg [label]" per line)
// Formats: #rgb #rgba #rrggbb #rrggbbaa · rgb()/rgba() · hsl()/hsla() · oklch() ·
//          0xAARRGGBB / Color(0xAARRGGBB) (Compose/Flutter) · basic names.
// Thresholds (WCAG 2.2): text 4.5:1 (AA) / 7:1 (AAA); large text (>=24px or >=18.66px bold) 3:1 / 4.5:1;
// UI components & graphics 3:1 (1.4.11). APCA is NOT a current standard; shown for reference.
//   node contrast.mjs "#ff00aa" "#fff" --suggest   also propose the nearest foreground that passes AA
// Exit code: 0 all pairs pass AA · 1 some pair fails AA (not a script error) · 2 usage error.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const NAMED = { white: '#ffffff', black: '#000000', red: '#ff0000', green: '#008000', blue: '#0000ff',
  gray: '#808080', grey: '#808080', silver: '#c0c0c0', transparent: '#00000000', orange: '#ffa500', yellow: '#ffff00' };

const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const num = (t, scale = 1) => (t.trim().endsWith('%') ? parseFloat(t) / 100 : parseFloat(t) / scale);

function hslToRgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  if (s === 0) return [l, l, l];
  const hue = (p, q, t) => { t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q;
  return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)];
}

function oklchToRgb(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return lin.map((x) => { x = clamp(x); return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055; });
}

export function parseColor(input) {
  if (input == null) throw new Error('empty color');
  let low = String(input).trim().toLowerCase();
  if (NAMED[low]) low = NAMED[low];
  let m = low.match(/^(?:color\()?0x([0-9a-f]{8}|[0-9a-f]{6})\)?$/);
  if (m) {
    const h = m[1];
    if (h.length === 8) return [parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), parseInt(h.slice(6, 8), 16), parseInt(h.slice(0, 2), 16) / 255];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  if (low.startsWith('#')) {
    let h = low.slice(1);
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length === 6) h += 'ff';
    if (!/^[0-9a-f]{8}$/.test(h)) throw new Error(`invalid hex: ${input}`);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), parseInt(h.slice(6, 8), 16) / 255];
  }
  m = low.match(/^(rgba?|hsla?|oklch)\((.*)\)$/);
  if (!m) throw new Error(`unsupported format: ${input}`);
  const fn = m[1];
  const parts = m[2].replace(/[\/,]/g, ' ').split(/\s+/).filter(Boolean);
  const alpha = parts.length === 4 ? num(parts[3]) : 1;
  if (fn.startsWith('rgb')) {
    const v = parts.slice(0, 3).map((p) => (p.endsWith('%') ? clamp(parseFloat(p) / 100) * 255 : parseFloat(p)));
    return [...v, alpha];
  }
  if (fn.startsWith('hsl')) {
    const [r, g, b] = hslToRgb(parseFloat(parts[0]), num(parts[1], 100), num(parts[2], 100));
    return [r * 255, g * 255, b * 255, alpha];
  }
  let L = parts[0].endsWith('%') ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
  if (L > 1) L /= 100;
  const C = parts[1].endsWith('%') ? (parseFloat(parts[1]) / 100) * 0.4 : parseFloat(parts[1]);
  const H = parts[2] === 'none' ? 0 : parseFloat(parts[2]);
  const [r, g, b] = oklchToRgb(L, C, H);
  return [r * 255, g * 255, b * 255, alpha];
}

const composite = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
const solid = (fg, bg) => {
  if (bg[3] < 1) bg = composite(bg, [255, 255, 255, 1]);
  if (fg[3] < 1) fg = composite(fg, bg);
  return [fg, bg];
};

export function luminance(c) {
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
}

export function contrastRatio(fgIn, bgIn) {
  const [fg, bg] = solid(fgIn, bgIn);
  const a = luminance(fg), b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function apcaLc(fgIn, bgIn) {
  const [fg, bg] = solid(fgIn, bgIn);
  const y = (c) => 0.2126729 * (c[0] / 255) ** 2.4 + 0.7151522 * (c[1] / 255) ** 2.4 + 0.072175 * (c[2] / 255) ** 2.4;
  const clampBlack = (v) => (v < 0.022 ? v + (0.022 - v) ** 1.414 : v);
  const yt = clampBlack(y(fg)), yb = clampBlack(y(bg));
  if (Math.abs(yb - yt) < 0.0005) return 0;
  let out;
  if (yb > yt) { const s = (yb ** 0.56 - yt ** 0.57) * 1.14; out = s < 0.1 ? 0 : s - 0.027; }
  else { const s = (yb ** 0.65 - yt ** 0.62) * 1.14; out = s > -0.1 ? 0 : s + 0.027; }
  return out * 100;
}

export function evaluate(fgS, bgS, { size = null, bold = false, ui = false, min = null } = {}) {
  const fg = parseColor(fgS), bg = parseColor(bgS);
  const ratio = contrastRatio(fg, bg);
  const large = size != null && (size >= 24 || (bold && size >= 18.66));
  let needAA, needAAA = null, kind;
  if (min != null) { needAA = min; kind = `declared minimum ${min}:1`; }
  else if (ui) { needAA = 3; kind = 'UI component / non-text (1.4.11)'; }
  else if (large) { needAA = 3; needAAA = 4.5; kind = 'large text'; }
  else { needAA = 4.5; needAAA = 7; kind = 'normal text'; }
  return { fg: fgS, bg: bgS, ratio: Math.round(ratio * 100) / 100, kind,
    AA: ratio + 1e-9 >= needAA, AAA: needAAA ? ratio + 1e-9 >= needAAA : null, requiredAA: needAA,
    apcaLcReference: Math.round(apcaLc(fg, bg) * 10) / 10 };
}

export function suggest(fgS, bgS, need = 4.5) {
  const fg = parseColor(fgS), bg = parseColor(bgS);
  const toHex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const out = {};
  for (const [dir, target] of [['darker', [0, 0, 0]], ['lighter', [255, 255, 255]]]) {
    for (let t = 0; t <= 1.0001; t += 0.01) {
      const c = [0, 1, 2].map((i) => fg[i] + (target[i] - fg[i]) * t).concat(1);
      if (contrastRatio(c, bg) >= need) { out[dir] = { color: toHex(c), ratio: Math.round(contrastRatio(c, bg) * 100) / 100 }; break; }
    }
  }
  return out;
}

const fmt = (r) => `${r.label ? `[${r.label}] ` : ''}${r.fg} on ${r.bg}: ${r.ratio}:1 (${r.kind}, needs ${r.requiredAA}:1) ` +
  `${r.AA ? '✅ AA' : '❌ AA'}${r.AAA == null ? '' : r.AAA ? ' ✅ AAA' : ' · no AAA'} · APCA Lc ${r.apcaLcReference} (reference)`;

function main(argv) {
  const opts = { size: null, bold: false, ui: false }; const pos = []; let pairs = null, json = false, sug = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--size') opts.size = parseFloat(argv[++i]);
    else if (a === '--bold') opts.bold = true;
    else if (a === '--ui') opts.ui = true;
    else if (a === '--json') json = true;
    else if (a === '--suggest') sug = true;
    else if (a === '--pairs') pairs = argv[++i];
    else if (a === '-h' || a === '--help') { console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n')); return 0; }
    else pos.push(a);
  }
  const results = [];
  try {
    if (pairs) {
      for (const line of readFileSync(pairs, 'utf8').split('\n')) {
        const t = line.trim(); if (!t || t.startsWith('#')) continue;
        const toks = t.match(/\S+\([^)]*\)|\S+/g); if (toks.length < 2) continue;
        results.push({ ...evaluate(toks[0], toks[1], opts), label: toks.slice(2).join(' ') });
      }
    } else if (pos.length >= 2) results.push(evaluate(pos[0], pos[1], opts));
    else { console.error('usage: node contrast.mjs <fg> <bg> [--size px] [--bold] [--ui] [--json] | --pairs file'); return 2; }
  } catch (e) { console.error(String(e.message || e)); return 2; }
  if (sug) for (const r of results) if (!r.AA) r.suggestion = suggest(r.fg, r.bg, r.requiredAA);
  console.log(json ? JSON.stringify(results, null, 2) : results.map((r) => fmt(r) + (r.suggestion ? `\n  → nearest passing: ${Object.entries(r.suggestion).map(([k, v]) => `${k} ${v.color} (${v.ratio}:1)`).join(' · ')}` : '')).join('\n'));
  return results.every((r) => r.AA) ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) process.exitCode = main(process.argv.slice(2));
