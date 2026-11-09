# ux-kit

**UX/UI quality layer for AI coding agents.** Gives your agent the knowledge and tools to consider usability, accessibility, visual design and platform conventions when it plans, builds and reviews interfaces — measured against **your project's own standard**.

[Español](README.es.md) · License: MIT · Status: v0.1 (early, feedback welcome)

- **Agent-agnostic** — standard `SKILL.md` skills: Claude Code, Codex, OpenCode, Cursor, GitHub Copilot, Gemini CLI and any compatible agent.
- **Methodology-agnostic** — works alone or next to OpenSpec, Spec Kit, Scrum, Kanban… It has no workflow of its own.
- **Stack-agnostic** — web, Android, iOS, desktop, Flutter, React Native, Java, .NET, Qt. Scanner for common stacks; guides for the rest.
- **Your standard first** — users, brand and tokens live in `.ux/` and everything is checked against them.
- **Advisory, not blocking** — it informs and asks; your team decides.

## Install

```bash
npx skills add jhoel0521/ux-kit            # pick skills and agents interactively
npx skills add jhoel0521/ux-kit --all      # everything
```
`npx skills` installs into the right folder per agent (`.claude/skills/` for Claude Code, `.agents/skills/` for Codex, OpenCode, Cursor, Copilot, Gemini…). Manual install: copy the folders in `skills/` into your agent's skills folder.

Then, inside your agent:
```
ux-init       → creates .ux/ (detects apps and stacks; extracts tokens in existing projects)
ux-discover   → defines users, references, interview questions, brand and tokens
```
(Claude Code: `/ux-init`; Codex: `$ux-init`; others: ask the agent to "run ux-init".)

## Skills (v0.1 — core)

| Skill | When | What it does |
|---|---|---|
| `ux-guide` | Automatically, when the agent plans or builds UI | Adds UX/UI considerations to any plan; applies the standard while building; triggers `ux-check` at the end |
| `ux-init` | Once; re-run to sync | Creates/syncs `.ux/`; detects apps (monorepos too) and framework migrations |
| `ux-discover` | Start of a product, redesigns, brand/user changes | Defines or updates the standard by parts; versioned CHANGELOG; impact analysis |
| `ux-plan-review` | Before approving a plan | Reviews any plan (OpenSpec change, plan mode, TASKS.md…) and asks whether to amend it |
| `ux-check` | After a UI change | Light review of changed visual files (any language) against the standard; drift detection |

Coming next: `ux-check-ux`, `ux-check-ui`, `ux-check-design`, `ux-check-a11y`, `ux-audit`, `ux-retro` (v0.2, with an npm CLI); integrations `ux-openspec`, `ux-scrum`, `ux-log` (v0.3). See [docs/DESIGN.md](docs/DESIGN.md).

## How it fits a development cycle

| Moment | ux-kit |
|---|---|
| Discovery | `ux-discover` → `.ux/standard/` |
| Planning (any tool) | `ux-guide` adds UX points to the plan · `ux-plan-review` before approval |
| Implementation | `ux-guide` applies the standard |
| Change finished | `ux-check` |
| Monorepo / framework migration | `ux-init` (re-run) or automatic fact sync |

## What lives in your project

```
.ux/
├── config.yaml     platforms, apps (synced), accessibility level, severities, exceptions, integrations
├── standard/       users.md · references.md · user-questions.md · brand.md · tokens.json · CHANGELOG.md
├── knowledge/      laws of UX, Nielsen, WCAG 2.2, platforms, visual system, states, forms, performance… (kit-owned)
├── scripts/        detect · scan · contrast · tokens · render (Node.js, no dependencies; render needs Playwright)
└── reports/        results of checks and reviews
```

## Scripts

```bash
node .ux/scripts/detect.mjs . --md                 # apps, stacks, platforms, theme files
node .ux/scripts/scan.mjs src --platform mobile    # static scan (candidates to confirm)
node .ux/scripts/scan.mjs --changed                # only files changed vs HEAD
node .ux/scripts/contrast.mjs "#777" "#fff"        # WCAG contrast
node .ux/scripts/tokens.mjs .ux/standard/tokens.json
node .ux/scripts/render.mjs http://localhost:5173  # needs Playwright: npm i -D playwright && npx playwright install chromium
```
`scan.mjs --fail-on blocker` exits 1 for CI.

## Contributing
New stacks, integrations, knowledge with sources, translations: see [CONTRIBUTING.md](CONTRIBUTING.md).
