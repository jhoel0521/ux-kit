---
name: ux-laws
description: "Applies the 6 core laws of UX (Jakob, Hick, Fitts, Miller, Peak-End, Aesthetic-Usability), also known in Spanish as leyes UX, apogeo y final, estética-usabilidad, when designing or building any user interface. Use it EVERY time the user asks to create, change or review UI/UX on any platform — web, mobile, desktop, Tauri, React, forms, menus, navigation, layouts, buttons, screens, dashboards, landing pages, components, modals, wizards, onboarding, micro-interactions, checkout flows, settings or any interactive visual element. Also use it when discussing usability, touch accessibility, visual hierarchy, grouping information, reducing options, user experience, or when evaluating an existing design. Fitts and Hick are blocking (the work is not delivered while they fail); the other laws are suggestions."
license: MIT
compatibility: Any agent supporting SKILL.md. Reads .ux/config.yaml (severity overrides, exceptions) when ux-init has created it; works without it.
metadata:
  version: "0.2.0"
  profile: core
  kit: ux-kit
---

# ux-laws

Makes sure every interface meets 6 scientifically validated UX principles. Apply it before delivering any UI.

These rules are the **team's standard**. The numeric limits (7 options, 44 px, 8 px, 4 type sizes) are deliberate team decisions, not universal laws: cite them as "project rule", not as science. A project changes them only in `.ux/config.yaml → severity:` (by the id shown in the checklist) or approves a case in `exceptions:`.

## The 6 laws (executive summary)

| Law | Core | Level |
|---|---|---|
| **Jakob** | Users expect your UI to work like the ones they already know | Suggestion |
| **Hick** | More options = more time to decide. Reduce and group | **BLOCKING** |
| **Fitts** | Time to reach a target depends on its size and distance | **BLOCKING** |
| **Miller** | Short-term memory handles 5–9 items. Apply chunking | Suggestion |
| **Peak-End** (apogeo y final) | Users remember the most intense moment and the end | Suggestion |
| **Aesthetic-Usability** | What looks attractive is perceived as more usable | Suggestion |

## Mandatory flow

Follow this order when building or reviewing UI.

### 1. Before coding: plan with the blocking laws

Before writing markup or styles, answer:

- **(Hick)** How many primary options will this screen have? If more than 7 are visible at once, **stop and regroup** before going on. Read `references/hick.md` for grouping criteria.
- **(Fitts)** What are the touch targets? List each one with its target size and screen zone. If any critical button is outside the reachable zone or below 44×44 px on mobile, **block the delivery**. Read `references/fitts.md`.

### 2. While building: apply the suggestions

Keep the other 4 laws in mind while building. They do not block, but they must be recorded as conscious decisions:

- **(Jakob)** Am I using patterns the user already knows? (hamburger = menu, magnifier = search, X = close). If I invent a new pattern, justify it. See `references/jakob.md`.
- **(Miller)** Am I showing more than 7 ungrouped items? If so, apply chunking. See `references/miller.md`.
- **(Peak-End)** What is the peak moment of the flow? How does it end? Both must be memorable. See `references/peak-end.md`.
- **(Aesthetic-Usability)** Is the visual hierarchy clear? Are typography, spacing and color consistent? See `references/aesthetic-usability.md`.

### 3. Before delivering: final checklist

Run this checklist and report the result to the user. "Mobile" means the app's `input` is `touch` or `both` (`config.yaml`; with `auto`, android/ios and web). A web declared `input: pointer` uses the desktop sizes. The sizes are **minimums**: size controls by the app's `density` (`.ux/knowledge/visual-system.md` §4b), never by inflating every control to the minimum and beyond. **Do not deliver while a BLOCKING item fails** (unless the project lowered that rule or approved an exception):

<!-- ux-laws:checklist:start -->
```
BLOCKING (do not deliver while one fails)                                        rule id
[ ] Fitts — every touch target ≥ 44×44 px on mobile (48dp Android) / ≥ 24×24 px on desktop    touch-target-platform
[ ] Fitts — critical buttons (CTAs, primary navigation) in the reachable zone              fitts-reach
[ ] Fitts — ≥ 8 px between clickable elements on mobile (≥ 4 px desktop), ≥ 16 px between opposite actions    fitts-spacing
[ ] Hick — at most 7 primary options visible per screen, at most 7 first-level navigation items    hick-options
[ ] Hick — complex tasks split into steps or sections (forms with more than 7 fields)      hick-steps
[ ] Hick — the primary CTA visually stands out over secondary options                    primary-action-competition

SUGGESTIONS (report when they fail; they do not block)
[ ] Jakob — icons and patterns follow the platform's standard conventions               jakob-conventions
[ ] Miller — lists/menus with more than 7 items grouped into recognizable chunks        miller-chunks
[ ] Miller — long data (phones, cards, codes) formatted in groups                       miller-chunks
[ ] Peak-End — the peak moment of the flow is designed on purpose                       peak-end
[ ] Peak-End — the final screen leaves a positive impression (clear confirmation, obvious next step)    peak-end
[ ] Aesthetic — at most 4 type sizes per screen (3 hierarchy levels + 1 small label), 2–3 font families    type-levels
[ ] Aesthetic — consistent spacing system (multiples of 4 or 8)                         spacing-scale
[ ] Aesthetic — limited, coherent color palette; one icon set; consistent radii        aesthetic-consistency
[ ] Density — sizes follow the app's density; minimums are floors, not targets          oversized-ui
```
<!-- ux-laws:checklist:end -->

