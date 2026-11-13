#!/usr/bin/env node
// ux-kit · scan.mjs — static UX/UI scan across stacks (pattern-based, no dependencies).
// Usage:
//   node scan.mjs <paths...> [--json] [--platform web|mobile|desktop] [--fail-on blocker|major] [--max-per-rule 8]
//   node scan.mjs --changed [git-ref] [paths...]   scan visual files changed vs ref (default HEAD, plus untracked), only
//                                       inside paths when given; only findings on changed lines are shown
//                                       (--all-lines to include pre-existing ones)
//   node scan.mjs --list-changed [ref] [paths...]  only print the changed visual files (any language), one per line
//   Any mode: --include <glob> / --exclude <glob> (repeatable, relative to the current directory; exclude wins).
//   Inside a git repository a folder is scanned through git: files ignored by .gitignore are skipped (a file passed
//   explicitly is always scanned). Libraries copied by hand (jquery-ui/, bootstrap*/ folders, or a library banner at
//   the top of the file) are skipped and listed as third-party; --include-vendor scans them too.
//   An argument after --changed that is both a ref and a path is an error: write ./name (path) or refs/heads/name (ref).
// Covers HTML, JSX/TSX, Vue, Svelte, Astro, Blade/Twig/Razor/JSP, CSS/SCSS, Jetpack Compose (.kt), Android XML,
// SwiftUI (.swift), Flutter (.dart), React Native, XAML, QML, Java Swing/JavaFX.
// IMPORTANT: every finding is a CANDIDATE to confirm by reading the code. Severities are provisional
// (see knowledge/severity.md). Other languages: the agent reviews them using knowledge/stacks/.
// Exit code: 0, or 1 when findings at --fail-on level exist (for CI).
import { readdirSync, readFileSync, statSync, existsSync, realpathSync } from 'node:fs';
import { join, relative, extname, basename, resolve, dirname, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { isMain } from './is-main.mjs';
import { thirdPartyReason } from './third-party.mjs';

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'vendor', 'Pods', '.gradle', 'target',
  '.dart_tool', 'coverage', '.venv', 'venv', '__pycache__', '.idea', '.turbo', 'storybook-static', 'DerivedData',
  '.svelte-kit', '.nuxt', '.output', 'bin', 'obj', 'generated', '.expo', '.ux', '.claude', '.agents']);
const WEB = new Set(['.html', '.htm', '.jsx', '.tsx', '.js', '.ts', '.vue', '.svelte', '.astro', '.php', '.twig', '.cshtml',
  '.razor', '.hbs', '.ejs', '.erb', '.mdx', '.jsp', '.njk']);
const CSS = new Set(['.css', '.scss', '.sass', '.less', '.pcss']);
const OTHER = new Set(['.kt', '.xml', '.swift', '.dart', '.xaml', '.axaml', '.qml', '.java']);
// visual files for --list-changed: broad on purpose (any UI technology)
// (data/config files like .json/.yaml and general-purpose languages without UI conventions are excluded;
//  pass such files explicitly when they contain UI code)
const VISUAL = new Set([...WEB, ...CSS, ...OTHER, '.cs', '.cpp', '.cc', '.h', '.hpp', '.ui', '.fxml', '.storyboard', '.xib',
  '.svg', '.m', '.mm', '.glade', '.blp']);
const SEV = { blocker: 0, major: 1, minor: 2, suggestion: 3 };
const ICON = { blocker: '❌', major: '🟠', minor: '🟡', suggestion: '💡' };
const TOKEN_FILE = /(theme|tokens?|colou?rs?|palette|tailwind\.config|variables|design[-_]?system|typography|Type\.kt|Color\.kt|Theme\.kt|styles\.xml|colors\.xml|\.tokens\.json|globals?\.css|app\.css|index\.css)/i;
const isTokenFile = (p) => TOKEN_FILE.test(basename(p)) || /[\/\\](theme|tokens|design-system)[\/\\]/i.test(p);

const lineOf = (t, i) => t.slice(0, i).split('\n').length;
const snippetAt = (t, i) => { const s = t.lastIndexOf('\n', i - 1) + 1; const e = t.indexOf('\n', i); return t.slice(s, e === -1 ? t.length : e).trim().slice(0, 160); };

