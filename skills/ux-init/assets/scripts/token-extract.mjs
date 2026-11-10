// ux-kit · token-extract.mjs — read design values from theme files and build a DTCG tokens file.
// Project files are parsed as text and never executed. Whatever needs running to be known (imported palettes,
// function calls, computed keys) is reported as unresolved, never guessed. Used by tokens.mjs --from-*.
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { parseColor } from './contrast.mjs';

const VALUE_KEYS = ['colors', 'dark', 'radius', 'duration', 'fontFamily', 'space', 'fontSize'];
const SECTIONS = { radius: ['radius', 'dimension'], duration: ['duration', 'duration'], fontFamily: ['font-family', 'fontFamily'],
  space: ['space', 'dimension'], fontSize: ['font-size', 'dimension'] };
const ROLES = {
  bg: ['bg', 'bg-default', 'background', 'background-default'],
  surface: ['surface', 'card', 'paper', 'background-paper'],
  text: ['text-primary', 'text', 'text-default', 'foreground'],
  'text-secondary': ['text-secondary'],
  'text-muted': ['text-muted', 'muted-foreground', 'text-tertiary'],
  border: ['border', 'border-default', 'divider'],
  action: ['action', 'primary', 'brand', 'primary-main', 'primary-600', 'brand-600', 'primary-500', 'brand-500'],
  'on-action': ['on-action', 'on-primary', 'on-brand', 'primary-foreground', 'brand-foreground', 'primary-contrastText', 'text-inverse'],
  danger: ['danger', 'error', 'destructive', 'error-main'],
  success: ['success', 'success-main'],
  warning: ['warning', 'warning-main'],
  info: ['info', 'info-main'],
  focus: ['focus', 'ring'],
};
const PAIRS = [['text', 'bg', 4.5], ['text-secondary', 'surface', 4.5], ['text-muted', 'surface', 4.5], ['on-action', 'action', 4.5],
  ['border', 'bg', 3], ['danger', 'bg', 4.5], ['success', 'bg', 4.5], ['warning', 'bg', 4.5], ['info', 'bg', 4.5], ['action', 'bg', 3]];

const IDENT = /^[A-Za-z_$][\w$]*$/;
const isPlain = (v) => Boolean(v) && typeof v === 'object' && !Array.isArray(v) && !('$expr' in v);
const safeName = (path) => path.filter((p) => p !== 'DEFAULT').join('-').replace(/[.{}$]/g, '_') || 'default';
const empty = () => ({ ...Object.fromEntries(VALUE_KEYS.map((k) => [k, {}])), unresolved: [], ignored: 0 });

