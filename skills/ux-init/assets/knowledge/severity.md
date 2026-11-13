# Severity, rules and verdicts

Every ux-kit review uses this scale so results are comparable over time and across projects.

## Levels
| Level | Icon | Meaning |
|---|---|---|
| **blocker** | ❌ | Prevents some users from completing a task, fails WCAG A/AA with real impact, risks user data or money, or is a dark pattern |
| **major** | 🟠 | Causes frequent errors or frustration, or breaks platform conventions |
| **minor** | 🟡 | Light friction or inconsistency |
| **suggestion** | 💡 | Quality improvement, not a defect |
| **pass** | ✅ | Verified and correct |
| **unverifiable** | ❔ | Needs a device, real content, data or user testing that is not available |

Prudence rule: when torn between two levels, pick the lower one and say what evidence would raise it.

## Fixed base (a project cannot lower these)
- `wcag-a-aa` — WCAG 2.2 level A or AA failure with real user impact (missing accessible name, insufficient contrast, focus removed, target < 24 CSS px, zoom blocked, keyboard trap…).
- `dark-pattern` — confirmed deceptive pattern (see `dark-patterns.md`).
- `data-loss` — risk of losing user data (destructive action without confirmation or undo, form cleared after an error).

These are always **blocker**.

## Configurable rules (`.ux/config.yaml` → `severity:`)
| Rule id | Default | What it covers |
|---|---|---|
| `touch-target-platform` | blocker | Fitts (ux-laws): interactive target below the touch minimum (44×44 on mobile, 48dp Android, 64px TV) but ≥ 24px. Applies when the app's `input` (`config.yaml`) is `touch` or `both` — with `auto`, to android/ios and to web; with `input: pointer` (desktop apps, a web used only on computers) the 24px minimum of `wcag-a-aa` applies instead |
| `fitts-reach` | blocker | Fitts (ux-laws): primary CTA or primary navigation outside the bottom third on mobile, or critical controls stuck to the top edge |
| `fitts-spacing` | blocker | Fitts (ux-laws): less than 8px between clickable elements on mobile (4px desktop), or less than 16px between opposite actions (Accept/Cancel, Delete/Edit) |
| `hick-options` | blocker | Hick (ux-laws): more than 7 primary options visible at the same level on one screen, or more than 7 first-level navigation items |
| `hick-steps` | blocker | Hick (ux-laws): form with more than 7 visible fields not split into steps or sections |
| `literal-design-values` | minor | Colors, sizes, spacing written as literals instead of tokens/theme |
| `token-drift` | major | Code value contradicts `.ux/standard/tokens.json` |
| `missing-loading-state` | major | Data view with no loading state |
| `missing-empty-state` | major | List/view with no empty state |
| `missing-error-state` | major | Data view or action with no error handling visible to the user |
| `platform-convention` | major | Breaks a platform convention (back behavior, dialog button order, navigation pattern) |
| `primary-action-competition` | blocker | Hick (ux-laws): several equally prominent primary actions in one view; one and only one must dominate |
| `microcopy` | minor | Generic, ambiguous or technical text in the UI |
| `reduced-motion` | major | Animations without honoring reduced-motion preferences |
| `type-scale` | minor | Too many font sizes / no consistent scale |
| `spacing-scale` | minor | Spacing values off the project scale |
| `form-validation` | major | Validation timing/placement/wording problems (see `forms-and-content.md`) |
| `performance-feedback` | major | No feedback for actions > 400 ms, double submit possible |
| `dark-mode` | minor | Dark theme missing or with unverified contrast (when the product supports themes) |
| `jakob-conventions` | suggestion | Jakob (ux-laws): invented icon or pattern where a convention exists, internal jargon, unexpected position of logo or close button |
| `miller-chunks` | suggestion | Miller (ux-laws): lists/menus with more than 7 items without groups, long numbers without separators, flat long forms |
| `peak-end` | suggestion | Peak-End (ux-laws): flow without a designed peak, end without confirmation + next step, error without a way out, generic success screen |
| `type-levels` | suggestion | Aesthetic-usability (ux-laws): more than 4 type sizes on one screen, more than 2–3 font families in the project |
| `oversized-ui` | minor | Density (ux-laws): controls, fields, padding or text clearly above the app's `density` sizes (`visual-system.md` §4b), e.g. 56px fields in a compact app or body text above the platform size without a reason. Minimums are floors, not targets |
| `aesthetic-consistency` | suggestion | Aesthetic-usability (ux-laws): unlimited palette, mixed icon sets, mixed radii or shadows on components of the same type |

The ux-laws rules are the team's standard: their numbers are project decisions, not universal laws. Cite them as "project rule (ux-laws)" with their id.

Accepted values: `blocker`, `major`, `minor`, `suggestion`, `off`. A rule set to `off` is not reported. Approved exceptions for a specific screen go in `exceptions:` instead.

## Scanner severity vs final severity
Scripts print a **provisional** severity. The final one is decided after confirming the finding in code or on screen, using this file and the project config. Record how many candidates were confirmed, reclassified and discarded.

Common cases:
- **User-agent exception (WCAG 2.5.8):** a native control with no author styling is exempt even if smaller than 24px.
- **Link text (2.4.4, level A):** "here"/"read more" is minor when the sentence or heading gives context; major/blocker when the link is isolated and leads to a key action.

## Verdict
| Verdict | Condition |
|---|---|
| **NOT READY** | ≥ 1 blocker |
| **READY WITH NOTES** | 0 blockers, ≥ 1 major |
| **READY** | 0 blockers, 0 majors |

A blocker means the work is not done: the agent fixes it before declaring the change finished, unless the team lowered that rule in `severity:` or approved an exception. The team always has the last word. Optional score per area: `100 − (25·blockers + 8·majors + 2·minors)`, minimum 0 — only for tracking trends.

## Finding format
```
### [UX-01] Short title — ❌ blocker
- Where: `src/components/Checkout.tsx:42` (or screen/flow/screenshot)
- Rule: wcag-a-aa · WCAG 2.5.8 · Fitts
- Evidence: `<button className="h-6 w-6">` → 24×24 px; Android minimum is 48dp
- Impact: who is affected and how
- Fix: concrete change, with code when short
```
Prefixes: `UX-` usability, `UI-` implementation, `DS-` visual/design system, `A11Y-` accessibility, `PLAN-` plan review.

## Reports
Write reports in the language of the conversation. Save to `.ux/reports/YYYY-MM-DD-<skill>-<scope>.md` with the standard version they were made against (from `.ux/standard/CHANGELOG.md`). If `.ux/` does not exist, show the report in the chat and offer to save it. If you cannot write files (e.g. running as a sub-agent), return the report as text.