const TAG = /<([A-Za-z][\w.:-]*)\b((?:[^>"'{}]|"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\})*)(\/?)>/gs;
const TW = { 3: 12, 3.5: 14, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56 };
const INTERACTIVE = new Set(['button', 'a', 'Button', 'IconButton', 'Link', 'NavLink', 'Pressable', 'TouchableOpacity', 'TouchableHighlight', 'summary']);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const attr = (a, n) => { const m = a.match(new RegExp(`(?:^|\\s)${esc(n)}\\s*=\\s*("[^"]*"|'[^']*'|\\{(?:[^{}]|\\{[^{}]*\\})*\\})`, 's')); return m ? m[1].slice(1, -1) : null; };
const has = (a, ...ns) => ns.some((n) => new RegExp(`(?:^|\\s)${esc(n)}(\\s*=|\\s|$|/)`).test(a));
const SPREAD = /\{\s*\.\.\./; // JSX spread: alt, id or aria-label may arrive through it, so the finding needs checking

// Name of the call whose argument list contains offset i (e.g. "Icon" for a Modifier passed to Icon(...)).
function enclosingCall(t, i) {
  let depth = 0;
  for (let k = i - 1; k >= 0; k--) {
    if (t[k] === ')') depth++;
    else if (t[k] === '(') { if (depth === 0) { const m = t.slice(Math.max(0, k - 40), k).match(/([A-Za-z_]\w*)\s*$/); return m ? m[1] : null; } depth--; }
  }
  return null;
}

function globToRe(glob) {
  const g = glob.replace(/\\/g, '/').replace(/^\.\//, ''); let s = '';
  for (let i = 0; i < g.length;) {
    if (g.startsWith('**/', i)) { s += '(?:.*/)?'; i += 3; }
    else if (g.startsWith('/**', i) && i + 3 === g.length) { s += '(?:/.*)?'; i += 3; }
    else if (g.startsWith('**', i)) { s += '.*'; i += 2; }
    else if (g[i] === '*') { s += '[^/]*'; i++; }
    else if (g[i] === '?') { s += '[^/]'; i++; }
    else if (g[i] === '{' && g.indexOf('}', i) > i) { const e = g.indexOf('}', i); s += `(?:${g.slice(i + 1, e).split(',').map(esc).join('|')})`; i = e + 1; }
    else { s += esc(g[i]); i++; }
  }
  return new RegExp(`^${s}$`);
}

const cwdRel = (abs) => relative(process.cwd(), abs).split(sep).join('/');
function makeFileFilter(include, exclude) {
  const inc = include.map(globToRe), exc = exclude.map(globToRe);
  return (abs) => { const r = cwdRel(abs); return (!inc.length || inc.some((x) => x.test(r))) && !exc.some((x) => x.test(r)); };
}

function auditWeb(path, text, ctx, out) {
  const rel = ctx.rel(path); const ext = extname(path).toLowerCase(); const markup = WEB.has(ext);
  const F = (rule, sev, i, msg, ref) => out.push({ rule, sev, file: rel, line: lineOf(text, i), msg, ref, snippet: snippetAt(text, i) });
  for (const m of text.matchAll(/<meta[^>]+name=["']viewport["'][^>]*>/gi))
    if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(m[0])) F('WEB-ZOOM', 'blocker', m.index, 'Viewport blocks zoom', 'WCAG 1.4.4');
  for (const m of text.matchAll(/<html\b([^>]*)>/gi)) if (!/\blang\s*=/.test(m[1])) F('WEB-LANG', 'major', m.index, '<html> without lang', 'WCAG 3.1.1');
  if (CSS.has(ext) || text.includes('<style')) {
    // a :focus rule only counts when it draws something; `:focus{outline:none}` alone is the problem, not the fix
    const hasFocus = [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].some((r) => /:focus/.test(r[1]) &&
      /outline(?:-width|-style|-color)?\s*:(?!\s*(?:none|0)\b)|box-shadow\s*:(?!\s*none\b)|border(?:-\w+)?\s*:(?!\s*(?:none|0)\b)|background(?:-color)?\s*:|text-decoration\s*:(?!\s*none\b)/.test(r[2]));
    for (const m of text.matchAll(/outline\s*:\s*(none|0)\b/g))
      F('WEB-FOCUS', hasFocus ? 'minor' : 'blocker', m.index, hasFocus ? 'Outline removed; verify the :focus/:focus-visible style replaces it with ≥3:1' : 'Outline removed and no visible :focus/:focus-visible replacement in this file', 'WCAG 2.4.7');
    for (const m of text.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/g)) if (+m[1] < 12) F('WEB-FONT-SMALL', 'minor', m.index, `Text ${m[1]}px (<12px)`, 'Legibility');
    for (const m of text.matchAll(/z-index\s*:\s*(\d{4,})/g)) F('WEB-ZINDEX', 'minor', m.index, `z-index ${m[1]}: use layer tokens`, 'Visual system');
    if (!isTokenFile(path)) for (const m of text.matchAll(/(?:^|[;{\s])((?:background-)?color|border(?:-color)?|fill|stroke)\s*:\s*[^;}]*?(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\))/g))
      F('WEB-CSS-LITERAL', 'minor', m.index, `Literal color ${m[2]} in ${m[1]}: use a token/variable (verify contrast)`, 'literal-design-values');
  }
  if (!markup) return;
  const labelFor = new Set([...text.matchAll(/<label\b[^>]*?\b(?:for|htmlFor|:for)\s*=\s*["'{]([^"'}]+)/g)].map((m) => m[1]));
  for (const m of text.matchAll(/<button\b((?:[^>"']|"[^"]*"|'[^']*')*)>(\s*(?:<svg\b[\s\S]*?<\/svg>|<[A-Z]\w*(?:\s[^>]*)?\/>|<i\b[^>]*>\s*<\/i>|<span\b[^>]*class=["'][^"']*(?:icon|material-symbols)[^"']*["'][^>]*>[^<]{0,40}<\/span>)?\s*)<\/button>/g))
    if (!/aria-label|aria-labelledby|\btitle\s*=|ariaLabel/.test(m[1])) {
      const maybeNamed = SPREAD.test(m[1]) || /\b(?:title|aria-label|aria-labelledby)\s*=|<title\b/.test(m[2]);
      F('WEB-ICON-NAME', maybeNamed ? 'minor' : 'blocker', m.index, maybeNamed ? '<button> icon-only: verify the accessible name arriving through props or the icon' : '<button> empty or icon-only without aria-label', 'WCAG 4.1.2');
    }
  for (const m of text.matchAll(/<(button|a|[A-Z]\w*Button|div|span)\b[^>]*style\s*=\s*["']([^"']*)["'][^>]*>/g)) {
    const hw = [...m[2].matchAll(/(?:^|;|\s)(?:width|height)\s*:\s*(\d+(?:\.\d+)?)px/g)].map((x) => +x[1]);
    if (hw.length && Math.min(...hw) < 24 && (['button', 'a'].includes(m[1]) || m[1].endsWith('Button') || /onclick/i.test(m[0])))
      F('WEB-TARGET', 'blocker', m.index, `Target with inline style ${Math.min(...hw)}px (<24px)`, 'WCAG 2.5.8 / Fitts');
  }
  for (const m of text.matchAll(TAG)) {
    const tag = m[1], a = m[2], tl = tag.toLowerCase(); const cls = attr(a, 'className') || attr(a, 'class') || '';
    if (tl === 'img' || (tag === 'Image' && has(a, 'src'))) {
      if (!has(a, 'alt', ':alt', 'v-bind:alt', '[alt]')) F('WEB-IMG-ALT', SPREAD.test(a) ? 'minor' : 'blocker', m.index, SPREAD.test(a) ? `<${tag}> with spread props: verify alt is passed` : `<${tag}> without alt (use alt="" if decorative)`, 'WCAG 1.1.1');
      if (tl === 'img' && !(has(a, 'width') && has(a, 'height')) && !cls.includes('aspect-')) F('WEB-IMG-DIM', 'suggestion', m.index, '<img> without width/height: possible CLS', 'Core Web Vitals');
    }
    if (['div', 'span', 'li', 'td', 'tr', 'p', 'img', 'section', 'article', 'label'].includes(tl) &&
        has(a, 'onClick', 'onclick', '@click', 'v-on:click', '(click)', 'on:click', 'wire:click', 'x-on:click', '@click.prevent')) {
      if (!has(a, 'role') || !has(a, 'tabIndex', 'tabindex')) F('WEB-CLICK-DIV', 'blocker', m.index, `<${tag}> with click handler: no role/focus/keyboard. Use <button> or <a>`, 'WCAG 2.1.1 / 4.1.2');
      else if (!has(a, 'onKeyDown', 'onkeydown', '@keydown', '(keydown)', 'on:keydown', 'onKeyUp', '@keyup')) F('WEB-CLICK-DIV', 'major', m.index, `<${tag} role> without keyboard handler`, 'WCAG 2.1.1');
    }
    const tv = attr(a, 'tabIndex') || attr(a, 'tabindex');
    if (tv && /^\s*[1-9]\d*\s*$/.test(tv)) F('WEB-TABINDEX', 'major', m.index, `Positive tabindex (${tv.trim()})`, 'WCAG 2.4.3');
    if (/(^|\s)(focus:)?outline-none\b|(^|\s)focus:ring-0\b/.test(cls) && !/focus-visible:(ring|outline)-(?!none|0)|focus:ring-(?!0)|focus:outline-(?!none)/.test(cls))
      F('WEB-FOCUS-TW', ['button', 'a', 'input', 'select', 'textarea'].includes(tl) || INTERACTIVE.has(tag) ? 'blocker' : 'major', m.index, 'outline-none without focus-visible:ring/outline replacement', 'WCAG 2.4.7');
    const interactive = INTERACTIVE.has(tag) || INTERACTIVE.has(tl) || ['button', 'link', 'tab', 'checkbox', 'switch', 'menuitem'].includes(attr(a, 'role')) || has(a, 'onClick', '@click', '(click)', 'on:click');
    if (interactive && cls && tl !== 'a') {
      const tw = (p) => { const v = [...cls.matchAll(new RegExp(`(?:^|\\s)${p}-(\\d+(?:\\.5)?)\\b`, 'g'))].map((x) => TW[x[1]]).filter(Boolean); return v.length ? v[v.length - 1] : null; };
      const twMin = (p) => { const x = cls.match(new RegExp(`(?:^|\\s)min-${p}-\\[(\\d+(?:\\.\\d+)?)(px|rem)\\]`)); return x ? +x[1] * (x[2] === 'rem' ? 16 : 1) : tw(`min-${p}`); };
      // on each axis the rendered size is the larger of the fixed size and its min-* (a min-h-[44px] wins over h-5)
      const axis = (p) => { const fixed = tw(p) ?? tw('size'), min = twMin(p); return fixed == null && min == null ? null : Math.max(fixed ?? 0, min ?? 0); };
      const dims = [axis('h'), axis('w')].filter((x) => x != null);
      const pad = /(?:^|\s)(?:p|py|px|pt|pb)-(?:[2-9]|1[0-9])\b/.test(cls);
      if (dims.length && !pad && !/before:|after:/.test(cls)) {
        const s = Math.min(...dims);
        if (s < 24) F('WEB-TARGET', 'blocker', m.index, `Target ~${s}px (<24px)`, 'WCAG 2.5.8 / Fitts');
        else if (s < 44 && ctx.platform !== 'desktop') F('WEB-TARGET', ctx.platform === 'mobile' ? 'major' : 'suggestion', m.index, `Target ~${s}px: passes AA (24px) but below 44–48px touch`, ctx.platform === 'mobile' ? 'touch-target-platform' : 'touch-target-platform (only if used on touch devices)');
      }
    }
    if (tag === 'IconButton' || ((tl === 'button' || tag === 'Button') && /size\s*=\s*["']icon/.test(a)))
      if (!has(a, 'aria-label', 'aria-labelledby', 'title', 'ariaLabel', ':aria-label', '[attr.aria-label]'))
        F('WEB-ICON-NAME', SPREAD.test(a) ? 'minor' : 'major', m.index, `<${tag}> icon button without aria-label (verify sr-only text${SPREAD.test(a) ? ' or spread props' : ''})`, 'WCAG 4.1.2');
    if (['input', 'textarea', 'select'].includes(tl)) {
      const typ = (attr(a, 'type') || 'text').toLowerCase();
      if (!['hidden', 'submit', 'button', 'reset', 'image'].includes(typ)) {
        const idv = attr(a, 'id');
        const wrapped = text.lastIndexOf('<label', m.index) > text.lastIndexOf('</label>', m.index);
        if (!wrapped) {
          if (idv && !labelFor.has(idv) && !has(a, 'aria-label', 'aria-labelledby', 'title') && !['checkbox', 'radio'].includes(typ) && !idv.includes('{'))
            F('WEB-INPUT-LABEL', 'major', m.index, `Field id="${idv}" without <label for> in this file (verify if label is elsewhere)`, 'WCAG 1.3.1 / 3.3.2');
          else if (!has(a, 'id', 'aria-label', 'aria-labelledby', 'title', ':id', '[id]', 'v-bind:id')) {
            const ph = has(a, 'placeholder'), sp = SPREAD.test(a);
            F('WEB-INPUT-LABEL', sp ? 'minor' : ph ? 'blocker' : 'major', m.index, sp ? 'Field with spread props: verify it receives an id or aria-label and has a label' : 'Field without associated label' + (ph ? ' (placeholder used as label)' : ''), 'WCAG 1.3.1 / 3.3.2 / 4.1.2');
          }
        }
        const nm = `${attr(a, 'name') || ''} ${idv || ''}`.toLowerCase();
        if ((typ === 'email' || typ === 'tel' || /email|correo|phone|tel[eé]fono|celular|nombre|name|address|direcci/.test(nm)) && !has(a, 'autocomplete', 'autoComplete') && !['checkbox', 'radio'].includes(typ))
          F('WEB-AUTOCOMPLETE', 'minor', m.index, 'Personal-data field without autocomplete', 'WCAG 1.3.5');
        if (typ === 'checkbox' && has(a, 'checked', 'defaultChecked') && /newsletter|marketing|promo|ofertas|publicidad|consent|terms|t[eé]rminos|acepto|suscrib|seguro|insurance|donat/i.test(nm + ' ' + a))
          F('WEB-PRECHECKED', 'blocker', m.index, 'Pre-checked consent/marketing checkbox', 'dark-pattern · GDPR');
      }
    }
    if (['video', 'audio'].includes(tl) && has(a, 'autoplay', 'autoPlay')) F('WEB-AUTOPLAY', has(a, 'muted') ? 'minor' : 'major', m.index, 'Autoplay: must be pausable (and muted)', 'WCAG 1.4.2 / 2.2.2');
  }
  for (const m of text.matchAll(/>\s*(click aqu[ií]|clic aqu[ií]|aqu[ií]|here|click here|ver m[aá]s|leer m[aá]s|read more|more info)\s*<\/a/gi)) F('WEB-LINK-TEXT', 'minor', m.index, `Non-descriptive link text: "${m[1]}"`, 'WCAG 2.4.4');
  for (const m of text.matchAll(/(?:^|[\s"'`])z-\[(\d{4,})\]/g)) F('WEB-ZINDEX', 'minor', m.index, `z-[${m[1]}]: use layer tokens`, 'Visual system');
  for (const m of text.matchAll(/(?:^|[\s"'`])text-\[(\d+(?:\.\d+)?)px\]/g)) if (+m[1] < 12) F('WEB-FONT-SMALL', 'minor', m.index, `Text ${m[1]}px (<12px)`, 'Legibility');
  if (/react-native/.test(text)) {
    for (const m of text.matchAll(/allowFontScaling\s*=\s*\{\s*false\s*\}/g)) F('RN-NOSCALE', 'blocker', m.index, 'allowFontScaling={false} blocks system font size', 'WCAG 1.4.4');
    for (const m of text.matchAll(TAG)) if (/^(TouchableOpacity|Pressable|TouchableHighlight|TouchableWithoutFeedback)$/.test(m[1]) && !has(m[2], 'accessibilityRole', 'role'))
      F('RN-ROLE', 'minor', m.index, `<${m[1]}> without accessibilityRole`, 'WCAG 4.1.2');
  }
}

function inventory(path, text, inv, lines = null) {
  if (isTokenFile(path)) return;
  if (lines) text = text.split('\n').filter((_, i) => lines.has(i + 1)).join('\n');
  const bump = (k, v) => { inv[k][v] = (inv[k][v] || 0) + 1; };
  for (const h of text.match(/(?<![\w&])#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-zA-Z])/g) || []) bump('colors', h.toLowerCase());
  for (const h of text.match(/Color\(0x[0-9A-Fa-f]{8}\)/g) || []) bump('colors', h.slice(6, -1).toUpperCase());
  for (const m of text.matchAll(/(?:^|[\s"'`:])[a-z-]+-\[(-?\d+(?:\.\d+)?(?:px|rem|em)|#[0-9a-fA-F]{3,8})\]/g)) bump('tailwindArbitrary', m[1]);
  for (const m of text.matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?(?:px|rem|em))/g)) bump('fontSizes', m[1]);
  for (const m of text.matchAll(/(?:^|[\s"'`])text-\[(\d+(?:\.\d+)?(?:px|rem))\]/g)) bump('fontSizes', m[1]);
  for (const m of text.matchAll(/fontSize\s*[=:]\s*(\d+(?:\.\d+)?(?:\.sp|\.dp)?)/g)) bump('fontSizes', m[1]);
  for (const m of text.matchAll(/\.system\(\s*size:\s*(\d+)/g)) bump('fontSizes', m[1] + 'pt');
  inv.important += (text.match(/!important/g) || []).length;
  if (/prefers-reduced-motion|motion-reduce:|motion-safe:|useReducedMotion|reducedMotion|accessibilityReduceMotion|ANIMATOR_DURATION_SCALE|disableAnimations/.test(text)) inv.reducedMotion++;
  if (/@keyframes|\banimation\s*:|(?:^|[\s"'`])animate-(?!none)|<motion\.|framer-motion|gsap|animate\w*AsState|withAnimation|AnimationController/.test(text)) inv.animations.add(path);
}

function auditKotlin(path, text, ctx, out) {
  const rel = ctx.rel(path); const lines = text.split('\n');
  const F = (rule, sev, ln, msg, ref) => out.push({ rule, sev, file: rel, line: ln, msg, ref, snippet: (lines[ln - 1] || '').trim().slice(0, 160) });
  for (const m of text.matchAll(/LocalMinimumInteractiveComponent(?:Enforcement\s+provides\s+false|Size\s+provides\s+(?:0\.dp|Dp\.Unspecified))/g))
    F('CMP-MIN-TARGET-OFF', 'blocker', lineOf(text, m.index), 'Material minimum touch target (48dp) disabled', 'WCAG 2.5.8 / Material');
  for (const m of text.matchAll(/fontSize\s*=\s*\d+(?:\.\d+)?\.dp/g)) F('CMP-FONT-DP', 'major', lineOf(text, m.index), 'Text size in dp: ignores user font scale (use sp / typography)', 'WCAG 1.4.4');
  lines.forEach((ln, i0) => {
    const i = i0 + 1;
    for (const m of ln.matchAll(/\.(?:size|height|width|requiredSize)\((\d+(?:\.\d+)?)\.dp\)/g)) {
      const v = +m[1]; if (v >= 48) continue;
      // the size of an Icon/Image is not a touch target (an IconButton keeps its own 48dp) unless the Icon itself is clickable
      const call = enclosingCall(text, lines.slice(0, i0).join('\n').length + (i0 ? 1 : 0) + m.index);
      if (call === 'Icon' || call === 'Image') {
        let chain = ln.slice(m.index);
        for (let k = i0 + 1; k < lines.length && lines[k].trim().startsWith('.'); k++) chain += lines[k];
        if (!/\.(?:clickable|toggleable|selectable|combinedClickable)\b/.test(chain)) continue;
      }
      const w = lines.slice(Math.max(0, i - 4), i + 3).join('\n');
      if (/\.clickable|\.toggleable|\.selectable|onClick\s*=|IconButton|\.combinedClickable/.test(w) && !/minimumInteractiveComponentSize|\.padding\(/.test(w))
        F('CMP-TARGET', v < 24 ? 'blocker' : 'major', i, `Clickable element ${v}dp (<48dp) without minimumInteractiveComponentSize()`, 'touch-target-platform / Fitts');
    }
    if (/\.clickable\s*\{/.test(ln) && !/role|onClickLabel/.test(ln)) F('CMP-CLICK-ROLE', 'minor', i, '.clickable without role/onClickLabel', 'WCAG 4.1.2');
  });
  for (const m of text.matchAll(/IconButton\s*\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)\s*\{\s*Icon\s*\((?:[^()]|\([^()]*\))*contentDescription\s*=\s*null/gs))
    F('CMP-ICON-NAME', 'blocker', lineOf(text, m.index), 'IconButton whose Icon has contentDescription = null', 'WCAG 4.1.2');
}

function auditAndroidXml(path, text, ctx, out) {
  if (!/xmlns:android|android:/.test(text)) return;
  const rel = ctx.rel(path); const F = (rule, sev, i, msg, ref) => out.push({ rule, sev, file: rel, line: lineOf(text, i), msg, ref, snippet: snippetAt(text, i) });
  for (const m of text.matchAll(/android:textSize\s*=\s*"(\d+(?:\.\d+)?)(dp|px)"/g)) F('AND-TEXT-DP', 'major', m.index, `textSize in ${m[2]}: use sp`, 'WCAG 1.4.4');
  for (const m of text.matchAll(/<([\w.]+)\b([^>]*)\/?>/gs)) {
    const tag = m[1].split('.').pop(), a = m[2];
    const clickable = /^(ImageButton|Button|MaterialButton|CheckBox|RadioButton|Switch)$/.test(tag) || /android:clickable="true"|android:onClick/.test(a);
    if (!clickable) continue;
    if (/^(ImageButton|ImageView)$/.test(tag) && !a.includes('contentDescription')) F('AND-CONTENT-DESC', 'blocker', m.index, `Clickable ${tag} without contentDescription`, 'WCAG 1.1.1 / 4.1.2');
    const d = [...a.matchAll(/android:(?:layout_width|layout_height|minHeight|minWidth)\s*=\s*"(\d+)dp"/g)].map((x) => +x[1]).find((x) => x < 48);
    if (d != null) F('AND-TARGET', d < 24 ? 'blocker' : 'major', m.index, `Clickable ${tag} ${d}dp (<48dp)`, 'touch-target-platform / Fitts');
  }
}

function auditSwift(path, text, ctx, out) {
  const rel = ctx.rel(path); const lines = text.split('\n');
  const F = (rule, sev, ln, msg, ref) => out.push({ rule, sev, file: rel, line: ln, msg, ref, snippet: (lines[ln - 1] || '').trim().slice(0, 160) });
  lines.forEach((ln, i0) => {
    const i = i0 + 1;
    const m = ln.match(/\.frame\(\s*(?:min)?[wW]idth:\s*(\d+(?:\.\d+)?)\s*,\s*(?:min)?[hH]eight:\s*(\d+(?:\.\d+)?)/);
    if (m) { const v = Math.min(+m[1], +m[2]); const w = lines.slice(Math.max(0, i - 6), i + 3).join('\n');
      // padding only enlarges the tap area inside the Button's label; on the Button itself it does not
      const upTo = `${lines.slice(Math.max(0, i0 - 6), i0).join('\n')}\n${ln.slice(0, m.index)}`, btn = upTo.lastIndexOf('Button');
      const head = btn < 0 ? '' : upTo.slice(btn), inLabel = (head.match(/\{/g) || []).length > (head.match(/\}/g) || []).length;
      const paddedInLabel = inLabel && [ln.slice(m.index + m[0].length), ...lines.slice(i, i + 3)].join('\n').split('}')[0].includes('.padding');
      if (v < 44 && /Button\s*[({]|\.onTapGesture|Toggle\(|NavigationLink/.test(w) && !w.includes('contentShape') && !paddedInLabel)
        F('SWU-TARGET', v < 24 ? 'blocker' : 'major', i, `Control ${v}pt (<44pt): no contentShape or padding inside the label`, 'touch-target-platform / HIG'); }
    if (ln.includes('.onTapGesture') && !lines.slice(Math.max(0, i - 3), i + 3).join('\n').includes('accessibilityAddTraits'))
      F('SWU-TAP-GESTURE', 'minor', i, 'onTapGesture instead of Button: not announced as a button', 'WCAG 4.1.2');
    if (/\.font\(\s*\.system\(\s*size:/.test(ln) && !ln.includes('relativeTo')) F('SWU-FIXED-FONT', 'major', i, 'Fixed font size: ignores Dynamic Type', 'WCAG 1.4.4');
    if (/Font\.custom\([^)]*size:/.test(ln) && !ln.includes('relativeTo')) F('SWU-FIXED-FONT', 'major', i, 'Font.custom without relativeTo: ignores Dynamic Type', 'WCAG 1.4.4');
    if (/\.glassEffect\(|\.ultraThinMaterial|\.thinMaterial/.test(ln) && !text.includes('accessibilityReduceTransparency'))
      F('SWU-GLASS', 'minor', i, 'Translucent material: verify contrast and honor Reduce Transparency', 'WCAG 1.4.3 / Liquid Glass');
  });
  const IMG = String.raw`Image\(systemName:[^)]*\)(?:\s*\.\w+(?:\((?:[^()]|\([^()]*\))*\))?)*`;
  const ARGS = String.raw`\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)`, BODY = String.raw`(?:[^{}]|\{[^{}]*\})*`;
  // Button(action: …) { Image } and Button { … } label: { Image }
  for (const m of text.matchAll(new RegExp(String.raw`\bButton\s*(?:${ARGS}\s*\{\s*${IMG}\s*\}|(?:${ARGS}\s*)?\{${BODY}\}\s*label:\s*\{\s*${IMG}\s*\})`, 'gs')))
    if (!m[0].includes('accessibilityLabel') && !text.slice(m.index + m[0].length, m.index + m[0].length + 250).includes('accessibilityLabel'))
      F('SWU-ICON-NAME', 'major', lineOf(text, m.index), 'SF Symbol-only button without accessibilityLabel', 'WCAG 4.1.2');
}

function auditDart(path, text, ctx, out) {
  const rel = ctx.rel(path); const lines = text.split('\n');
  const F = (rule, sev, ln, msg, ref) => out.push({ rule, sev, file: rel, line: ln, msg, ref, snippet: (lines[ln - 1] || '').trim().slice(0, 160) });
  for (const [rx, rule, sev, msg, ref] of [
    [/MaterialTapTargetSize\.shrinkWrap/g, 'FLT-SHRINK', 'major', 'shrinkWrap reduces touch area below 48dp', 'touch-target-platform'],
    [/TextScaler\.noScaling|textScaleFactor\s*:\s*1(?:\.0)?\b|TextScaler\.linear\(\s*1(?:\.0)?\s*\)/g, 'FLT-NOSCALE', 'blocker', 'System text scaling blocked', 'WCAG 1.4.4'],
  ]) for (const m of text.matchAll(rx)) F(rule, sev, lineOf(text, m.index), msg, ref);
  lines.forEach((ln, i0) => { const i = i0 + 1;
    if (/\bIconButton\s*\(/.test(ln) && !/tooltip:|semanticLabel/.test(lines.slice(i0, i0 + 10).join('\n'))) F('FLT-ICON-NAME', 'major', i, 'IconButton without tooltip or semanticLabel', 'WCAG 4.1.2');
    if (/\bGestureDetector\s*\(/.test(ln) && !lines.slice(Math.max(0, i - 3), i + 3).join('\n').includes('Semantics')) F('FLT-GESTURE', 'minor', i, 'GestureDetector without Semantics', 'WCAG 4.1.2');
  });
}

function auditXaml(path, text, ctx, out) {
  const rel = ctx.rel(path);
  for (const m of text.matchAll(/<(Button|AppBarButton|ToggleButton|ImageButton)\b([^>]*)>/gs)) {
    const a = m[2];
    let named = /Content=|AutomationProperties\.Name|SemanticProperties\.Description|Label=|Text=/.test(a);
    if (!named && !a.trimEnd().endsWith('/')) { // <Button>Save</Button> or a child <TextBlock Text="Save"/>
      const from = m.index + m[0].length, end = text.indexOf(`</${m[1]}>`, from), inner = end === -1 ? '' : text.slice(from, end);
      named = inner.replace(/<[^>]*>/g, '').trim() !== '' || /\bText\s*=\s*"[^"]+"/.test(inner);
    }
    if (!named)
      out.push({ rule: 'XAML-NAME', sev: 'major', file: rel, line: lineOf(text, m.index), msg: `${m[1]} without Content/Label/AutomationProperties.Name (verify content)`, ref: 'WCAG 4.1.2', snippet: snippetAt(text, m.index) });
    for (const v of a.matchAll(/(?:MinHeight|Height|MinimumHeightRequest|HeightRequest)\s*=\s*"(\d+)"/g)) if (+v[1] < 24)
      out.push({ rule: 'XAML-TARGET', sev: 'blocker', file: rel, line: lineOf(text, m.index), msg: `${m[1]} ${v[1]} (<24)`, ref: 'WCAG 2.5.8', snippet: snippetAt(text, m.index) });
  }
}

function auditQml(path, text, ctx, out) {
  for (const m of text.matchAll(/\b(MouseArea|TapHandler)\s*\{/g)) if (!text.slice(m.index, m.index + 600).includes('Accessible.'))
    out.push({ rule: 'QML-ACCESSIBLE', sev: 'minor', file: ctx.rel(path), line: lineOf(text, m.index), msg: `${m[1]} without Accessible.role/name`, ref: 'WCAG 4.1.2', snippet: snippetAt(text, m.index) });
}

function auditJava(path, text, ctx, out) {
  if (!/javax\.swing|javafx\./.test(text)) return;
  const rel = ctx.rel(path); const F = (rule, sev, i, msg, ref) => out.push({ rule, sev, file: rel, line: lineOf(text, i), msg, ref, snippet: snippetAt(text, i) });
  for (const m of text.matchAll(/new\s+JButton\s*\(\s*new\s+ImageIcon/g)) if (!/setAccessibleName|setToolTipText/.test(text)) F('JAVA-ICON-NAME', 'major', m.index, 'Icon-only JButton without accessible name/tooltip in this file', 'WCAG 4.1.2');
  for (const m of text.matchAll(/new\s+(?:java\.awt\.)?Dimension\(\s*(\d+)\s*,\s*(\d+)\s*\)/g)) if (Math.min(+m[1], +m[2]) < 24) F('JAVA-TARGET', 'major', m.index, `Component size ${m[1]}×${m[2]} (<24): verify if interactive`, 'WCAG 2.5.8');
  for (const m of text.matchAll(/new\s+(?:java\.awt\.)?Color\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g)) if (!isTokenFile(path)) F('JAVA-COLOR-LITERAL', 'minor', m.index, 'Literal Color in UI code: use L&F/theme', 'literal-design-values');
}

const SKIP_FILE = /\.(min\.js|min\.css|map|d\.ts|lock)$/;

function walk(roots) {
  const out = [];
  for (const r of roots) {
    if (!existsSync(r)) continue;
    if (statSync(r).isFile()) { out.push(r); continue; }
    // in a git repository, list the folder through git so .gitignore applies (tracked + untracked, not ignored)
    const top = gitTop(r);
    const listed = top && git(['ls-files', '--cached', '--others', '--exclude-standard', '--full-name', '-z', '--', '.'], r);
    if (listed != null) {
      for (const f of nulList(listed)) {
        const p = join(top, f), parts = relative(r, p).split(sep);
        if (parts.slice(0, -1).some((s) => SKIP.has(s) || s.startsWith('.')) || SKIP_FILE.test(parts.at(-1)) || !existsSync(p)) continue;
        out.push(p);
      }
      continue;
    }
    const st = [r];
    while (st.length) { const d = st.pop(); let ents; try { ents = readdirSync(d, { withFileTypes: true }); } catch { continue; }
      for (const e of ents) { const p = join(d, e.name);
        if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith('.')) st.push(p); }
        else if (!SKIP_FILE.test(e.name)) out.push(p); } }
  }
  return out;
}

const git = (args, cwd) => { try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }); } catch { return null; } };
const gitTop = (cwd) => (git(['rev-parse', '--show-toplevel'], cwd) || '').trim() || null;
const nulList = (s) => (s || '').split('\0').filter(Boolean); // -z output: names are never quoted (accents, spaces…)
const UNTRACKED = ['ls-files', '--others', '--exclude-standard', '--full-name', '-z'];

export function changedLines(ref = 'HEAD', cwd = '.') {
  // map absolute file -> Set of changed line numbers (null = whole file is new/untracked)
  const top = gitTop(cwd); if (!top) return null;
  const map = new Map(); let cur = null;
  const diff = git(['-c', 'core.quotePath=false', 'diff', '--no-color', '--no-ext-diff', '--src-prefix=a/', '--dst-prefix=b/', '-U0', ref], top);
  for (const line of (diff || '').split('\n')) {
    if (line.startsWith('+++ ')) { const f = line.slice(4).replace(/\t$/, '').replace(/^"(.*)"$/, '$1').replace(/^b\//, ''); cur = f === '/dev/null' ? null : join(top, f); if (cur && !map.has(cur)) map.set(cur, new Set()); }
    else if (cur && line.startsWith('@@')) { const m = line.match(/\+(\d+)(?:,(\d+))?/); const a = +m[1], n = m[2] == null ? 1 : +m[2]; for (let i = a; i < a + n; i++) map.get(cur).add(i); }
  }
  for (const f of nulList(git(UNTRACKED, top))) map.set(join(top, f), null);
  return map;
}

export function changedFiles(ref = 'HEAD', cwd = '.') {
  const top = gitTop(cwd); if (!top) return null;
  const files = new Set([...nulList(git(['diff', '--name-only', '-z', ref], top)), ...nulList(git(UNTRACKED, top))]);
  return [...files].filter((f) => VISUAL.has(extname(f).toLowerCase()) && !f.split('/').some((s) => SKIP.has(s)))
    .map((f) => join(top, f)).filter((f) => existsSync(f));
}

export function run(paths, { platform = 'auto', maxPerRule = 8, lineFilter = null, fileFilter = null, includeVendor = false, explicit = null } = {}) {
  const roots = paths.map((p) => resolve(p));
  // files the user named are always scanned; files found by walking a folder skip third-party libraries
  const named = explicit ?? new Set(roots.filter((r) => existsSync(r) && statSync(r).isFile()));
  const thirdParty = [];
  let base = roots.length === 1 ? roots[0] : roots.reduce((a, b) => { while (!b.startsWith(a)) a = dirname(a); return a; });
  if (existsSync(base) && statSync(base).isFile()) base = dirname(base);
  const cwd = process.cwd();
  if (roots.every((r) => r === cwd || r.startsWith(cwd + '/') || r.startsWith(cwd + '\\'))) base = cwd; // stable repo-relative paths
  const ctx = { rel: (p) => (relative(base, p) || basename(p)).split(sep).join('/'), platform };
  const findings = []; const inv = { colors: {}, fontSizes: {}, tailwindArbitrary: {}, important: 0, reducedMotion: 0, animations: new Set() };
  let n = 0;
  for (const p of walk(roots)) {
    if (fileFilter && !fileFilter(p)) continue;
    let ext = extname(p).toLowerCase(); if (p.endsWith('.blade.php')) ext = '.php';
    if (!(WEB.has(ext) || CSS.has(ext) || OTHER.has(ext))) continue;
    let text; try { if (statSync(p).size > 1_500_000) continue; text = readFileSync(p, 'utf8'); } catch { continue; }
    if (!includeVendor && !named.has(p)) {
      const why = thirdPartyReason(ctx.rel(p), text);
      if (why) { thirdParty.push({ file: ctx.rel(p), reason: why }); continue; }
    }
    n++;
    if (WEB.has(ext) || CSS.has(ext)) auditWeb(p, text, ctx, findings);
    else if (ext === '.kt') auditKotlin(p, text, ctx, findings);
    else if (ext === '.xml') auditAndroidXml(p, text, ctx, findings);
    else if (ext === '.swift') auditSwift(p, text, ctx, findings);
    else if (ext === '.dart') auditDart(p, text, ctx, findings);
    else if (ext === '.xaml' || ext === '.axaml') auditXaml(p, text, ctx, findings);
    else if (ext === '.qml') auditQml(p, text, ctx, findings);
    else if (ext === '.java') auditJava(p, text, ctx, findings);
    inventory(p, text, inv, lineFilter ? lineFilter.get(p) ?? undefined : null);
  }
  let preexisting = 0;
  if (lineFilter) {
    const byRel = new Map([...lineFilter].map(([abs, set]) => [ctx.rel(abs), set]));
    for (let i = findings.length - 1; i >= 0; i--) {
      const f = findings[i]; if (!byRel.has(f.file)) continue; const set = byRel.get(f.file);
      if (set && !set.has(f.line)) { findings.splice(i, 1); preexisting++; }
    }
  }
  if (inv.animations.size && !inv.reducedMotion)
    findings.push({ rule: 'PRJ-REDUCED-MOTION', sev: 'major', file: ctx.rel([...inv.animations][0]), line: 0, msg: `Animations in ${inv.animations.size} file(s) and no reduced-motion handling found`, ref: 'reduced-motion', snippet: '' });
  if (Object.keys(inv.colors).length > 15) findings.push({ rule: 'PRJ-PALETTE', sev: 'minor', file: '(project)', line: 0, msg: `${Object.keys(inv.colors).length} distinct literal colors outside token/theme files`, ref: 'literal-design-values', snippet: '' });
  if (Object.keys(inv.fontSizes).length > 8) findings.push({ rule: 'PRJ-TYPE-SCALE', sev: 'minor', file: '(project)', line: 0, msg: `${Object.keys(inv.fontSizes).length} distinct literal font sizes`, ref: 'type-scale', snippet: '' });
  const groups = new Map();
  for (const f of findings) { const k = f.rule + '|' + f.file; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(f); }
  const kept = [], omitted = [];
  for (const [k, fs] of groups) { fs.sort((a, b) => a.line - b.line); kept.push(...fs.slice(0, maxPerRule));
    if (fs.length > maxPerRule) omitted.push({ rule: fs[0].rule, file: fs[0].file, omitted: fs.length - maxPerRule }); }
  kept.sort((a, b) => SEV[a.sev] - SEV[b.sev] || a.file.localeCompare(b.file) || a.line - b.line);
  const top = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 40));
  const counts = Object.fromEntries(Object.keys(SEV).map((s) => [s, findings.filter((f) => f.sev === s).length]));
  return { filesScanned: n, counts, preexistingNotShown: preexisting, thirdPartySkipped: thirdParty, findings: kept, omittedByCap: omitted,
    inventory: { colors: top(inv.colors), fontSizes: top(inv.fontSizes), tailwindArbitrary: top(inv.tailwindArbitrary), important: inv.important } };
}

function toMd(r) {
  const c = r.counts; const out = ['# Static scan (candidates to confirm)', '',
    `Files scanned: ${r.filesScanned} · ❌ ${c.blocker} · 🟠 ${c.major} · 🟡 ${c.minor} · 💡 ${c.suggestion}` +
    (r.preexistingNotShown ? ` · ${r.preexistingNotShown} pre-existing finding(s) on unchanged lines not shown (use --all-lines)` : '')];
  if (r.thirdPartySkipped.length) out.push('', `Skipped ${r.thirdPartySkipped.length} third-party file(s) (use --include-vendor to scan them): ` +
    r.thirdPartySkipped.slice(0, 10).map((t) => `\`${t.file}\` (${t.reason})`).join(', ') + (r.thirdPartySkipped.length > 10 ? ', …' : ''));
  let cur = null;
  for (const f of r.findings) {
    if (f.sev !== cur) { cur = f.sev; out.push('', `## ${ICON[cur]} ${cur}`, ''); }
    out.push(`- **[${f.rule}]** \`${f.line ? `${f.file}:${f.line}` : f.file}\` — ${f.msg} _(ref: ${f.ref})_`);
    if (f.snippet) out.push(`  \`${f.snippet}\``);
  }
  if (r.omittedByCap.length) { out.push('', '### Omitted by cap (same pattern repeated)'); for (const o of r.omittedByCap) out.push(`- ${o.rule} in \`${o.file}\`: +${o.omitted} more`); }
  const inv = r.inventory; const fmt = (o) => Object.entries(o).slice(0, 15).map(([v, n]) => `${v} ×${n}`).join(', ');
  out.push('', '## Visual-system inventory',
    `- Literal colors outside tokens: ${Object.keys(inv.colors).length}${Object.keys(inv.colors).length ? ' — ' + fmt(inv.colors) : ''}`,
    `- Literal font sizes: ${Object.keys(inv.fontSizes).length}${Object.keys(inv.fontSizes).length ? ' — ' + fmt(inv.fontSizes) : ''}`,
    `- Tailwind arbitrary values: ${Object.keys(inv.tailwindArbitrary).length}${Object.keys(inv.tailwindArbitrary).length ? ' — ' + fmt(inv.tailwindArbitrary) : ''}`,
    `- !important: ${inv.important}`);
  return out.join('\n');
}

function main(argv) {
  let json = false, platform = 'auto', failOn = null, max = 8, changed = null, changedArg = null, listOnly = false, allLines = false, includeVendor = false;
  const paths = [], include = [], exclude = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a === '--platform') platform = argv[++i];
    else if (a === '--fail-on') failOn = argv[++i];
    else if (a === '--max-per-rule') max = +argv[++i];
    else if (a === '--all-lines') allLines = true;
    else if (a === '--include-vendor') includeVendor = true;
    else if (a === '--include') include.push(argv[++i]);
    else if (a === '--exclude') exclude.push(argv[++i]);
    else if (a === '--changed' || a === '--list-changed') { listOnly = a === '--list-changed'; changed = 'HEAD'; if (argv[i + 1] && !argv[i + 1].startsWith('--')) changedArg = argv[++i]; }
    else paths.push(a);
  }
  const fileFilter = include.length || exclude.length ? makeFileFilter(include, exclude) : null;
  let lineFilter = null;
  if (changed) {
    const anchor = [...paths, changedArg].find((p) => p && existsSync(p));
    const cwd = !anchor ? '.' : statSync(anchor).isDirectory() ? anchor : dirname(anchor);
    if (changedArg) {
      const isRef = git(['rev-parse', '--verify', '--quiet', `${changedArg}^{commit}`], cwd) != null, isPath = existsSync(changedArg);
      if (isRef && isPath) { console.error(`"${changedArg}" is both a git ref and a path: write ./${changedArg} for the path or refs/heads/${changedArg} for the ref.`); return 2; }
      if (isRef) changed = changedArg;
      else if (isPath) paths.unshift(changedArg);
      else { console.error(`"${changedArg}" is neither a git ref nor an existing path.`); return 2; }
    }
    const missing = paths.find((p) => !existsSync(p));
    if (missing) { console.error(`Path not found: ${missing}`); return 2; }
    const scope = paths.map((p) => realpathSync.native(resolve(p)));
    const all = changedFiles(changed, cwd);
    if (all == null) { console.error('Not a git repository: pass the files to review explicitly.'); return 2; }
    const files = all.filter((f) => (!scope.length || scope.some((s) => f === s || f.startsWith(s + sep))) && (!fileFilter || fileFilter(f)));
    if (listOnly) { if (files.length) console.log(files.map(cwdRel).join('\n')); return 0; }
    if (!files.length) { console.log('No changed visual files.'); return 0; }
    if (!allLines) lineFilter = changedLines(changed, cwd);
    paths.splice(0, paths.length, ...files);
  }
  if (!paths.length) { console.error('usage: node scan.mjs <paths...> [--json] [--platform web|mobile|desktop] [--fail-on blocker|major] [--include glob] [--exclude glob] [--include-vendor] | --changed [ref] [paths...] | --list-changed [ref] [paths...]'); return 2; }
  // in --changed mode the files come from git, not from the user: third-party ones are still skipped
  const r = run(paths, { platform, maxPerRule: max, lineFilter, fileFilter, includeVendor, explicit: changed ? new Set() : null });
  console.log(json ? JSON.stringify(r, null, 2) : toMd(r));
  if (failOn && Object.entries(r.counts).some(([s, n]) => SEV[s] <= SEV[failOn] && n)) return 1;
  return 0;
}
if (isMain(import.meta.url)) process.exitCode = main(process.argv.slice(2));
