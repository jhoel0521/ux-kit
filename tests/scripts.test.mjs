// Run from anywhere: node --test tests/scripts.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../skills/ux-init/assets/scripts/scan.mjs';
import { detect } from '../skills/ux-init/assets/scripts/detect.mjs';

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
