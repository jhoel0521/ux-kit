# States and components

## 1. State matrix
Every interactive component and every data view is checked against this matrix. An empty cell is a finding.

### Interaction states (components)
| State | Requirement | Notes |
|---|---|---|
| Default | Recognizable as interactive | — |
| Hover | Subtle change, **only** with fine pointer | Never essential info on hover only |
| Focus | Visible ring ≥ 2px, ≥ 3:1, not obscured | Web, desktop, TV, tablets with keyboard |
| Pressed | Feedback < 100 ms | Ripple, highlight, subtle scale |
| Selected (toggle, tab) | Distinct from focus/hover; not color only | `aria-selected`, `aria-pressed`, `Role.Tab` |
| Disabled | Dimmed but readable; explain why if not obvious | Prefer validating on submit over disabling submit |
| Loading | Prevents double submit; keeps width; indicator in place | `aria-busy`, "Saving…" |
| Error | Border/icon + text message | `aria-invalid`, `aria-describedby` |
| Success | Brief confirmation + next step if relevant | — |
| Read-only | Different from disabled: selectable/copyable | `readonly` |

### View states (screens and data regions)
| State | Requirement |
|---|---|
| Initial load | Skeleton shaped like the content (spinner if < 1 s and small) |
| Empty (first use) | Explains what goes here + action to start |
| Empty (no results) | "No results for 'X'" + clear filters / suggestions |
| Empty (all done) | Quiet confirmation ("All caught up") |
| Partial | What's there + "loading more" |
| Load error | Human message + retry + keep what was already shown |
| Offline | Persistent notice, cached data marked, queued actions |
| No permission | Which permission is missing and how to get it |
| Pagination / load more | "Loading more" and "end of list" states |
| Extreme data | Very long text (truncate with tooltip or wrap), big numbers, 0 and 1 items, accents/emoji, RTL if applicable |

## 2. Component checklists

**Buttons.** Verb + object labels ("Save changes"); avoid "OK"/generic "Submit"/"Yes-No" in dialogs. One primary per view/region; secondary (outline/tonal); tertiary (text). Destructive: error color **and** explicit text. Size ≥ platform minimum; stable width when loading. Icon buttons with accessible name + tooltip. Order per platform.

**Links.** Distinguishable from text (underlined in paragraphs). Links navigate; buttons act. Descriptive text; external links/downloads indicated ("opens in new tab", "PDF, 2 MB").

**Inputs.** Persistent visible label; help/format below; error below. Correct type and keyboard (`type="email"`, `inputmode="numeric"`, `KeyboardType.Number`). `autocomplete` / `textContentType` / `autofillHints` for personal data. Height ≥ minimum target; checkbox/radio labels clickable. See `forms-and-content.md`.

**Selectors.** ≤ ~5 options: radios/segmented. 6–15: select. Many: combobox with search. Boolean with immediate effect: switch; boolean saved with "Save": checkbox. Dates: picker + tolerant manual entry.

**Variant selectors (size, color, model).** A very common pattern in shops and catalogs:
- Every option of a group has the **same size**. Status text ("Last units", "Sold out") never goes inside an option, because it makes that option bigger; put it outside, as a legend or next to the price.
- The selected option is **filled** (solid background), not only outlined: with some brand colors a border alone is barely visible.
- A color option shows a **swatch and the color name in text** (WCAG 1.4.1); the name can be visually hidden if it is still available to assistive tech and shown on selection.
- Availability and "low stock" are computed for the **current selection** (the other attributes already chosen), not for the whole product.
- The availability of the **chosen variant** reads next to the price.
- Choosing an option updates price, availability and the action **without reloading the page or moving the scroll**, keeps focus on the option and announces the change (`aria-live="polite"` on the price/availability block). Check it with `render.mjs --interact`.
- The list card and the detail page show the same option with the same component (one source of style).

**Navigation.** Current location always visible. Mobile: 3–5 destinations in a bottom bar. Desktop: visible sidebar or top nav. Breadcrumbs in deep hierarchies. Unique screen titles. URLs restore state (filters, tabs) on web.

**Tables and data lists.** Semantic headers; text left, numbers right with tabular figures; units in headers. Sort, filter, search; adjustable density; sticky header; sticky first column with horizontal scroll. On mobile: cards or prioritized columns, not 12 columns scrolling. Row actions visible or in a named "⋯" menu; bulk actions. Empty/loading/error states; pagination with total.

**Dialogs and sheets.** Only for blocking decisions or short focused tasks. Clear title; focus to first useful element; focus trap; Esc/back closes; focus returns to trigger. Never stacked. Bottom sheets for contextual actions on mobile.

**Notifications.**
| Type | Use | Persistence |
|---|---|---|
| Toast/snackbar | Brief confirmation, optional Undo | 4–10 s; pause on hover/focus |
| Inline banner | Page status (offline, trial ending) | Until resolved/dismissed |
| Inline field error | Validation | Until fixed |
| Dialog | Requires decision | Until decided |
| System notification | Events outside the app | Per OS; opt-in, don't abuse |

**Tooltips and popovers.** Tooltip: short, complementary, on hover **and** focus, Esc dismisses, no actions or essential info. Popover: interactive, opened by click/tap.

**Loading and progress.** < 1 s: nothing or subtle indicator in the control. 1–10 s: skeleton or contextual spinner. > 10 s: determinate bar + estimate + cancel + keep working.

**Search.** Visible field when search is a primary task; `/` or `Ctrl/Cmd+K` on desktop; suggestions, typo and accent tolerance, recents, highlighted results, useful empty state.

**Onboarding.** Skippable; teaches through the real task; empty states as onboarding; permissions requested in context, explaining why.
