#!/usr/bin/env node
// ux-kit · detect.mjs — detect apps, stacks, platforms, UI/chart libraries and theme files.
// Usage: node detect.mjs [root] [--md]
// Works on single projects and monorepos: every folder with a manifest (package.json, composer.json,
// build.gradle(.kts), pubspec.yaml, Package.swift/*.xcodeproj, *.csproj, pom.xml, CMakeLists.txt, Cargo.toml
// with tauri, *.pro) becomes an "app" candidate. Output feeds the `apps:` section of .ux/config.yaml.
// Read-only: never executes project code.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, basename, extname, dirname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'vendor', 'Pods', '.gradle', 'target',
  '.dart_tool', 'coverage', '.venv', 'venv', '__pycache__', '.idea', '.turbo', 'storybook-static', 'DerivedData',
  '.svelte-kit', '.nuxt', '.output', 'bin', 'obj', '.ux', '.claude', '.agents', '.expo', 'generated']);

const NPM = {
  react: ['framework', 'react'], next: ['framework', 'next'], vue: ['framework', 'vue'], nuxt: ['framework', 'nuxt'],
  '@angular/core': ['framework', 'angular'], svelte: ['framework', 'svelte'], '@sveltejs/kit': ['framework', 'sveltekit'],
  astro: ['framework', 'astro'], 'solid-js': ['framework', 'solid'], '@remix-run/react': ['framework', 'remix'],
  'react-native': ['framework', 'react-native'], expo: ['framework', 'expo'], electron: ['framework', 'electron'],
  '@tauri-apps/api': ['framework', 'tauri'], '@capacitor/core': ['framework', 'capacitor'], '@ionic/core': ['ui', 'ionic'],
  tailwindcss: ['styling', 'tailwind'], 'styled-components': ['styling', 'styled-components'], '@emotion/react': ['styling', 'emotion'],
  sass: ['styling', 'sass'], nativewind: ['styling', 'nativewind'], unocss: ['styling', 'unocss'],
  '@mui/material': ['ui', 'mui'], antd: ['ui', 'ant-design'], '@chakra-ui/react': ['ui', 'chakra'], bootstrap: ['ui', 'bootstrap'],
  '@fluentui/react-components': ['ui', 'fluent-ui-v9'], '@material/web': ['ui', 'material-web'],
  '@angular/material': ['ui', 'angular-material'], vuetify: ['ui', 'vuetify'], primevue: ['ui', 'primevue'],
  primereact: ['ui', 'primereact'], 'element-plus': ['ui', 'element-plus'], '@mantine/core': ['ui', 'mantine'],
  '@headlessui/react': ['ui', 'headless-ui'], 'react-aria-components': ['ui', 'react-aria'], daisyui: ['ui', 'daisyui'],
  'react-native-paper': ['ui', 'react-native-paper'], tamagui: ['ui', 'tamagui'], '@heroui/react': ['ui', 'heroui'],
  recharts: ['charts', 'recharts'], 'chart.js': ['charts', 'chart.js'], echarts: ['charts', 'echarts'], d3: ['charts', 'd3'],
  highcharts: ['charts', 'highcharts'], apexcharts: ['charts', 'apexcharts'], 'plotly.js': ['charts', 'plotly'],
  '@mui/x-charts': ['charts', 'mui-x-charts'], '@tremor/react': ['charts', 'tremor'],
  'framer-motion': ['motion', 'framer-motion'], motion: ['motion', 'motion'], gsap: ['motion', 'gsap'],
  'axe-core': ['a11y', 'axe-core'], '@axe-core/playwright': ['a11y', 'axe-playwright'], 'eslint-plugin-jsx-a11y': ['a11y', 'jsx-a11y'],
  playwright: ['tooling', 'playwright'], '@playwright/test': ['tooling', 'playwright'], '@storybook/react': ['tooling', 'storybook'],
};
const PREFIX = { '@radix-ui/': ['ui', 'radix'], '@nivo/': ['charts', 'nivo'], '@visx/': ['charts', 'visx'] };
const THEME_RE = /(^|[\/\\])(theme|tokens?|colou?rs?|palette|variables|globals?|app|index|styles?|Type|Color|Theme)\.(css|scss|ts|js|mjs|json|kt|swift|dart|xaml|qml)$|tailwind\.config\.|\.tokens\.json$|(^|[\/\\])values[\/\\]colors\.xml$/i;

const read = (p, n = 300_000) => { try { return readFileSync(p, 'utf8').slice(0, n); } catch { return ''; } };

function walk(root, max = 8000) {
  const files = []; const stack = [root];
  while (stack.length && files.length < max) {
    const d = stack.pop(); let ents; try { ents = readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith('.')) stack.push(join(d, e.name)); }
      else files.push(join(d, e.name));
    }
  }
  return files;
}

