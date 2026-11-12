# Changelog

## 0.2.0 — unreleased
- New core skill `ux-laws`: the 6 core laws of UX (Fitts, Hick, Jakob, Miller, Peak-End, Aesthetic-Usability) with one deep reference per law, a declare-before-coding step and a delivery checklist. Based on the team's `leyes-ux` skill.
- Team rules become configurable severity ids: `fitts-reach`, `fitts-spacing`, `hick-options`, `hick-steps`, `jakob-conventions`, `miller-chunks`, `peak-end`, `type-levels`, `aesthetic-consistency`. `touch-target-platform` and `primary-action-competition` now default to blocker.
- `ux-check` runs the ux-laws checklist and names the law and rule id in each finding; `ux-guide` and `ux-plan-review` require the law declaration.
- `laws-of-ux.md` keeps the other laws; `myths.md` no longer calls the team's numeric limits myths.
- Blockers must be fixed before a change is declared finished, unless the team lowers the rule or approves an exception.
- Scripts: theme extraction (`tokens.mjs --from-tailwind/--from-css/--from-mui`), monorepo detection by project folders, scripts run through linked folders.

## 0.1.0 — unreleased
- Core skills: ux-guide, ux-init, ux-discover, ux-plan-review, ux-check.
- Knowledge base: laws of UX, myths, Nielsen heuristics, WCAG 2.2 across platforms, platform conventions (Material 3, Apple HIG, Fluent 2, web, desktop), visual system and DTCG tokens, states and components, forms and content, performance, data visualization, dark patterns, per-stack guides.
- Node.js scripts (no dependencies): detect (monorepo-aware), scan (multi-stack, --changed), contrast, tokens; render (Playwright, optional).
- `.ux/` templates: config.yaml, standard (users, references, user questions, brand, tokens, CHANGELOG), report.