// Parses the JS object, array, string or number at `start`. Anything else comes back as { $expr: "source text" }.
export function parseLiteral(src, start) {
  let i = start;
  const skip = () => {
    for (;;) {
      while (/\s/.test(src[i] ?? '')) i++;
      if (src.startsWith('//', i)) { i = src.indexOf('\n', i); if (i < 0) i = src.length; }
      else if (src.startsWith('/*', i)) { const end = src.indexOf('*/', i); i = end < 0 ? src.length : end + 2; }
      else return;
    }
  };
  const string = () => {
    const quote = src[i++]; let out = ''; let dynamic = false;
    while (i < src.length && src[i] !== quote) {
      if (src[i] === '\\') { out += src[i + 1] ?? ''; i += 2; continue; }
      if (quote === '`' && src.startsWith('${', i)) dynamic = true;
      out += src[i++];
    }
    i++;
    return dynamic ? { $expr: out } : out;
  };
  const expression = (from) => {
    i = from; let depth = 0;
    while (i < src.length) {
      skip();
      const c = src[i];
      if (c === undefined) break;
      if (/['"`]/.test(c)) { string(); continue; }
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) { if (!depth) break; depth--; }
      else if (c === ',' && !depth) break;
      i++;
    }
    return { $expr: src.slice(from, i).trim() };
  };
  const value = (outermost = false) => {
    skip();
    const from = i; const c = src[i]; let v;
    if (c === '{') v = object();
    else if (c === '[') v = array();
    else if (c && /['"`]/.test(c)) v = string();
    else {
      const m = /^-?\d*\.?\d+(?![\w.])/.exec(src.slice(i, i + 32));
      if (!m) return expression(from);
      i += m[0].length; v = Number(m[0]);
    }
    skip();
    if (i >= src.length || ',}])'.includes(src[i])) return v;
    if (outermost && !/[.+\-*/?([]/.test(src[i])) return v; // end of a statement, with or without ";"
    const typed = /^(?:as|satisfies)\s+[\w.<>[\]\s|]+?(?=\s*(?:[,}\])]|$))/.exec(src.slice(i, i + 160)); // TypeScript only
    if (typed) { i += typed[0].length; skip(); return v; }
    return expression(from);
  };
  const array = () => {
    i++; const out = [];
    for (;;) {
      skip();
      if (i >= src.length) return out;
      if (src[i] === ']') { i++; return out; }
      const before = i;
      out.push(src.startsWith('...', i) ? expression(i) : value());
      skip();
      if (src[i] === ',') i++;
      else if (i === before) i++;
    }
  };
  const object = () => {
    i++; const out = {}; let opaque = 0;
    for (;;) {
      skip();
      if (i >= src.length) return out;
      if (src[i] === '}') { i++; return out; }
      const before = i; let key = null;
      if (/['"`]/.test(src[i])) { const k = string(); key = typeof k === 'string' ? k : null; }
      else { const m = /^[\w$-]+/.exec(src.slice(i, i + 200)); if (m && !src.startsWith('...', i)) { key = m[0]; i += m[0].length; } }
      if (key === null) { i = before; out[`...${opaque++}`] = expression(before); }
      else {
        skip();
        if (src[i] === ':') { i++; out[key] = value(); }
        else if (src[i] === ',' || src[i] === '}') out[key] = { $expr: key }; // shorthand
        else out[key] = expression(before); // method
      }
      skip();
      if (src[i] === ',') i++;
      else if (i === before) i++;
    }
  };
  return value(true);
}

function constant(src, name) {
  const m = new RegExp(`\\b(?:const|let|var)\\s+${name.replace(/\$/g, '\\$')}\\b[^=\\n]*=\\s*`).exec(src);
  return m ? parseLiteral(src, m.index + m[0].length) : undefined;
}

// Replaces references to constants declared in the same file.
function deref(src, node, depth = 0) {
  const lookup = (name) => (depth < 5 && IDENT.test(name) ? constant(src, name) : undefined);
  if (Array.isArray(node)) return node.map((e) => deref(src, e, depth));
  if (!node || typeof node !== 'object') return node;
  if ('$expr' in node) { const found = lookup(node.$expr); return found === undefined ? node : deref(src, found, depth + 1); }
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (!k.startsWith('...')) { out[k] = deref(src, v, depth); continue; }
    const found = lookup(v.$expr.slice(3).trim());
    const spread = found === undefined ? undefined : deref(src, found, depth + 1);
    if (isPlain(spread)) Object.assign(out, spread); else out[k] = v;
  }
  return out;
}

export function color(raw) {
  if (typeof raw !== 'string') return null;
  let s = raw.trim();
  if (/^\d[\d.]*\s+\d[\d.]*%\s+\d[\d.]*%/.test(s)) s = `hsl(${s})`; // shadcn-style channels
  let c; try { c = parseColor(s); } catch { return null; }
  if (c.length !== 4 || !c.every(Number.isFinite)) return null;
  if (c[3] < 1) return { colorSpace: 'srgb', components: c.slice(0, 3).map((v) => Number((v / 255).toFixed(4))), alpha: c[3] };
  return `#${c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function dimension(raw) {
  if (typeof raw === 'number') return { value: raw, unit: 'px' };
  if (typeof raw !== 'string') return null;
  if (raw.trim() === '0') return { value: 0, unit: 'px' };
  const m = raw.trim().match(/^(-?\d*\.?\d+)(px|rem)$/);
  return m ? { value: Number(m[1]), unit: m[2] } : null;
}

function duration(raw) {
  if (typeof raw !== 'string') return null;
  const m = raw.trim().match(/^(\d*\.?\d+)(ms|s)$/);
  return m ? { value: Number(m[1]), unit: m[2] } : null;
}

function fontFamily(raw) {
  let list = Array.isArray(raw) && Array.isArray(raw[0]) ? raw[0] : raw; // Tailwind: [families, { features }]
  if (typeof list === 'string') list = list.split(',');
  if (!Array.isArray(list)) return null;
  const names = list.filter((f) => typeof f === 'string').map((f) => f.trim().replace(/^['"]|['"]$/g, '')).filter((f) => f && !f.startsWith('var('));
  return names.length ? names : null;
}

const fontSize = (raw) => dimension(Array.isArray(raw) ? raw[0] : raw);

function addTree(out, section, node, parse, label, path = [], skipKeys = []) {
  for (const [k, v] of Object.entries(node)) {
    if (skipKeys.includes(k)) continue;
    if (k.startsWith('...')) { out.unresolved.push(`${label}: ${v.$expr}`); continue; }
    if (isPlain(v)) { addTree(out, section, v, parse, `${label}.${k}`, [...path, k], skipKeys); continue; }
    const parsed = v && v.$expr !== undefined ? null : parse(v);
    if (parsed === null) out.unresolved.push(`${label}.${k}`);
    else out[section][safeName([...path, k])] = parsed;
  }
}

function themeStart(src) {
  const re = /\btheme\s*:\s*\{/g; let m;
  while ((m = re.exec(src))) {
    const line = src.slice(src.lastIndexOf('\n', m.index) + 1, m.index).trim();
    if (!line.startsWith('//') && !line.startsWith('*')) return m.index + m[0].length - 1;
  }
  return -1;
}

export function fromTailwind(file) {
  const src = readFileSync(file, 'utf8');
  const start = themeStart(src);
  if (start < 0) throw new Error(`no theme object found in ${file}`);
  const theme = deref(src, parseLiteral(src, start));
  const out = { ...empty(), source: basename(file) };
  const extend = isPlain(theme.extend) ? theme.extend : {};
  const FIELDS = [['colors', 'colors', color], ['borderRadius', 'radius', dimension], ['transitionDuration', 'duration', duration],
    ['fontFamily', 'fontFamily', fontFamily], ['spacing', 'space', dimension], ['fontSize', 'fontSize', fontSize]];
  for (const [key, section, parse] of FIELDS) {
    for (const scope of [theme, extend]) {
      if (scope[key] === undefined) continue;
      if (isPlain(scope[key])) addTree(out, section, scope[key], parse, key);
      else out.unresolved.push(key);
    }
  }
  return out;
}

const DARK = /\.dark\b|\[data-theme=["']?dark["']?\]|prefers-color-scheme:\s*dark/;
const VARIABLE_SCOPE = /^(?:@theme.*|(?::root|:host|html)?(?:\.dark|\[data-theme=["']?dark["']?\])?)$/;

function cssVariables(text) {
  const css = text.replace(/\/\*[\s\S]*?\*\//g, '');
  const found = []; const stack = []; let buffer = ''; let parens = 0;
  const flush = () => {
    const m = buffer.trim().match(/^(--[\w-]+)\s*:\s*([\s\S]+)$/);
    const scope = stack.at(-1) ?? '';
    if (m && scope && scope.split(',').some((part) => VARIABLE_SCOPE.test(part.trim()))) found.push({ name: m[1], value: m[2].trim(), dark: DARK.test(stack.join(' ')) });
    buffer = '';
  };
  for (const c of css) {
    if (c === '(') parens++;
    if (c === ')') parens = Math.max(0, parens - 1);
    if (parens) { buffer += c; continue; }
    if (c === '{') { stack.push(buffer.trim()); buffer = ''; }
    else if (c === '}') { flush(); stack.pop(); }
    else if (c === ';') flush();
    else buffer += c;
  }
  return found;
}

export function fromCss(file) {
  const vars = cssVariables(readFileSync(file, 'utf8'));
  const light = new Map(vars.filter((v) => !v.dark).map((v) => [v.name, v.value]));
  const dark = new Map(vars.filter((v) => v.dark).map((v) => [v.name, v.value]));
  const resolve = (value, isDark, depth = 0) => {
    const m = value.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/);
    if (!m || depth > 5) return value;
    const next = (isDark ? dark.get(m[1]) : undefined) ?? light.get(m[1]) ?? m[2];
    return next === undefined ? value : resolve(next.trim(), isDark, depth + 1);
  };
  const out = { ...empty(), source: basename(file) };
  const set = (section, key, parse, value, label) => {
    const parsed = parse(value);
    if (parsed === null) { out.unresolved.push(label); return; }
    out[section][safeName([key])] = parsed;
  };
  for (const v of vars) {
    const name = v.name.slice(2); const value = resolve(v.value, v.dark); let m;
    if (name.includes('--')) { out.ignored++; continue; } // Tailwind modifiers, e.g. --text-sm--line-height
    if (v.dark) { if (color(value) !== null) out.dark[safeName([name.replace(/^color-/, '')])] = color(value); else out.ignored++; continue; }
    if ((m = name.match(/^color-(.+)$/))) set('colors', m[1], color, value, v.name);
    else if ((m = name.match(/^radius(?:-(.+))?$/))) set('radius', m[1] ?? 'default', dimension, value, v.name);
    else if ((m = name.match(/^(?:spacing|space)(?:-(.+))?$/))) set('space', m[1] ?? 'default', dimension, value, v.name);
    else if ((m = name.match(/^duration-(.+)$/))) set('duration', m[1], duration, value, v.name);
    else if ((m = name.match(/^(?:text|font-size)-(.+)$/)) && dimension(value) !== null) set('fontSize', m[1], dimension, value, v.name);
    else if ((m = name.match(/^font(?:-family)?(?:-(.+))?$/)) && !/^\d/.test(value)) { const f = fontFamily(value); if (f) out.fontFamily[safeName([m[1] ?? 'default'])] = f; else out.ignored++; }
    else if (color(value) !== null) out.colors[safeName([name])] = color(value);
    else out.ignored++;
  }
  return out;
}

export function fromMui(file) {
  const src = readFileSync(file, 'utf8');
  const at = src.search(/\bcreateTheme\s*\(/);
  if (at < 0) throw new Error(`no createTheme call found in ${file}`);
  const theme = deref(src, parseLiteral(src, src.indexOf('(', at) + 1));
  if (!isPlain(theme)) throw new Error(`createTheme argument is not an object in ${file}`);
  const out = { ...empty(), source: basename(file) };
  if (isPlain(theme.palette)) addTree(out, theme.palette.mode === 'dark' ? 'dark' : 'colors', theme.palette, color, 'palette', [], ['mode', 'tonalOffset', 'contrastThreshold']);
  const radius = dimension(theme.shape?.borderRadius);
  if (radius) out.radius.md = radius;
  const family = fontFamily(theme.typography?.fontFamily);
  if (family) out.fontFamily.sans = family;
  return out;
}

function group(type, values, prefix = '') {
  const node = { $type: type };
  for (const [name, value] of Object.entries(values)) node[prefix + name] = { $value: value };
  return node;
}

function semanticColors(values, prefix) {
  const node = { $type: 'color' }; const found = [];
  for (const [role, candidates] of Object.entries(ROLES)) {
    const name = candidates.find((c) => values[c] !== undefined);
    if (name) { node[role] = { $value: `{primitive.color.${prefix}${name}}` }; found.push(role); }
  }
  return { node, found };
}

function contrastPairs(mode, found) {
  const path = `semantic.${mode}.color.`;
  return PAIRS.flatMap(([fg, bg, min]) => {
    const under = bg === 'surface' && !found.includes('surface') ? 'bg' : bg;
    return found.includes(fg) && found.includes(under) ? [{ fg: path + fg, bg: path + under, min }] : [];
  });
}

// `existing` is the current tokens file: sections the sources don't provide keep its values.
export function buildTokens(sources, existing = null) {
  const x = empty();
  for (const s of sources) { for (const k of VALUE_KEYS) Object.assign(x[k], s[k]); x.unresolved.push(...s.unresolved); x.ignored += s.ignored; }
  const hasLight = Object.keys(x.colors).length > 0; const hasDark = Object.keys(x.dark).length > 0; const hasColors = hasLight || hasDark;
  const primitive = {};
  if (hasColors) primitive.color = { ...group('color', x.colors), ...group('color', x.dark, 'dark-') };
  for (const [key, [name, type]] of Object.entries(SECTIONS)) if (Object.keys(x[key]).length) primitive[name] = group(type, x[key]);

  const out = existing ? structuredClone(existing) : {};
  out.$description = `Design tokens (DTCG 2025.10). Extracted from ${sources.map((s) => s.source).join(', ')} by tokens.mjs. Layers: primitive -> semantic. Technology-agnostic: values only, never framework class names.`;
  const previous = out.primitive ?? {};
  out.primitive = { ...previous, ...primitive };
  const ext = (out.$extensions ??= {});
  const oldStatus = ext['ux-kit.status']; const oldSections = ext['ux-kit.status-by-section'] ?? {};
  const kept = Object.keys(previous).filter((k) => !primitive[k]).map((k) => `primitive.${k}`);
  const light = semanticColors(x.colors, ''); const dark = semanticColors(x.dark, 'dark-');
  if (hasColors) {
    const semantic = { ...out.semantic };
    if (hasLight) semantic.light = { ...semantic.light, color: light.node }; else delete semantic.light;
    if (hasDark) semantic.dark = { ...semantic.dark, color: dark.node }; else delete semantic.dark;
    out.semantic = semantic;
    ext['ux-kit.contrast-pairs'] = [...(hasLight ? contrastPairs('light', light.found) : []), ...(hasDark ? contrastPairs('dark', dark.found) : [])];
  } else for (const mode of ['light', 'dark']) if (out.semantic?.[mode]) kept.push(`semantic.${mode}`);
  const placeholders = kept.filter((k) => (oldSections[k] ?? oldStatus) === 'placeholder');
  ext['ux-kit.status'] = 'extracted';
  if (placeholders.length) ext['ux-kit.status-by-section'] = Object.fromEntries(placeholders.map((k) => [k, 'placeholder']));
  else delete ext['ux-kit.status-by-section'];

  const count = VALUE_KEYS.reduce((sum, k) => sum + Object.keys(x[k]).length, 0);
  const missingRoles = hasLight ? Object.keys(ROLES).filter((r) => !light.found.includes(r)) : [];
  return { tokens: out, report: { count, missingRoles, unresolved: x.unresolved, placeholders, ignored: x.ignored, removedDark: Boolean(existing?.semantic?.dark) && hasColors && !hasDark } };
}
