---
name: ux-check
description: "Light UX/UI review of what just changed — only the new or modified visual files of the current change (any language: HTML, CSS, JS/TS, Vue, Svelte, Blade, Kotlin/Compose, Swift, Dart, Java, C#, C++/Qt, XAML…) — against the project's .ux/ standard: accessibility, touch targets, focus, states, tokens and brand, platform conventions, copy. Detects standard drift in both directions and saves a short report. Use right after implementing a UI change, at the end of an apply/implementation step, before a PR, or when the user says \"check the UI\", \"review what you changed\", \"ux check\". Also usable on a path for a broader pass."
license: MIT
compatibility: Any agent supporting SKILL.md. Scripts need Node.js 18+ and .ux/ from ux-init; git is used to find changed files.
metadata:
  version: "0.1.0"
  profile: core
  kit: ux-kit
---

# ux-check

Fast and cheap by design: review only what changed, load only the knowledge needed.

## 0. If `.ux/` is missing or you cannot write
- **No `.ux/`**: the scripts, knowledge and standard are not available. Say once, in one line, that `ux-init` would add them. Then review the diff (`git diff`, or ask for the files) following step 3 with these defaults: targets ≥ 24×24 CSS px (touch: 44pt iOS, 48dp Android), contrast 4.5:1 for text and 3:1 for large text and UI parts, accessible names, visible focus, all states, no literal design values. Classify as blocker (WCAG A/AA failure with real impact, data loss, dark pattern), major or minor. Show the report in the chat and offer to save it.
- **Read-only session** (plan mode, read-only sandbox): do not update `config.yaml` or save the report. Show the proposed fact changes and the report in the chat.

## 1. What to review
- Default: changed UI files since `config.yaml → check.base_ref` (default `HEAD`, which only sees uncommitted work), plus untracked files:
  ```bash
  node .ux/scripts/scan.mjs --list-changed [base_ref] [--include <glob>]… [--exclude <glob>]…
  ```
- **Before a PR, or when the work is already committed**, `HEAD` finds nothing. Run `git merge-base <default-branch> HEAD` and use the resulting commit as `base_ref` here and in step 2.
- Pass each `check.include` as `--include` and each `check.exclude` as `--exclude` (globs relative to the repo root). The list excludes data/config files (.json, .yaml) and general-purpose languages; add files explicitly when they contain UI code (e.g. a Python Qt/Tkinter view). If there is no git, ask for the list of files (or a path).
- If the user gives a path, review that path instead.
- Map each file to its app (`config.yaml → apps`) to know platforms, users and overrides. If a file's stack differs from the config, update the fact and say so in one line.

## 2. Scan what the scanner covers
```bash
node .ux/scripts/scan.mjs --changed [base_ref] [app-paths…] --platform <web|mobile|desktop> [--include <glob>]… [--exclude <glob>]… --json
```
(or `node .ux/scripts/scan.mjs <paths> …` for an explicit path). Run from the repo root so paths are repo-relative.
- `--platform` only tunes touch-target severity. Use `mobile` if the app's platforms include android or ios, otherwise `web` if they include web, otherwise `desktop`. In monorepos with different apps changed, run once per group and pass that group's app paths (e.g. `--changed HEAD apps/web --platform web`).
- In `--changed` mode only findings on **changed lines** are shown; the scanner reports how many pre-existing findings it hid. Put that number in the report (not the items) and suggest a full `ux-check <path>` baseline if it is high. Use `--all-lines` only if the user asks.
- Every result is a **candidate**: open the code and confirm, reclassify or discard it. Final severity comes from `severity.md` + `config.yaml`, not from the scanner.

## 3. Read what the scanner does not cover
For the changed files the scanner ignores (or covers partially), read the diff and check, using `.ux/knowledge/stacks/<stack>.md` for where to look:
- Names/roles for interactive elements; target sizes; text units and scaling; focus/keyboard (desktop/web).
- **States** around new data fetching or actions (loading, empty, error, double submit).
- **Standard**: colors, fonts, spacing, radii come from the theme/tokens; values match `.ux/standard/tokens.json`; copy uses the glossary in `users.md`.
- **Platform conventions** for the app's platforms (`.ux/knowledge/platforms.md`, only the relevant section).
- **Destructive actions / consents** (confirm or undo; no dark patterns).
Load other knowledge files only when a finding needs justification.

## 4. Drift in both directions
Check `.ux/standard/tokens.json → $extensions["ux-kit.status"]` first. A section listed in `$extensions["ux-kit.status-by-section"]` (e.g. `primitive.space`) uses that status instead of the global one:
- `placeholder` → the standard is not defined yet. Do not report `token-drift`; report literals as `literal-design-values` only and recommend ux-discover once in the report.
- `extracted`/`defined` → apply:
  - **`token-drift`**: the code uses a value for something the standard defines differently (e.g. the action color is `#1d4ed8`, the token says `#2563eb`).
  - **`literal-design-values`**: a literal that should come from the theme but has no conflicting token.
  - **Reverse drift**: the same value not in the standard appears repeatedly in the changed lines (the scanner inventory only counts changed lines) → ask **"Did the standard change? Update it (ux-discover) or fix the code?"**
If `users.md`/`brand.md` still contain `{{…}}` placeholders, skip glossary/brand checks and rely on `.ux/knowledge/` defaults.

## 5. Optional render pass
Only if the user asks or a dev URL is known and cheap to use:
```bash
node .ux/scripts/render.mjs <url> --out .ux/reports/render [--dark]
```
(needs Playwright; if missing, say how to install and skip).

## 6. Report
Use `.ux/knowledge/severity.md` (fixed base + `config.yaml → severity` overrides + `exceptions`). Keep it short: verdict, counts, findings (most severe first) with file:line, rule, evidence and a concrete fix. Record the standard version from `.ux/standard/CHANGELOG.md`. Save to `.ux/reports/YYYY-MM-DD-ux-check-<scope>.md` (scope = the app name, or `changes` for multi-app diffs, or the reviewed folder name) (template `.ux/reports/_template.md`). In the chat: verdict, counts, top findings, and offer to fix blockers and majors now.

Never block: the verdict informs the team.