function analyzeManifest(file) {
  const base = basename(file); const txt = read(file); const r = { framework: new Set(), ui: new Set(), styling: new Set(),
    charts: new Set(), motion: new Set(), a11y: new Set(), tooling: new Set(), platforms: new Set() };
  const add = (cat, name) => r[cat]?.add(name);
  if (base === 'package.json') {
    let pkg = {}; try { pkg = JSON.parse(txt); } catch { return null; }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
    if (!Object.keys(deps).length) return null;
    for (const [d, v] of Object.entries(deps)) {
      if (NPM[d]) { let [c, n] = NPM[d]; if (d === 'tailwindcss' && /^[\^~]?4/.test(String(v))) n = 'tailwind-v4'; add(c, n); }
      for (const [p, [c, n]] of Object.entries(PREFIX)) if (d.startsWith(p)) add(c, n);
    }
    if (['react', 'vue', 'angular', 'svelte', 'astro', 'solid', 'next', 'nuxt'].some((f) => r.framework.has(f))) r.platforms.add('web');
    if (r.framework.has('react-native') || r.framework.has('expo')) { r.platforms.add('android'); r.platforms.add('ios'); }
    if (r.framework.has('electron') || r.framework.has('tauri')) r.platforms.add('desktop');
  } else if (base === 'composer.json') {
    if (txt.includes('laravel/framework')) { add('framework', 'laravel-blade'); r.platforms.add('web'); }
    if (txt.includes('livewire/livewire')) add('framework', 'livewire');
    if (txt.includes('filament/filament')) add('ui', 'filament');
    if (txt.includes('symfony/')) { add('framework', 'symfony-twig'); r.platforms.add('web'); }
  } else if (/^build\.gradle(\.kts)?$/.test(base)) {
    const low = txt.toLowerCase();
    if (low.includes('com.android.application') || low.includes('com.android.library') || low.includes('android {')) r.platforms.add('android');
    if (low.includes('compose')) add('framework', 'jetpack-compose');
    if (txt.includes('material3')) add('ui', 'material3');
    if (txt.includes('com.google.android.material')) add('ui', 'material-components');
    if (txt.includes('org.jetbrains.compose')) { add('framework', 'compose-multiplatform'); r.platforms.add('desktop'); }
    if (txt.includes('javafx')) { add('framework', 'javafx'); r.platforms.add('desktop'); }
    if (txt.includes('spring-boot')) add('framework', 'spring-boot');
    if (!r.framework.size && !r.platforms.size) return null;
  } else if (base === 'pom.xml') {
    if (txt.includes('javafx')) { add('framework', 'javafx'); r.platforms.add('desktop'); }
    if (txt.includes('thymeleaf')) { add('framework', 'thymeleaf'); r.platforms.add('web'); }
    if (txt.includes('vaadin')) { add('framework', 'vaadin'); r.platforms.add('web'); }
    if (!r.framework.size) { add('framework', 'java'); }
  } else if (base === 'pubspec.yaml') {
    if (!/\bflutter:/.test(txt)) return null;
    add('framework', 'flutter'); r.platforms.add('android'); r.platforms.add('ios');
    if (txt.includes('fl_chart')) add('charts', 'fl_chart');
    if (txt.includes('syncfusion_flutter_charts')) add('charts', 'syncfusion');
  } else if (base === 'Package.swift' || base.endsWith('.xcodeproj')) {
    add('framework', 'swift'); r.platforms.add('ios');
  } else if (base.endsWith('.csproj')) {
    if (txt.includes('UseMaui')) { add('framework', 'maui'); ['android', 'ios', 'desktop'].forEach((p) => r.platforms.add(p)); }
    if (txt.includes('Microsoft.WindowsAppSDK')) { add('framework', 'winui3'); r.platforms.add('windows'); }
    if (txt.includes('UseWPF')) { add('framework', 'wpf'); r.platforms.add('windows'); }
    if (txt.includes('UseWindowsForms')) { add('framework', 'winforms'); r.platforms.add('windows'); }
    if (txt.includes('Avalonia')) { add('framework', 'avalonia'); r.platforms.add('desktop'); }
    if (txt.includes('Microsoft.NET.Sdk.Web')) { add('framework', 'aspnet-razor'); r.platforms.add('web'); }
    if (!r.framework.size) return null;
  } else if (base === 'CMakeLists.txt' || base.endsWith('.pro')) {
    if (!/Qt[56]?|find_package\(Qt|QT\s*\+=/.test(txt)) return null;
    add('framework', 'qt'); r.platforms.add('desktop');
  } else if (base === 'Cargo.toml') {
    if (!txt.includes('tauri')) return null;
    add('framework', 'tauri'); r.platforms.add('desktop');
  } else return null;
  return r;
}

const MANIFEST = (b) => ['package.json', 'composer.json', 'build.gradle', 'build.gradle.kts', 'pubspec.yaml', 'Package.swift',
  'pom.xml', 'CMakeLists.txt', 'Cargo.toml'].includes(b) || b.endsWith('.csproj') || b.endsWith('.pro') || b.endsWith('.xcodeproj');

// Paths written to .ux/config.yaml use "/" on every OS so the file is portable.
const portable = (p) => p.split(sep).join('/');

export function detect(rootArg) {
  const root = resolve(rootArg); // absolute, so "." and "./" behave like any other root
  const files = walk(root);
  const apps = new Map();
  const ensure = (dir) => { if (!apps.has(dir)) apps.set(dir, { framework: new Set(), ui: new Set(), styling: new Set(), charts: new Set(),
    motion: new Set(), a11y: new Set(), tooling: new Set(), platforms: new Set(), themes: [], exts: {} }); return apps.get(dir); };
  for (const f of files) {
    if (!MANIFEST(basename(f))) continue;
    const r = analyzeManifest(f); if (!r) continue;
    let dir = dirname(f);
    if (basename(dir) === 'src-tauri') dir = dirname(dir);
    if (/^build\.gradle/.test(basename(f)) && basename(dir) === 'app') dir = dirname(dir);
    const a = ensure(dir);
    for (const k of Object.keys(r)) for (const v of r[k]) a[k].add(v);
  }
  const dirs = [...apps.keys()].sort((x, y) => y.length - x.length);
  const owner = (f) => dirs.find((d) => f === d || f.startsWith(d + '/') || f.startsWith(d + '\\'));
  for (const f of files) {
    const d = owner(f); if (!d) continue; const a = apps.get(d); const ext = extname(f).toLowerCase();
    if (ext) a.exts[ext] = (a.exts[ext] || 0) + 1;
    if (THEME_RE.test(f) && a.themes.length < 15) a.themes.push(portable(relative(root, f)));
    if (ext === '.swift' && !a.framework.has('swiftui')) { const t = read(f, 20000); if (t.includes('import SwiftUI')) a.framework.add('swiftui'); else if (t.includes('import UIKit')) a.framework.add('uikit'); else if (t.includes('import AppKit')) { a.framework.add('appkit'); a.platforms.add('macos'); } }
    if (ext === '.xml' && /[\/\\]res[\/\\]layout[^\/\\]*[\/\\]/.test(f)) a.framework.add('android-views');
    if (ext === '.java' && !a.framework.has('swing') && /import javax\.swing/.test(read(f, 20000))) { a.framework.add('swing'); a.platforms.add('desktop'); }
    if (ext === '.qml') a.framework.add('qml');
    if (f.endsWith('.blade.php')) a.framework.add('laravel-blade');
  }
  // drop root "app" that is only a workspace wrapper (no framework) when children exist
  const list = [...apps.entries()].filter(([d, a]) => a.framework.size || a.platforms.size || dirs.length === 1)
    .map(([d, a]) => ({
      name: basename(d), path: portable(relative(root, d)) || '.',
      stack: [...a.framework, ...a.ui, ...a.styling].join(' + ') || 'unknown',
      platforms: [...a.platforms].sort(), charts: [...a.charts], motion: [...a.motion], a11yTooling: [...a.a11y],
      tooling: [...a.tooling], themeCandidates: a.themes,
      topExtensions: Object.fromEntries(Object.entries(a.exts).sort((x, y) => y[1] - x[1]).slice(0, 8)),
    })).sort((x, y) => x.path.localeCompare(y.path));
  return { root: rootArg, monorepo: list.length > 1, apps: list,
    hasUx: existsSync(join(root, '.ux', 'config.yaml')), hasStandardTokens: existsSync(join(root, '.ux', 'standard', 'tokens.json')),
    hasGit: existsSync(join(root, '.git')) };
}

function toMd(o) {
  const out = ['# Detected stack', '', `- Monorepo: ${o.monorepo ? 'yes' : 'no'} · .ux/: ${o.hasUx ? 'yes' : 'no'} · git: ${o.hasGit ? 'yes' : 'no'}`, ''];
  for (const a of o.apps) {
    out.push(`## ${a.name} (\`${a.path}\`)`, `- Stack: ${a.stack}`, `- Platforms: ${a.platforms.join(', ') || '?'}`);
    if (a.charts.length) out.push(`- Charts: ${a.charts.join(', ')}`);
    out.push(`- Theme candidates: ${a.themeCandidates.length ? a.themeCandidates.slice(0, 8).map((t) => '`' + t + '`').join(', ') : 'none found (look for literals in code)'}`);
    out.push('');
  }
  return out.join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const args = process.argv.slice(2); const md = args.includes('--md');
  if (args.includes('--help') || args.includes('-h')) { console.log('usage: node detect.mjs [root] [--md]  — detect apps, stacks, platforms, theme files (JSON by default)'); process.exit(0); } const root = args.find((a) => !a.startsWith('--')) || '.';
  if (!existsSync(root) || !statSync(root).isDirectory()) { console.error('usage: node detect.mjs [root] [--md]'); process.exitCode = 2; }
  else { const o = detect(root.replace(/\/$/, '') || '.'); console.log(md ? toMd(o) : JSON.stringify(o, null, 2)); }
}
