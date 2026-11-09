---
name: ux-plan-review
description: Review an agent's plan from the UX/UI point of view before the human approves it — whatever its format (an OpenSpec change with proposal/design/tasks, a plan-mode plan, a TASKS.md, a spec, a PRD or plain text). Checks flow, states, platform conventions, accessibility, content, visual standard and risks against the project's .ux/ standard, lists what is missing and asks whether to amend the plan. Advisory only; never blocks. Use when the user says "review the plan", "check this proposal for UX", "is this design ready?", or before approving any plan that touches UI.
license: MIT
compatibility: Any agent supporting SKILL.md. Uses .ux/ from ux-init when present.
metadata:
  version: "0.1.0"
  profile: core
  kit: ux-kit
---

# ux-plan-review

Reviews **what is about to be built**, when fixing it is cheapest. Informs and asks; the team decides what gets implemented.

## 1. Find the plan
The plan the user points to, or the most recent one in the conversation or working tree (e.g. `openspec/changes/<name>/` proposal + design + tasks + spec deltas, a plan file, a task list). If several candidates exist, ask which one. Read `.ux/config.yaml`, the relevant parts of `.ux/standard/` and `.ux/knowledge/severity.md`.

## 2. Review against these points
For each point, decide: covered ✅ · missing or weak (with severity) · not applicable.
1. **Users and context** — does the plan say who uses it and where (from `users.md`)? Does the design fit that context?
2. **Flow** — start to end, one primary action per screen, how it ends (Peak–end), how users recover from errors.
3. **States** — loading, empty, error, success, offline, permissions (`states-and-components.md`).
4. **Platform** — conventions for each target platform/app (`platforms.md`).
5. **Accessibility** — names, focus/keyboard, target sizes, contrast in all themes, text scaling, alternatives to drag/gestures (`accessibility.md`).
6. **Content** — glossary terms, error messages that explain the fix, empty-state copy.
7. **Visual standard** — uses existing tokens/components; new tokens flagged as a standard change (→ ux-discover).
8. **Forms** — fields justified, validation timing, data preserved on error (`forms-and-content.md`).
9. **Risk** — destructive actions, payments/consents (dark patterns), data loss.
10. **Performance** — feedback for slow operations, long lists.
11. **Verification** — a task to run ux-check after implementation.
Check laws only to justify gaps; never request changes based on myths (`myths.md`).

## 3. Report and ask
Write findings with prefix `PLAN-` in the format of `severity.md`, most important first, each with a concrete addition to the plan (the sentence or task to add). Then ask: **"Do you want me to add these to the plan?"** (all, some by ID, or none).
- Yes → edit the plan files in place, keeping their format (e.g. add requirements/scenarios to an OpenSpec spec delta, tasks to `tasks.md`, a section to `design.md`). Do not touch code.
- No → leave the plan as is. Save the review to `.ux/reports/YYYY-MM-DD-ux-plan-review-<name>.md` either way.