When delivering, show the user:

- ✅ the items met
- ❌ the blocking items that fail (with the mandatory fix)
- ⚠️ the suggestions not met (with an optional recommendation)
- ❔ the items that cannot be verified from code (they need the running screen or a device)

## When to load each reference

The files in `references/` are split by law so they don't inflate the context. Load them only when needed:

| Situation | Reference to load |
|---|---|
| Designing buttons, touch areas, element position on mobile | `references/fitts.md` |
| Defining menus, options, long forms, CTA hierarchy | `references/hick.md` |
| Choosing icons, terminology, general layout, navigation | `references/jakob.md` |
| Structuring long lists, formatting data, grouping information | `references/miller.md` |
| Designing complete flows (checkout, onboarding, errors, success) | `references/peak-end.md` |
| Defining the visual system, typography, color, spacing | `references/aesthetic-usability.md` |

The code examples in the references use React + Tailwind. For other stacks, `.ux/knowledge/stacks/<stack>.md` (when `ux-init` has created it) says where to check the same thing.

## Where the numbers come from

| Rule | Basis | Kind |
|---|---|---|
| 24×24 px minimum | WCAG 2.2 SC 2.5.8 (AA) | Standard |
| 44×44 on mobile | Apple HIG (44×44 pt); WCAG 2.2 SC 2.5.5 (AAA, 44×44 CSS px) | Standard |
| 48×48 dp on Android | Material Design accessibility guidance | Standard |
| 8 px between targets | Material Design: touch targets of at least 48×48 dp with at least 8 dp between them | Standard |
| 16 px between opposite actions | Team rule to keep Accept/Cancel and Delete/Edit apart | Team rule |
| Density levels (compact / comfortable / spacious) | Material density steps of −4 dp per level; Carbon field heights 32 / 40 / 48 px | Standard, configurable per app |
| ≤ 7 primary options, forms > 7 fields in steps | Hick–Hyman (1952) shows decision time grows with options; the number 7 is the team's limit (Miller 1956 is about memory, not visible options) | Team rule |
| 5–9 items to remember, chunking | Miller (1956); later research suggests about 4 chunks (Cowan 2001) | Research |
| ≤ 4 type sizes per screen | No study fixes a number. Ant Design keeps a system to 3–5 sizes; design guides commonly use 3 hierarchy levels and call 5–6 on one screen noise | Team rule, aligned with design systems |
| Peak-End | Kahneman et al. (1993) | Research |
| Aesthetic-usability | Kurosu & Kashimura (1995) | Research |
| Fitts | Fitts (1954) | Research |

## How it fits with the rest of ux-kit

- **ux-guide** asks you to declare these laws in the plan (step 1) and to apply them while building (step 2).
- **ux-check** runs the same checklist on the changed screens and names the law and rule id in every finding.
- **ux-plan-review** checks that a plan declares the blocking laws.
- If `.ux/config.yaml` exists, its `severity:` values for the ids above replace the levels shown here, and its `exceptions:` approve specific cases.

If a UX law conflicts with a technical constraint, the BLOCKING laws (Fitts/Hick) come first; then negotiate with the user.

## Quick rules you must never break

1. **Never put a critical button below 44×44 px on mobile**, whatever the design asks.
2. **Never show more than 7 primary options** without grouping or reducing them.
3. **Never use invented icons** when a convention exists (gear = settings, envelope = messages, etc.).
4. **Never end an important flow without a clear closing screen or message** (Peak-End).
5. **Never use more than 4 type sizes** on one screen (3 hierarchy levels — heading, subheading, body — plus one small size for labels) without a justification.

## Example

**Request**: "Build a checkout screen in React"

The answer must:

1. Before coding, state:

   > Applying UX laws:
   >
   > - Hick: I'll split the checkout into 3 steps (shipping, payment, confirmation) instead of one form.
   > - Fitts: the "Pay" button will be 56 px tall, full width, at the bottom of the screen.
   > - Miller: form fields grouped in blocks of 3–4 (address, contact, payment).
   > - Peak-End: confirmation screen with an animation, order number and a clear tracking CTA.

2. Then write the code.

3. At the end, show the checklist marked.
