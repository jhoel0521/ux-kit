# Contributing to ux-kit

Thanks for helping! ux-kit aims to be useful for any agent, any methodology and any stack.

## Ground rules
1. **Skills stay portable.** Only the standard `SKILL.md` frontmatter fields: `name`, `description`, `license`, `compatibility`, `metadata`. No agent-specific syntax in skill bodies. Test changes in at least two agents.
2. **No cross-skill file dependencies.** Shared material lives in `skills/ux-init/assets/` and is copied to `.ux/` in the user's project; other skills read `.ux/`.
3. **The core knows no methodology.** OpenSpec, Scrum, Jira, logs… belong in integration skills (`ux-<tool>`), never in the core.
4. **Evidence or explicit standard.** Every normative or numeric claim in `knowledge/` cites its source. The numeric limits of `ux-laws` are the team's standard: they are labeled as project rules, have a severity id and can be changed in `config.yaml`.
5. **Blockers stop delivery, the team decides.** The agent fixes blockers before declaring a change finished; the team can lower any configurable rule or approve an exception. Skills never take decisions about users, brand or scope on their own.

## Common contributions
| Contribution | Where |
|---|---|
| New stack | `skills/ux-init/assets/knowledge/stacks/<stack>.md` + rules in `scripts/scan.mjs` + a fixture in `tests/fixtures/` |
| New integration | `skills/ux-<tool>/SKILL.md` (does not modify the core) |
| Knowledge | `skills/ux-init/assets/knowledge/*.md`, with sources. The 6 core laws live in `skills/ux-laws/` |
| Translations | `README.<lang>.md`; skills stay in English, reports follow the project language |

## Testing scripts
```bash
node --test tests/scripts.test.mjs
```
Run it before and after changing a script. The `render.mjs` test runs only when `UX_PLAYWRIGHT_DIR` points to a folder with Playwright and Chromium installed (`npm i playwright && npx playwright install chromium`). If a scanner change is intended, update `tests/expected/monorepo-scan.json` and say why in the PR.

To look at the output by hand:
```bash
node skills/ux-init/assets/scripts/detect.mjs tests/fixtures/monorepo --md
node skills/ux-init/assets/scripts/scan.mjs tests/fixtures/monorepo --platform mobile
node skills/ux-init/assets/scripts/tokens.mjs skills/ux-init/assets/templates/standard/tokens.json
```
Fixtures contain **intentional** UX/accessibility errors; every scanner rule should have a case there.
