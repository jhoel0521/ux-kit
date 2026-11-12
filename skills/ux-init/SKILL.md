---
name: ux-init
description: Set up ux-kit in a project, or re-sync it. Creates the agent-independent .ux/ folder (config.yaml, standard/, knowledge/, scripts/, reports/), detects every app and stack in single projects and monorepos, and in existing projects extracts the current colors, typography and spacing into technology-agnostic tokens. Re-running it refreshes knowledge and scripts and syncs detected facts (new apps, framework migrations) without touching the team's standard. Use when the user wants to start using ux-kit, "initialize UX", set up a UX standard or design tokens, or after migrating an app to another framework.
license: MIT
compatibility: Any agent supporting SKILL.md. Scripts need Node.js 18+. Copies files from this skill's assets/ folder into the project.
metadata:
  version: "0.2.0"
  profile: core
  kit: ux-kit
---

# ux-init

Creates or syncs `.ux/` at the repository root. Everything ux-kit needs lives there, so any agent can use it. `ASSETS` below = the `assets/` folder next to this SKILL.md.

## 1. Detect
```bash
node ASSETS/scripts/detect.mjs <repo-root> --md
```
Note every app (path, stack, platforms, theme candidates), whether it's a monorepo, and whether `.ux/` already exists. Projects under "Without UI" do not go in `apps:`; mention them and the reason in the init report.

## 2. Mode
- **No `.ux/`** → *create* (continue with step 3).
- **`.ux/` exists** → *sync*:
  1. Overwrite `.ux/knowledge/` and `.ux/scripts/` with the copies from `ASSETS` (they are kit-owned, not edited by the team).
  2. Compare detected apps with `config.yaml → apps`. Update **facts** automatically (stack, platforms detected, theme path, apps added/removed) and list each change in one line ("apps/backoffice: laravel-blade → astro + tailwind").
  3. Ask only about **decisions** for new or changed apps: which user profiles use it, platform or accessibility overrides.
  4. For migrated apps, compare the new theme's values with `.ux/standard/tokens.json` and report differences ("new theme uses #1d4ed8 for action; standard says #2563eb — fix code or update the standard?"). Recommend a full ux-check of the migrated app.
  5. Never modify `.ux/standard/` here — that is ux-discover's job. Write a sync note to `.ux/reports/YYYY-MM-DD-ux-init-sync.md` and stop.

## 3. Create
Copy from `ASSETS` (bash: `cp -r`; PowerShell: `Copy-Item -Recurse`):
```
ASSETS/knowledge/            → .ux/knowledge/
ASSETS/scripts/              → .ux/scripts/
ASSETS/templates/config.yaml → .ux/config.yaml
ASSETS/templates/standard/   → .ux/standard/
ASSETS/templates/reports/    → .ux/reports/               (contains _template.md)
```
Then fill in:
1. **config.yaml**: project name (from the root manifest — package.json `name`, composer.json, settings.gradle `rootProject.name`, pom `artifactId` — else the folder name), `type` (`existing` if any detected app already has product screens or components; `new` if no app was detected or the code is only a framework starter; if unclear, ask once), `language` (the conversation language), `platforms` (union of detected), `apps` with path/stack/platforms/theme for every detected app (`theme: null` when none was found; several stacks joined with ` + `). Leave `severity`, `exceptions`, `integrations` empty.
2. **Existing project → tokens.json**: for Tailwind, CSS variables or MUI, generate a first version over the copied template (`--from-css` and `--from-mui` work the same way and can be combined):
   ```bash
   node .ux/scripts/tokens.mjs --from-tailwind <tailwind-config> --out .ux/standard/tokens.json
   ```
   It reads the files as text and never runs them, removes `semantic.dark` when the source has no dark theme, and marks sections it could not find as `placeholder` in `$extensions["ux-kit.status-by-section"]`. Check the roles and values it reports as missing or unreadable, and complete them from the code. For any other stack open the real theme files (Compose `Theme.kt`/`Color.kt`/`Type.kt`, Flutter `ThemeData`, SwiftUI assets/colors, XAML resource dictionaries, Java L&F, QML theme…). Extract the values actually used into the DTCG structure (primitive → semantic, light/dark if present) and declare contrast pairs in `$extensions["ux-kit.contrast-pairs"]`. Do not invent values; if several apps disagree, keep the most used and list the differences for ux-discover. Keep translucent colors translucent: `{"colorSpace":"srgb","components":[r,g,b],"alpha":a}` with components from 0 to 1; a pair with a translucent `bg` can name the token underneath in `"over"`. Validate:
   ```bash
   node .ux/scripts/tokens.mjs .ux/standard/tokens.json --suggest
   ```
   Report failing contrast pairs as team decisions, with the nearest passing value that `--suggest` prints. Pairs whose mode was removed (no dark theme) are skipped with a note.
   When values were extracted, set `$extensions["ux-kit.status"]` to `"extracted"`. If only some sections were extracted, list the others in `$extensions["ux-kit.status-by-section"]`, e.g. `{"primitive.space": "placeholder"}`.
   **No theme files found** (only literals scattered in code): keep the template values, leave `ux-kit.status` as `"placeholder"`, and list the most used literal colors/sizes (from `node .ux/scripts/scan.mjs <repo> --json` → `inventory`) in the init report for ux-discover to decide. Do not promote literals to tokens yourself.
3. **New project**: leave tokens as placeholders (`ux-kit.status: "placeholder"`) — ux-discover defines the brand.
4. **CHANGELOG.md**: set version 0.1.0 with today's date; requested by "ux-init (automatic)", reason "initial setup".
5. **Agent pointer**: offer (ask first) to add to `AGENTS.md` (and `CLAUDE.md` if the project uses it):
   ```
   ## UX/UI
   This project uses ux-kit. Before planning or building UI, read `.ux/config.yaml` and the relevant files in `.ux/standard/`.
   Use only the tokens in `.ux/standard/tokens.json`. Run ux-check after UI changes.
   ```
6. Suggest adding `.ux/reports/render/` to `.gitignore` (screenshots); everything else in `.ux/` should be committed.

## 4. Close
Write `.ux/reports/YYYY-MM-DD-ux-init.md` (detected apps, what was created, tokens status, contrast failures, assumptions made and questions left for the team). Then summarize in the conversation language: apps detected, files created, tokens extracted (and contrast failures), assumptions made. Next steps:
- **New project** → run **ux-discover**.
- **Existing project** → run **ux-discover** to complete what code can't tell (users, brand, references), then **ux-check** over the whole project for a baseline.
