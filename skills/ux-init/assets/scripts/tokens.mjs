#!/usr/bin/env node
// ux-kit · tokens.mjs — validate a DTCG (2025.10) design tokens file.
// Usage: node tokens.mjs .ux/standard/tokens.json [--json] [--base 4]
// Checks: $value present; $type explicit or inherited and known; aliases {a.b} exist and are not circular;
// dimension format ({"value":n,"unit":"px"} in 2025.10; legacy "16px" warned); spacing on base scale;
// type scale size/ratios; contrast pairs from $extensions["ux-kit.contrast-pairs"] ([{fg,bg,min}]) or inferred.
// Exit code: 0 ok · 1 blocker issues · 2 usage error.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseColor, contrastRatio } from './contrast.mjs';

const KNOWN = new Set(['color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier', 'number',
  'strokeStyle', 'border', 'transition', 'shadow', 'gradient', 'typography']);
const ALIAS = /^\{([^}]+)\}$/;

function flatten(node, path = [], inherited = null, out = {}) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return out;
  const t = node.$type ?? inherited;
  if ('$value' in node) { out[path.join('.')] = { value: node.$value, type: t }; return out; }
  for (const [k, v] of Object.entries(node)) if (!k.startsWith('$')) flatten(v, [...path, k], t, out);
  return out;
}

function resolve(tokens, name, seen = []) {
  if (seen.includes(name)) throw new Error('circular alias: ' + [...seen, name].join(' -> '));
  const tok = tokens[name];
  if (!tok) throw new Error(`alias to missing token: ${name}`);
  const v = tok.value;
  if (typeof v === 'string') { const m = v.match(ALIAS); if (m) return resolve(tokens, m[1], [...seen, name]); }
  return v;
}

function px(v, root = 16) {
  if (v && typeof v === 'object' && 'value' in v) return Number(v.value) * (v.unit === 'rem' ? root : 1);
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const m = v.trim().match(/^(-?\d+(?:\.\d+)?)(px|rem)?$/); if (m) return Number(m[1]) * (m[2] === 'rem' ? root : 1); }
  return null;
}

function colorStr(v) {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    if (v.hex) return v.hex;
    const c = v.components, a = v.alpha ?? 1;
    if (c && (v.colorSpace ?? 'srgb') === 'srgb') return `rgba(${c.slice(0, 3).map((x) => Math.round(x * 255)).join(',')},${a})`;
    if (c && v.colorSpace === 'oklch') return `oklch(${c[0]} ${c[1]} ${c[2]})`;
  }
  throw new Error(`uninterpretable color: ${JSON.stringify(v)}`);
}

