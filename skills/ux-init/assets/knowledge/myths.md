# Myths and misuses — what NOT to recommend

Check this before reporting "violates law X". Repeating myths costs credibility and leads teams to worse decisions.

The numeric limits of `ux-laws` (7 primary options, forms with more than 7 fields split into steps or sections, 44px targets, 8/16px spacing, 4 type sizes) are **not** myths here: they are the team's standard. Apply them as project rules and cite them by their rule id; don't present them as universal science.

## UX-law myths
| Myth | Reality | Do instead |
|---|---|---|
| "3-click rule" | No empirical support (Porter 2003; NN/g): satisfaction depends on each click being obvious | Improve information scent |
| "People don't scroll" | False for over a decade; people scroll when there are cues of more content | Avoid false bottoms; keep the most important content high |
| "Beautiful = usable" | Aesthetics raise *perceived* usability, not actual usability | Measure success and errors, not only opinion |
| "Hamburger menus are always bad" | They reduce discovery when hiding primary navigation that would fit | Mobile: bottom bar with 3–5 primary destinations; "More"/drawer for secondary. Desktop: visible navigation |
| "Always undo, never confirm" | Undo beats confirmation for reversible actions, but some actions are irreversible | Undo for reversible; specific confirmation ("Delete 3 products") for irreversible; extra step for critical |

## Bad technical practices
| Practice | Why not | Instead |
|---|---|---|
| `outline: none` / `focus:outline-none` without replacement | Breaks WCAG 2.4.7 | `:focus-visible` ring ≥ 2px, ≥ 3:1 contrast |
| Placeholder as the only label | Disappears while typing, low contrast, poor AT support | Visible label; placeholder only as example |
| `user-scalable=no` / `maximum-scale=1` | Blocks zoom (WCAG 1.4.4) | Remove; fix the layout that "broke" |
| `div`/`span` with click handlers | No focus, role or keyboard | Native buttons/links; `clickable(role=…)` in Compose; `Button` in SwiftUI |
| Disabled submit with no explanation | User doesn't know what's missing; poor contrast, no focus | Keep enabled and show errors on submit, or explain the requirement |
| Toasts for important errors | They vanish, far from focus, hard for screen readers | Persistent inline message + live region |
| Modals on top of modals | Lost context, focus traps | Dedicated page/panel or steps |
| Spinners for everything | No progress or structure | Skeletons for content; determinate progress when total is known |
| Autoplay carousels | Banner blindness, low engagement, WCAG 2.2.2 if not pausable | Prioritized static content; no autoplay or a pause control |
| Text inside images | Doesn't scale, translate or get read | Real text over images with guaranteed contrast |
| Icon-only buttons everywhere | Few icons are universal (search, close, home, print) | Icon + text, or at least accessible name + tooltip |
| Infinite scroll for content with footer or targeted lookup | Footer unreachable; position lost | Pagination or "Load more"; restore position |
| Validate while typing from the first character | Premature errors, anxiety | Validate on blur and submit; live positive feedback only for rules like passwords |
| Color as the only signal | ~8% of men have color vision deficiency | Color + icon + text |
| Glass/transparency over variable backgrounds | Unpredictable contrast | Opaque fallback or scrim; honor "reduce transparency" |
| `!important`, `z-index: 9999`, magic numbers | Design-system debt | Tokens and named layers |

## APCA and WCAG 3
APCA is **not** part of any current standard: it was removed from the WCAG 3 draft in 2023, and as of April 2026 WCAG 3 has not defined its contrast algorithm; the final version is not expected before ~2030. The requirement in force is the WCAG 2.x ratio. Teams using APCA for reading quality must still pass WCAG 2.x, or document the decision.
