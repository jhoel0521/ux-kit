---
name: ux-discover
description: Define or update the project's UX standard in .ux/standard/ — who the users are and their context, analysis of similar products, interview questions for real users, brand (logo, voice, colors, typography) and technology-agnostic design tokens with verified contrast. Updates by parts ("the brand changed", "supervisors now use it on tablets"), records every change in a versioned CHANGELOG and reports which apps became misaligned. Use when starting a product, before a redesign, when users or brand change, or when the user asks for discovery, personas, benchmark, brand guide, color palette or design tokens.
license: MIT
compatibility: Any agent supporting SKILL.md. Web research needs a search tool; otherwise uses links/screenshots provided by the user. Scripts need Node.js 18+ and .ux/ from ux-init.
metadata:
  version: "0.2.1"
  profile: core
  kit: ux-kit
---

# ux-discover

Defines **what good looks like for this product**, independent of technology. Everything else in ux-kit is measured against it. It does not change backlog items or code by itself: after the impact report it only offers next steps, and acts on them only after an explicit yes.

Requires `.ux/` (if missing, run ux-init first — say so in one line). Write the documents in `config.yaml → project.language`.

## 1. Decide the scope
- **First time** (templates still have `{{…}}`): go through all parts below, in order.
- **Update**: do only the parts the user mentions ("the brand changed" → brand + tokens; "new user type" → users, maybe platforms). If unclear, ask which part changed.

Ask questions in one batch (use the agent's question tool if available). Prefer showing options over open questions. Never invent facts about users or brand: unknowns stay as `{{to confirm}}`.

## 2. Parts
**Users → `users.md`.** Profiles with role, context of use (device, environment, one hand, gloves, connectivity), frequent tasks in order, pain points, special needs, which apps they use. Glossary (one term per concept, terms to avoid). 3–5 product principles in priority order. Update `config.yaml → apps[].users` (ask to confirm).

**References → `references.md`.** Similar products for the same users or tasks: what to take, what to avoid, conventions users already know (Jakob's law). If a web search tool is available, research; otherwise ask for links or screenshots. Cite sources.

**User questions → `user-questions.md`.** A 20–30 minute script per profile: "show me the last time you…", pain points, context, trust. Recommend 3–5 participants per profile. Add a log table for answers.

**Brand → `brand.md` + `tokens.json`.**
- Ask for logo files (paths in the repo or attachments), personality/voice, existing brand colors and fonts.
- Build tokens in DTCG format: primitives (brand scale, neutrals, status colors, spacing on base 4/8, type scale, radii, durations) → semantic tokens for light and dark (`bg`, `surface`, `text`, `text-muted`, `border`, `action`, `on-action`, `danger`, `success`, `warning`, `focus`). Values only, never framework classes.
- Set `$extensions["ux-kit.status"]` to `"defined"` once the team confirms the values (ux-check then reports token drift against them). Update or remove `$extensions["ux-kit.status-by-section"]` so it only lists sections still unconfirmed.
- Declare contrast pairs in `$extensions["ux-kit.contrast-pairs"]` and validate:
  ```bash
  node .ux/scripts/tokens.mjs .ux/standard/tokens.json
  node .ux/scripts/contrast.mjs "<fg>" "<bg>"
  ```
  If the brand color fails as text, propose a darker text variant (`node .ux/scripts/contrast.mjs <fg> <bg> --suggest`) or an `on-brand` pair; the user decides.
- Platforms: confirm `config.yaml → platforms` and accessibility level.

## 3. Confirm and record
1. Show a compact before → after per file changed. Wait for confirmation.
2. Write the files.
3. Bump the standard version in `.ux/standard/CHANGELOG.md` (minor for additions, major for changes that make existing UI non-compliant, e.g. new action color) with date, what changed, why, who asked.

## 4. Impact (updates only)
1. Find what is now misaligned: for each app in `config.yaml → apps`, compare its theme file with the new tokens; search the code for old values (e.g. the previous action color) with grep or `node .ux/scripts/scan.mjs <app-path> --json` (inventory section).
2. Report: "standard 1.2.0 → 2.0.0: action color changed. Misaligned: backoffice (theme.css + 14 literal uses), campo (Color.kt). Aligned: admin."
3. Offer next steps: create tasks with an enabled integration (e.g. ux-scrum backlog items, an OpenSpec change via ux-openspec) or fix directly now. Do not act without a yes.
4. Older reports in `.ux/reports/` were made against the previous version — mention it.
