// Run from anywhere: node --test tests/scripts.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../skills/ux-init/assets/scripts/scan.mjs';
import { detect } from '../skills/ux-init/assets/scripts/detect.mjs';
import { check } from '../skills/ux-init/assets/scripts/tokens.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPTS = join(ROOT, 'skills', 'ux-init', 'assets', 'scripts');
process.chdir(ROOT);

const summary = (r) => r.findings.map((f) => `${f.sev} ${f.rule} ${f.file}:${f.line}`).sort();
const cli = (script, args, cwd) => {
  const r = spawnSync(process.execPath, [join(SCRIPTS, script), ...args], { cwd, encoding: 'utf8' });
  return { code: r.status, out: r.stdout.trim(), err: r.stderr.trim() };
};

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'ux-kit-'));
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

function write(dir, file, text) {
  mkdirSync(dirname(join(dir, file)), { recursive: true });
  writeFileSync(join(dir, file), text);
}

function withRepo(fn) {
  return withTempDir((dir) => {
    const git = (...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.autocrlf=false', ...args], { cwd: dir, stdio: 'pipe', encoding: 'utf8' });
    git('init', '-q');
    write(dir, 'README', 'x\n');
    git('add', '.');
    git('commit', '-qm', 'init');
    return fn(dir, git);
  });
}

const IMG = '<img src="a">\n';

test('scan: seeded monorepo keeps its expected findings', () => {
  const expected = JSON.parse(readFileSync(join(ROOT, 'tests', 'expected', 'monorepo-scan.json'), 'utf8'));
  assert.deepEqual(summary(run(['tests/fixtures/monorepo'], { platform: 'mobile' })), expected);
});

test('scan: clean code produces no findings', () => {
  assert.deepEqual(summary(run(['tests/fixtures/clean'], { platform: 'mobile' })), []);
});

test('scan: regression cases', () => {
  const dir = 'tests/fixtures/regressions';
  assert.deepEqual(summary(run([dir], { platform: 'mobile' })), [
    `blocker CMP-ICON-NAME ${dir}/Cases.kt:3`,
    `blocker SWU-TARGET ${dir}/Cases.swift:12`,
    `blocker WEB-FOCUS ${dir}/focus-only.css:1`,
    `blocker WEB-TARGET ${dir}/cases.tsx:6`,
    `major CMP-TARGET ${dir}/Cases.kt:4`,
    `major SWU-ICON-NAME ${dir}/Cases.swift:3`,
    `major SWU-ICON-NAME ${dir}/Cases.swift:4`,
    `major XAML-NAME ${dir}/Cases.xaml:1`,
    `minor CMP-CLICK-ROLE ${dir}/Cases.kt:4`,
    `minor WEB-FOCUS ${dir}/focus-replaced.css:1`,
    `minor WEB-ICON-NAME ${dir}/cases.tsx:3`,
    `minor WEB-ICON-NAME ${dir}/cases.tsx:4`,
    `minor WEB-IMG-ALT ${dir}/cases.tsx:2`,
    `minor WEB-INPUT-LABEL ${dir}/cases.tsx:5`,
  ].sort());
});

test('detect: "." sees the files of the root app', () => {
  const r = JSON.parse(cli('detect.mjs', ['.'], join(ROOT, 'tests', 'fixtures', 'monorepo', 'android')).out);
  assert.equal(r.apps[0].name, 'android');
  assert.equal(r.apps[0].stack, 'jetpack-compose + android-views + material3');
});

test('detect: paths use "/" and the root app has a real name', () => {
  withTempDir((dir) => {
    write(dir, 'package.json', '{"dependencies":{"react":"^18.0.0"}}');
    write(dir, 'src/styles/theme.css', ':root{}');
    const r = JSON.parse(cli('detect.mjs', ['.'], dir).out);
    assert.equal(r.apps[0].name, basename(dir));
    assert.equal(r.apps[0].path, '.');
    assert.deepEqual(r.apps[0].themeCandidates, ['src/styles/theme.css']);
  });
  const paths = detect('tests/fixtures/monorepo').apps.map((a) => a.path);
  assert.deepEqual(paths, ['android', 'desktop-java', 'flutter', 'ios', 'web']);
});

test('detect: barrels are not theme candidates', () => {
  withTempDir((dir) => {
    write(dir, 'package.json', '{"dependencies":{"react":"^18.0.0"}}');
    write(dir, 'src/services/index.ts', 'export * from "./a";');
    write(dir, 'src/app.css', 'body{margin:0}');
    write(dir, 'src/index.css', ':root{--brand:#000}');
    write(dir, 'src/theme/index.ts', 'export const brand = "#000";');
    const [app] = detect(dir).apps;
    assert.deepEqual(app.themeCandidates, ['src/index.css', 'src/theme/index.ts']);
    assert.equal(app.themeReasons['src/index.css'], 'defines CSS variables');
    assert.equal(app.themeReasons['src/theme/index.ts'], 'theme folder');
  });
});

test('detect: the strongest theme candidates survive the limit', () => {
  withTempDir((dir) => {
    write(dir, 'package.json', '{"dependencies":{"react":"^18.0.0"}}');
    for (let i = 0; i < 20; i++) write(dir, `src/a${i}/colors.ts`, 'export const c = 1;');
    write(dir, 'src/z/globals.css', '@theme { --color-a: #000; }');
    write(dir, 'tailwind.config.ts', 'export default {};');
    const { themeCandidates } = detect(dir).apps[0];
    assert.equal(themeCandidates.length, 15);
    assert.deepEqual(themeCandidates.slice(0, 2), ['tailwind.config.ts', 'src/z/globals.css']);
  });
});

test('scripts: run when started through a linked folder', () => {
  withTempDir((dir) => {
    const link = join(dir, 'linked');
    symlinkSync(SCRIPTS, link, 'junction');
    for (const [script, args] of [['detect.mjs', ['--help']], ['scan.mjs', ['missing']], ['tokens.mjs', []], ['contrast.mjs', []], ['render.mjs', []]]) {
      const r = spawnSync(process.execPath, [join(link, script), ...args], { cwd: dir, encoding: 'utf8' });
      assert.ok(`${r.stdout}${r.stderr}`.trim(), `${script} printed nothing`);
    }
  });
});

test('skills: frontmatter values that need quotes have them', () => {
  const skills = readdirSync(join(ROOT, 'skills'));
  assert.ok(skills.includes('ux-check'));
  for (const skill of skills) {
    const text = readFileSync(join(ROOT, 'skills', skill, 'SKILL.md'), 'utf8');
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
    assert.match(frontmatter, new RegExp(`^name: ${skill}\\s*$`, 'm'));
    for (const line of frontmatter.split(/\r?\n/)) {
      const value = line.match(/^\s*[\w-]+:\s+(.*)$/)?.[1];
      if (value && !/^["'>|]/.test(value)) assert.doesNotMatch(value, /:\s|\s#/, `${skill}: ${line.slice(0, 40)}`);
    }
  }
});

test('detect: project folders make a monorepo and projects without UI are explained', () => {
  withTempDir((dir) => {
    write(dir, 'package.json', '{"devDependencies":{"husky":"^9.0.0"}}');
    write(dir, 'apps/shop/package.json', '{"dependencies":{"next":"16.0.0","react":"19.0.0"}}');
    write(dir, 'apps/admin/package.json', '{"name":"admin"}');
    write(dir, 'services/api/package.json', '{"dependencies":{"express":"^5.0.0"}}');
    write(dir, 'services/bad/package.json', '{nope');
    const r = detect(dir);
    assert.equal(r.monorepo, true);
    assert.deepEqual(r.apps.map((a) => a.path), ['apps/shop']);
    assert.deepEqual(r.projectsWithoutUi.map((p) => [p.path, p.reason]), [
      ['apps/admin', 'package.json has no dependencies'],
      ['services/api', 'no UI stack found in package.json and no pages'],
      ['services/bad', 'invalid package.json'],
    ]);
    assert.match(cli('detect.mjs', ['.', '--md'], dir).out, /Without UI[\s\S]*`apps\/admin` — package\.json has no dependencies/);
  });
});

test('detect: one UI app alone is not a monorepo', () => {
  withTempDir((dir) => {
    write(dir, 'package.json', '{"dependencies":{"react":"^18.0.0"}}');
    const r = detect(dir);
    assert.equal(r.monorepo, false);
    assert.deepEqual(r.projectsWithoutUi, []);
  });
});

const tokensFile = (dir, data) => { write(dir, 'tokens.json', JSON.stringify(data)); return join(dir, 'tokens.json'); };
const colorGroup = (values) => ({ color: { $type: 'color', ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { $value: v }])) } });
const pairsOf = (...pairs) => ({ 'ux-kit.contrast-pairs': pairs });

