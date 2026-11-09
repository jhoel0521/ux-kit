---
name: ux-guide
description: UX/UI quality guidance the agent applies by itself whenever it plans, proposes or builds user interfaces, with any tool or methodology (a plan, an OpenSpec change, a task list, a spec, or direct coding) and in any stack (web, Android, iOS, desktop, Flutter, React Native, Java, .NET, Qt…). Use it every time work touches screens, components, forms, navigation, dashboards, styles, themes or user flows, even if the user never says "UX". Reads the project standard in .ux/ (users, brand, tokens, platforms) and reminds the agent what to consider while planning, what to respect while building, and to run ux-check when the change is done.
license: MIT
compatibility: Any agent supporting SKILL.md. Uses the project folder .ux/ created by ux-init; works with reduced guidance without it.
metadata:
  version: "0.1.0"
  profile: core
  kit: ux-kit
---

# ux-guide

You are planning or building UI. This skill keeps UX/UI quality in mind without adding ceremony. It does not replace the user's workflow (OpenSpec, Scrum, plan mode, nothing): it adds considerations to whatever you are already producing.

## 0. Load the project standard (cheap)
- If `.ux/config.yaml` exists, read it: platforms, apps, accessibility level, severity overrides, exceptions, `check.after_change`.
- Read only what the task needs from `.ux/standard/` (users.md for who/where, brand.md + tokens.json for anything visual).
- If `.ux/` does not exist, continue with the defaults below and mention once, in one line, that `ux-init` would give the project its own standard.
- **Facts drift**: if the code you are touching clearly uses a different stack/theme than `config.yaml` says for that app, note it in one line and update the fact (stack, theme path) — do not stop the work. In a read-only session (plan mode, read-only sandbox) only note it. Decisions (users, levels, exceptions) are never changed silently.

## 1. When planning or proposing changes
Add a short "UX/UI considerations" part to the plan you are writing (wherever the plan lives: a proposal, design doc, task list, plan-mode output). Cover only what applies:
1. **Who and where**: which user profile(s) from `users.md`, context (device, one hand, gloves, desktop heavy use).
2. **Flow**: steps from start to end; the primary action per screen (one); how the flow ends (confirmation + next step).
3. **States**: loading, empty (first use / no results), error with recovery, success, offline, no permission.
4. **Platform conventions** for the target platforms (back behavior, navigation, dialogs, shortcuts on desktop).
5. **Accessibility**: names for icon controls, focus/keyboard, target sizes, contrast in light/dark, text scaling.
6. **Content**: labels and messages in the glossary's terms; error messages that say how to fix.
7. **Visual**: which tokens/components from the standard are used; any new token needed (flag it — that is a standard change).
8. **Risk**: destructive actions (confirm or undo), payments/consents (no dark patterns), performance (feedback > 400 ms).
9. **Verification**: add a final task "run ux-check on the changed UI".

Keep it proportional: a small button change needs two lines, a new module needs the full list.

## 2. When building
Follow the standard first, then these defaults (details in `.ux/knowledge/` when it exists):
1. Use the project's tokens/theme; no literal colors, sizes or spacing in components.
2. Targets: ≥ 24×24 CSS px always (WCAG 2.5.8); touch ≥ 44pt iOS / 48dp Android / ~40epx Windows for anything important.
3. Contrast: text ≥ 4.5:1 (large ≥ 3:1), UI parts and focus ≥ 3:1, in every theme.
4. Visible focus and full keyboard operation on web/desktop; never remove outlines without replacement.
5. Native semantics first (real buttons/links/labels; platform accessibility APIs for custom controls).
6. Every state implemented; double submit prevented.
7. Destructive actions confirmed proportionally or, better, undoable.
8. Honor system settings: text size, dark mode, reduce motion, reduce transparency, high contrast.
9. Feedback < 100 ms; indicator > 400 ms; skeleton/progress > 1 s; progress + cancel > 10 s.
10. No dark patterns.

When a law or heuristic justifies a decision, name it briefly — never turn laws into numeric limits (read `.ux/knowledge/myths.md` if tempted).

## 3. When the UI change is done
If `check.after_change` is true (default) or the user asks, run **ux-check** on the changed files before declaring the work finished. It is light: it only looks at changed visual files. Without `.ux/` it still runs, with reduced defaults.