export function check(file, base = 4) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const toks = flatten(data); const issues = []; const info = {};
  const I = (sev, token, msg) => issues.push({ sev, token, msg });
  const resolved = {};
  for (const [name, t] of Object.entries(toks)) {
    if (!t.type) I('minor', name, 'no $type (nor inherited from group)');
    else if (!KNOWN.has(t.type)) I('minor', name, `unknown $type: ${t.type}`);
    try { resolved[name] = resolve(toks, name); } catch (e) { I('blocker', name, e.message); }
    if (t.type === 'dimension' && typeof t.value === 'string' && !ALIAS.test(t.value))
      I('suggestion', name, `legacy dimension '${t.value}'; DTCG 2025.10 uses {"value": n, "unit": "px"}`);
  }
  const spacing = Object.entries(resolved).filter(([n]) => /(^|\.)(space|spacing|gap|inset)(\.|$)/.test(n) && toks[n].type === 'dimension')
    .map(([n, v]) => [n, px(v)]);
  for (const [n, v] of spacing) if (v != null && v > 0 && !(v % base === 0 || (v < 8 && v % 2 === 0))) I('minor', n, `spacing ${v}px off base-${base} scale`);
  info.spacing = [...new Set(spacing.map(([, v]) => v).filter((v) => v != null))].sort((a, b) => a - b);
  const fs = [...new Set(Object.entries(resolved).filter(([n]) => /font-?size|fontSize|(^|\.)type\.|text-size/i.test(n)).map(([, v]) => px(v)).filter(Boolean))].sort((a, b) => a - b);
  info.fontSizes = fs;
  if (fs.length > 9) I('minor', '(scale)', `${fs.length} font sizes: consider 5–8`);
  if (fs.length && fs[0] < 12) I('major', '(scale)', `smallest font size ${fs[0]}px < 12px`);
  if (fs.length >= 3) info.scaleRatios = fs.slice(1).map((b, i) => Math.round((b / fs[i]) * 1000) / 1000);
  let pairs = data.$extensions?.['ux-kit.contrast-pairs']; let auto = false;
  if (!pairs) {
    auto = true; pairs = [];
    const groups = {};
    for (const n of Object.keys(toks).filter((n) => toks[n].type === 'color')) (groups[n.slice(0, n.lastIndexOf('.'))] ??= []).push(n);
    for (const [g, names] of Object.entries(groups)) {
      const fgs = names.filter((n) => /\.(text|fg|foreground|on-[\w-]+|on[A-Z]\w*)[\w-]*$/.test(n));
      const bgs = names.filter((n) => /\.(bg|background|surface)[\w-]*$/.test(n));
      for (const f of fgs) for (const b of bgs) pairs.push({ fg: f, bg: b, min: 4.5 });
      for (const f of fgs) { const m = f.match(/\.on-([\w-]+)$/); if (m && toks[`${g}.${m[1]}`]) pairs.push({ fg: f, bg: `${g}.${m[1]}`, min: 4.5 }); }
    }
  }
  info.contrast = []; info.contrastInferred = auto;
  for (const p of pairs) {
    try {
      const fg = colorStr(resolved[p.fg]), bg = colorStr(resolved[p.bg]);
      const r = contrastRatio(parseColor(fg), parseColor(bg)); const min = Number(p.min ?? 4.5);
      const ok = r + 1e-9 >= min;
      info.contrast.push({ fg: p.fg, bg: p.bg, ratio: Math.round(r * 100) / 100, min, ok });
      if (!ok) I('blocker', `${p.fg} / ${p.bg}`, `contrast ${r.toFixed(2)}:1 < ${min}:1 (${fg} on ${bg})`);
    } catch (e) { I('major', `${p.fg} / ${p.bg}`, `cannot evaluate pair: ${e.message}`); }
  }
  info.total = Object.keys(toks).length;
  return { file, issues, info };
}

const ICON = { blocker: '❌', major: '🟠', minor: '🟡', suggestion: '💡' };
const ORDER = { blocker: 0, major: 1, minor: 2, suggestion: 3 };
function toMd(r) {
  const i = r.info; const out = [`# Tokens check — ${r.file}`, '', `Tokens: ${i.total}`, '',
    `## Contrast${i.contrastInferred ? ' (pairs inferred)' : ''}`];
  for (const p of i.contrast) out.push(`- ${p.ok ? '✅' : '❌'} \`${p.fg}\` / \`${p.bg}\`: ${p.ratio}:1 (min ${p.min})`);
  if (!i.contrast.length) out.push('- No evaluable pairs. Declare $extensions["ux-kit.contrast-pairs"].');
  out.push('', '## Scales', `- Spacing (px): ${JSON.stringify(i.spacing)}`, `- Font sizes (px): ${JSON.stringify(i.fontSizes)}`);
  if (i.scaleRatios) out.push(`- Step ratios: ${JSON.stringify(i.scaleRatios)}`);
  out.push('', '## Issues');
  for (const x of [...r.issues].sort((a, b) => ORDER[a.sev] - ORDER[b.sev])) out.push(`- ${ICON[x.sev]} \`${x.token}\` — ${x.msg}`);
  if (!r.issues.length) out.push('- ✅ none');
  return out.join('\n');
}

function main(argv) {
  let json = false, base = 4; const pos = [];
  for (let i = 0; i < argv.length; i++) { if (argv[i] === '--json') json = true; else if (argv[i] === '--base') base = Number(argv[++i]); else pos.push(argv[i]); }
  if (argv.includes('--help') || argv.includes('-h')) { console.log('usage: node tokens.mjs <tokens.json> [--json] [--base 4]'); return 0; }
  if (!pos[0]) { console.error('usage: node tokens.mjs <tokens.json> [--json] [--base 4]'); return 2; }
  let r; try { r = check(pos[0], base); } catch (e) { console.error(e.message); return 2; }
  console.log(json ? JSON.stringify(r, null, 2) : toMd(r));
  return r.issues.some((x) => x.sev === 'blocker') ? 1 : 0;
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) process.exitCode = main(process.argv.slice(2));