test('tokens: a removed mode is a note, a typo stays major', () => {
  withTempDir((dir) => {
    const file = tokensFile(dir, { semantic: { light: colorGroup({ text: '#000000', bg: '#ffffff' }) }, $extensions: pairsOf(
      { fg: 'semantic.dark.color.text', bg: 'semantic.dark.color.bg', min: 4.5 },
      { fg: 'semantic.light.color.txt', bg: 'semantic.light.color.bg', min: 4.5 }) });
    assert.deepEqual(check(file).issues.map((i) => i.sev), ['suggestion', 'major']);
  });
});

test('tokens: --suggest prints the nearest passing value next to the failure', () => {
  withTempDir((dir) => {
    const file = tokensFile(dir, { c: colorGroup({ fg: '#999999', bg: '#ffffff' }), $extensions: pairsOf({ fg: 'c.color.fg', bg: 'c.color.bg', min: 4.5 }) });
    assert.doesNotMatch(check(file).issues[0].msg, /nearest passing/);
    assert.match(check(file, 4, { withSuggestions: true }).issues[0].msg, /nearest passing: darker #[0-9a-f]{6} \(4\.\d+:1\)/);
    assert.match(cli('tokens.mjs', ['tokens.json', '--suggest'], dir).out, /nearest passing: darker/);
  });
});

test('tokens: status by section is reported and validated', () => {
  withTempDir((dir) => {
    const file = tokensFile(dir, { primitive: colorGroup({ a: '#000000' }), $extensions: {
      'ux-kit.status': 'extracted', 'ux-kit.status-by-section': { 'primitive.color': 'placeholder', 'primitive.space': 'wrong' } } });
    const r = check(file);
    assert.equal(r.info.sectionStatus['primitive.color'], 'placeholder');
    assert.deepEqual(r.issues.map((i) => i.msg), ['unknown status: wrong', 'status set for a section with no tokens']);
  });
});

test('tokens: translucent colors are composited over the pair background', () => {
  withTempDir((dir) => {
    const black = (alpha) => ({ colorSpace: 'srgb', components: [0, 0, 0], alpha, hex: '#000000' });
    const file = tokensFile(dir, { c: { color: { $type: 'color', fg: { $value: black(0.5) }, tint: { $value: black(0.5) }, solid: { $value: '#000000' }, bg: { $value: '#ffffff' } } },
      $extensions: pairsOf({ fg: 'c.color.fg', bg: 'c.color.bg', min: 1 }, { fg: 'c.color.bg', bg: 'c.color.tint', min: 1 }, { fg: 'c.color.bg', bg: 'c.color.tint', over: 'c.color.solid', min: 1 }) });
    const [fg, tint, over] = check(file).info.contrast.map((p) => p.ratio);
    assert.equal(fg, 3.98); // 50% black over white, not solid black
    assert.equal(tint, 3.98);
    assert.equal(over, 21);
    const faint = tokensFile(dir, { c: { color: { $type: 'color', fg: { $value: black(0.08) }, bg: { $value: '#ffffff' } } }, $extensions: pairsOf({ fg: 'c.color.fg', bg: 'c.color.bg', min: 3 }) });
    const { msg } = check(faint, 4, { withSuggestions: true }).issues[0];
    assert.match(msg, /nearest passing: darker #[89][0-9a-f]{5} \(3\.\d+:1\)$/);
  });
});

const TAILWIND = `import type { Config } from 'tailwindcss';
import colors from 'tailwindcss/colors';
globalThis.projectCodeRan = process.exit(9);
const brand = { DEFAULT: '#e63f6e', dark: '#c7305a' } as const;
const shared = { info: '#0284c7' };
const config: Config = {
  // theme: { colors: { wrong: '#000' } },
  content: ['./src/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        brand,
        ...shared,
        /* comment with 'quote */
        bg: { DEFAULT: '#fff9fb' },
        surface: { DEFAULT: '#ffffff' },
        border: { DEFAULT: 'rgba(30, 22, 28, 0.08)' },
        text: { primary: '#24151c', muted: '#8a7a84', inverse: '#ffffff' },
        danger: colors.red[600],
        accent: 'var(--accent)',
      },
      borderRadius: { sm: '6px', md: '0.75rem' },
      transitionDuration: { fast: '150ms', slow: '0.4s' },
      fontFamily: { sans: ['var(--font-inter)', 'Inter', 'sans-serif'] },
      fontSize: { sm: ['0.875rem', { lineHeight: '1.25rem' }] },
      spacing: { 18: '4.5rem', '0.5': '2px' },
    },
  },
} satisfies Config;
export default config;
`;

test('tokens --from-tailwind: reads the config without running it', () => {
  withTempDir((dir) => {
    write(dir, 'tailwind.config.ts', TAILWIND);
    const r = cli('tokens.mjs', ['--from-tailwind', 'tailwind.config.ts'], dir);
    assert.equal(r.code, 0, r.err);
    assert.match(r.err, /Not readable without running code: .*colors\.danger.*colors\.accent/);
    const t = JSON.parse(r.out);
    const { color, radius, duration, space } = t.primitive;
    assert.equal(color.brand.$value, '#e63f6e');
    assert.equal(color['brand-dark'].$value, '#c7305a');
    assert.equal(color.info.$value, '#0284c7');
    assert.equal(color.wrong, undefined);
    assert.deepEqual(color.border.$value, { colorSpace: 'srgb', components: [0.1176, 0.0863, 0.1098], alpha: 0.08 });
    assert.deepEqual(radius.md.$value, { value: 0.75, unit: 'rem' });
    assert.deepEqual(duration.slow.$value, { value: 0.4, unit: 's' });
    assert.deepEqual(t.primitive['font-family'].sans.$value, ['Inter', 'sans-serif']);
    assert.deepEqual(t.primitive['font-size'].sm.$value, { value: 0.875, unit: 'rem' });
    assert.deepEqual(space['0_5'].$value, { value: 2, unit: 'px' });
    assert.equal(t.semantic.light.color.action.$value, '{primitive.color.brand}');
    assert.equal(t.semantic.light.color['on-action'].$value, '{primitive.color.text-inverse}');
    assert.equal(t.semantic.light.color.danger, undefined);
    assert.equal(t.$extensions['ux-kit.status'], 'extracted');
    write(dir, 'out.json', r.out);
    const issues = check(join(dir, 'out.json')).issues.filter((i) => !i.msg.startsWith('contrast '));
    assert.deepEqual(issues.filter((i) => i.sev === 'blocker' || i.sev === 'major'), []);
  });
});

test('tokens --out: merges over the template and protects a defined standard', () => {
  withTempDir((dir) => {
    write(dir, 'tailwind.config.ts', TAILWIND.replace(/\s+spacing: .*\n/, '\n').replace(/\s+fontSize: .*\n/, '\n'));
    write(dir, 'tokens.json', readFileSync(join(ROOT, 'skills', 'ux-init', 'assets', 'templates', 'standard', 'tokens.json'), 'utf8'));
    const args = ['--from-tailwind', 'tailwind.config.ts', '--out', 'tokens.json'];
    const r = cli('tokens.mjs', args, dir);
    assert.equal(r.code, 0, r.err);
    assert.match(r.out, /Still template values: primitive\.space, primitive\.font-size/);
    assert.match(r.out, /semantic\.dark and its contrast pairs were removed/);
    const t = JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8'));
    assert.equal(t.semantic.dark, undefined);
    assert.ok(t.semantic.size['target-min']);
    assert.equal(t.primitive.space['4'].$value.value, 16);
    assert.deepEqual(t.$extensions['ux-kit.status-by-section'], { 'primitive.space': 'placeholder', 'primitive.font-size': 'placeholder' });
    assert.ok(t.$extensions['ux-kit.contrast-pairs'].every((p) => p.fg.startsWith('semantic.light.')));
    t.$extensions['ux-kit.status'] = 'defined';
    t.primitive.color.brand.$value = '#123456';
    write(dir, 'tokens.json', JSON.stringify(t));
    assert.equal(cli('tokens.mjs', args, dir).code, 2);
    assert.equal(JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8')).primitive.color.brand.$value, '#123456');
    assert.equal(cli('tokens.mjs', [...args, '--force'], dir).code, 0);
    assert.equal(JSON.parse(readFileSync(join(dir, 'tokens.json'), 'utf8')).primitive.color.brand.$value, '#e63f6e');
  });
});

test('tokens --from-css: reads @theme, :root, dark blocks and var()', () => {
  withTempDir((dir) => {
    write(dir, 'theme.css', `@import 'tailwindcss';
/* :root { --ignored: #000; } */
@theme { --color-brand: #e63f6e; --radius-md: 12px; --text-sm: 0.875rem; --text-sm--line-height: 1.25rem; --font-sans: "Inter", sans-serif; --duration-fast: 150ms; --background-image-x: linear-gradient(#fff, #000); }
:root { --background: #ffffff; --foreground: var(--ink); --ink: #111111; --primary: 222 47% 11%; --primary-foreground: #ffffff; --border: rgb(0 0 0 / 10%); --z: 10; }
.card { --background: #123456; }
[data-theme="blue"] { --background: #0000ff; }
.dark { --background: #000000; --foreground: #eeeeee; }
@media (prefers-color-scheme: dark) { :root { --primary: #ffffff; } }
`);
    const r = cli('tokens.mjs', ['--from-css', 'theme.css'], dir);
    assert.equal(r.code, 0, r.err);
    const t = JSON.parse(r.out); const { color } = t.primitive;
    assert.equal(color.background.$value, '#ffffff');
    assert.equal(color.foreground.$value, '#111111');
    assert.equal(color.ignored, undefined);
    assert.equal(color['dark-background'].$value, '#000000');
    assert.equal(color['dark-primary'].$value, '#ffffff');
    assert.equal(color.border.$value.alpha, 0.1);
    assert.deepEqual(t.primitive.radius.md.$value, { value: 12, unit: 'px' });
    assert.deepEqual(Object.keys(t.primitive['font-size']).filter((k) => k !== '$type'), ['sm']);
    assert.deepEqual(t.primitive['font-family'].sans.$value, ['Inter', 'sans-serif']);
    assert.equal(t.semantic.light.color.text.$value, '{primitive.color.foreground}');
    assert.equal(t.semantic.dark.color.bg.$value, '{primitive.color.dark-background}');
    assert.ok(t.$extensions['ux-kit.contrast-pairs'].some((p) => p.fg === 'semantic.dark.color.text'));
  });
});

test('tokens --from-mui: reads createTheme', () => {
  withTempDir((dir) => {
    write(dir, 'theme.ts', `import { createTheme } from '@mui/material';
export const theme = createTheme({
  palette: { mode: 'light', primary: { main: '#1976d2', contrastText: '#ffffff' }, error: { main: '#d32f2f' }, background: { default: '#fafafa', paper: '#ffffff' }, text: { primary: '#111111' } },
  shape: { borderRadius: 8 },
  typography: { fontFamily: 'Roboto, Arial, sans-serif' },
});
`);
    const r = cli('tokens.mjs', ['--from-mui', 'theme.ts'], dir);
    assert.equal(r.code, 0, r.err);
    const t = JSON.parse(r.out); const semantic = t.semantic.light.color;
    assert.equal(semantic.action.$value, '{primitive.color.primary-main}');
    assert.equal(semantic['on-action'].$value, '{primitive.color.primary-contrastText}');
    assert.equal(semantic.surface.$value, '{primitive.color.background-paper}');
    assert.equal(t.primitive.color.mode, undefined);
    assert.deepEqual(t.primitive.radius.md.$value, { value: 8, unit: 'px' });
    assert.deepEqual(t.primitive['font-family'].sans.$value, ['Roboto', 'Arial', 'sans-serif']);
  });
});

test('tokens --from-*: bad input is a usage error', () => {
  withTempDir((dir) => {
    write(dir, 'empty.css', 'body{color:red}');
    write(dir, 'no-theme.js', 'export default {};');
    assert.equal(cli('tokens.mjs', ['--from-css', 'empty.css'], dir).code, 2);
    assert.equal(cli('tokens.mjs', ['--from-tailwind', 'no-theme.js'], dir).code, 2);
    assert.equal(cli('tokens.mjs', ['--from-tailwind', 'missing.js'], dir).code, 2);
    assert.equal(cli('tokens.mjs', ['--from-tailwind'], dir).code, 2);
  });
});

const skillText = (...parts) => readFileSync(join(ROOT, 'skills', ...parts), 'utf8').replace(/\r\n/g, '\n');
const CHECKLIST = /<!-- ux-laws:checklist:start -->[\s\S]*?<!-- ux-laws:checklist:end -->/;

test('ux-laws: ux-check carries the same checklist', () => {
  const laws = skillText('ux-laws', 'SKILL.md').match(CHECKLIST);
  const check = skillText('ux-check', 'SKILL.md').match(CHECKLIST);
  assert.ok(laws && check, 'checklist markers missing');
  assert.equal(check[0], laws[0]);
});

test('ux-laws: every rule id it cites is configurable in severity.md', () => {
  const severity = skillText('ux-init', 'assets', 'knowledge', 'severity.md');
  const configurable = new Set([...severity.matchAll(/^\| `([a-z0-9-]+)` \| (?:blocker|major|minor|suggestion) \|/gm)].map((m) => m[1]));
  const files = ['SKILL.md', ...readdirSync(join(ROOT, 'skills', 'ux-laws', 'references')).map((f) => `references/${f}`)];
  const cited = new Set();
  for (const file of files) {
    const text = skillText('ux-laws', ...file.split('/'));
    for (const m of text.matchAll(/rule ids? ((?:`[a-z0-9-]+`(?:, )?)+)/g)) for (const id of m[1].matchAll(/`([a-z0-9-]+)`/g)) cited.add(id[1]);
    for (const line of (text.match(CHECKLIST)?.[0] ?? '').split('\n')) { const id = line.match(/\s([a-z]+(?:-[a-z]+)+)$/); if (id && line.startsWith('[ ]')) cited.add(id[1]); }
  }
  assert.ok(cited.size >= 10, `only ${cited.size} ids found`);
  for (const id of cited) assert.ok(configurable.has(id), `${id} is not in severity.md`);
});

test('ux-laws: references listed in SKILL.md exist and nothing points outside the kit', () => {
  const skill = skillText('ux-laws', 'SKILL.md');
  const listed = new Set([...skill.matchAll(/`references\/([\w-]+\.md)`/g)].map((m) => m[1]));
  assert.deepEqual([...listed].sort(), readdirSync(join(ROOT, 'skills', 'ux-laws', 'references')).sort());
  for (const skillName of readdirSync(join(ROOT, 'skills'))) {
    assert.doesNotMatch(skillText(skillName, 'SKILL.md'), /frontend-clean-architecture|laravel-backend/, skillName);
  }
});

test('ux-laws: the team rules are not called myths', () => {
  const myths = skillText('ux-init', 'assets', 'knowledge', 'myths.md');
  assert.doesNotMatch(myths, /\| "(?:Max 7|More than 7|Form with > 7)/);
  assert.doesNotMatch(skillText('ux-guide', 'SKILL.md'), /never turn laws into numeric limits/);
  assert.doesNotMatch(skillText('ux-check', 'SKILL.md'), /Never block/);
});

test('detect: a legacy PHP app is detected by its pages, copied libraries are not apps', () => {
  withTempDir((dir) => {
    write(dir, 'composer.json', '{"require":{"setasign/fpdf":"1.8"}}');
    write(dir, 'index.php', '<?php include "Views/header.php"; ?>');
    write(dir, 'Views/home.view.php', '<?php $x = 1; ?>\n<div class="container"><form method="post"></form></div>');
    write(dir, 'Views/css/bootstrap.min.css', '/*! Bootstrap v5.3.0 */');
    write(dir, 'Views/js/jquery-3.7.1.min.js', '/*! jQuery v3.7.1 */');
    write(dir, 'Views/jquery-ui/package.json', '{"name":"jquery-ui","version":"1.14.0","main":"ui/widget.js","dependencies":{"jquery":">=1.12"}}');
    write(dir, 'Views/jquery-ui/index.html', '<!doctype html><html><body></body></html>');
    write(dir, 'ws/package.json', '{"private":true,"dependencies":{"ws":"^8.0.0"}}');
    const r = detect(dir);
    assert.deepEqual(r.apps.map((a) => [a.path, a.stack, a.platforms]), [['.', 'php + jquery + bootstrap', ['web']]]);
    assert.equal(r.monorepo, false);
    assert.deepEqual(r.projectsWithoutUi.map((p) => [p.path, p.reason]), [
      ['Views/jquery-ui', 'third-party library copied into the project'],
      ['ws', 'no UI stack found in package.json and no pages'],
    ]);
  });
});

test('detect: says so when no app is found', () => {
  withTempDir((dir) => {
    write(dir, 'composer.json', '{"require":{"monolog/monolog":"^3.0"}}');
    write(dir, 'src/Job.php', '<?php class Job {}');
    const r = cli('detect.mjs', ['.', '--md'], dir);
    assert.equal(r.code, 0);
    assert.match(r.out, /## No app detected/);
    assert.match(r.out, /`\.` — no UI stack found in composer\.json and no pages/);
  });
});

test('scan --list-changed: keeps file names with accents', () => {
  withRepo((dir) => {
    write(dir, 'Producción.html', IMG);
    write(dir, 'ok.html', IMG);
    assert.deepEqual(cli('scan.mjs', ['--list-changed'], dir).out.split('\n').sort(), ['Producción.html', 'ok.html'].sort());
  });
});

test('scan --changed: filters by path', () => {
  withRepo((dir) => {
    write(dir, 'apps/web/a.html', IMG);
    write(dir, 'apps/admin/b.html', IMG);
    for (const args of [['--list-changed', 'apps/web'], ['--list-changed', 'HEAD', 'apps/web']]) assert.equal(cli('scan.mjs', args, dir).out, 'apps/web/a.html');
    const r = JSON.parse(cli('scan.mjs', ['--changed', 'HEAD', 'apps/web', '--json'], dir).out);
    assert.deepEqual([...new Set(r.findings.map((f) => f.file))], ['apps/web/a.html']);
  });
});

test('scan --changed: a base ref sees committed work', () => {
  withRepo((dir, git) => {
    write(dir, 'a.html', IMG);
    git('add', '.');
    git('commit', '-qm', 'work');
    assert.equal(cli('scan.mjs', ['--list-changed'], dir).out, '');
    assert.equal(cli('scan.mjs', ['--list-changed', 'HEAD~1'], dir).out, 'a.html');
  });
});

test('scan --changed: only reports changed lines', () => {
  withRepo((dir, git) => {
    write(dir, 'a.html', IMG);
    git('add', '.');
    git('commit', '-qm', 'base');
    write(dir, 'a.html', `${IMG}${IMG}`);
    const r = JSON.parse(cli('scan.mjs', ['--changed', '--json'], dir).out);
    assert.deepEqual([...new Set(r.findings.map((f) => f.line))], [2]);
    assert.ok(r.preexistingNotShown > 0);
  });
});

test('scan --changed: rejects an unknown or ambiguous argument', () => {
  withRepo((dir, git) => {
    assert.equal(cli('scan.mjs', ['--changed', 'nope'], dir).code, 2);
    mkdirSync(join(dir, 'web'));
    git('branch', 'web');
    assert.equal(cli('scan.mjs', ['--changed', 'web'], dir).code, 2);
  });
});

test('scan: --include and --exclude apply in every mode', () => {
  withRepo((dir) => {
    write(dir, 'src/a.html', IMG);
    write(dir, 'src/a.test.html', IMG);
    write(dir, 'other/b.html', IMG);
    const filters = ['--include', 'src/**', '--exclude', '**/*.test.*'];
    assert.equal(cli('scan.mjs', ['--list-changed', ...filters], dir).out, 'src/a.html');
    const r = JSON.parse(cli('scan.mjs', ['.', '--json', ...filters], dir).out);
    assert.equal(r.filesScanned, 1);
    assert.deepEqual([...new Set(r.findings.map((f) => f.file))], ['src/a.html']);
  });
});
