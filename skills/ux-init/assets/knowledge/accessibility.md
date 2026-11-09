# Accessibility — WCAG 2.2 AA across platforms

## 1. Status of standards (2026)
- **WCAG 2.2** (W3C Recommendation, Oct 2023) is the standard in force. Default target: **AA**.
- 2.2 adds 9 criteria and removes 4.1.1 Parsing.
- **WCAG 3.0** is still a Working Draft (March 2026) with a different scoring model and no contrast algorithm defined. Do not use it for conformance.
- WCAG is written for the web but applies to native and desktop apps via **WCAG2ICT** and **EN 301 549**.

## 2. Level A + AA checklist

### Perceivable
| SC | Level | Requirement |
|---|---|---|
| 1.1.1 Non-text content | A | Informative images have alternatives; decorative ones are hidden (`alt=""`, `contentDescription = null`, `.accessibilityHidden(true)`) |
| 1.2.x Media | A/AA | Captions, transcripts, audio description when applicable |
| 1.3.1 Info and relationships | A | Semantic structure: headings, lists, tables with headers, labels tied to fields, groups (`fieldset`) |
| 1.3.2 Meaningful sequence | A | Reading order = logical visual order |
| 1.3.4 Orientation | AA | Don't lock portrait/landscape unless essential |
| 1.3.5 Identify input purpose | AA | `autocomplete` on personal-data fields; `textContentType` / `autofillHints` natively |
| 1.4.1 Use of color | A | Information not conveyed by color alone |
| 1.4.3 Contrast (minimum) | AA | Text ≥ 4.5:1; large text (≥ 24 px, or ≥ 18.66 px bold) ≥ 3:1 |
| 1.4.4 Resize text | AA | Works at 200% without loss; zoom not blocked |
| 1.4.5 Images of text | AA | Real text, not images of text |
| 1.4.10 Reflow | AA | No horizontal scrolling at 320 CSS px width (except tables, maps…) |
| 1.4.11 Non-text contrast | AA | Input borders, informative icons, component states, focus: ≥ 3:1 |
| 1.4.12 Text spacing | AA | Survives line-height 1.5, paragraph 2×, letter 0.12em, word 0.16em |
| 1.4.13 Content on hover/focus | AA | Tooltips dismissible (Esc), hoverable, persistent |

### Operable
| SC | Level | Requirement |
|---|---|---|
| 2.1.1 Keyboard | A | Everything operable by keyboard (web/desktop; external keyboards on tablets) |
| 2.1.2 No keyboard trap | A | Focus can leave every component; dialogs return focus on close |
| 2.1.4 Character key shortcuts | A | Single-key shortcuts can be turned off or remapped |
| 2.2.1 Timing adjustable | A | Time limits can be extended (warn before session timeout) |
| 2.2.2 Pause, stop, hide | A | Auto-moving content > 5 s can be paused |
| 2.3.1 Three flashes | A | Nothing flashes more than 3 times per second |
| 2.4.1 Bypass blocks | A | Skip link or landmarks |
| 2.4.2 Page titled | A | Descriptive, unique title per screen |
| 2.4.3 Focus order | A | Logical order; no positive `tabindex` |
| 2.4.4 Link purpose | A | Link text understandable in context |
| 2.4.5 Multiple ways | AA | Search, sitemap or navigation to reach pages |
| 2.4.6 Headings and labels | AA | Descriptive |
| 2.4.7 Focus visible | AA | Focus indicator always visible |
| 2.4.11 Focus not obscured (min) | AA | **New in 2.2**: focused element not fully hidden by sticky headers, cookie banners, chat widgets |
| 2.5.1 Pointer gestures | A | Multi-point/path gestures have single-pointer alternatives |
| 2.5.2 Pointer cancellation | A | Activate on up-event, or abortable |
| 2.5.3 Label in name | A | Accessible name contains the visible text (voice control) |
| 2.5.4 Motion actuation | A | Shake/tilt has an alternative and can be disabled |
| 2.5.7 Dragging movements | AA | **New in 2.2**: drag-and-drop has a single-pointer alternative |
| 2.5.8 Target size (min) | AA | **New in 2.2**: ≥ 24×24 CSS px, or spaced so 24 px circles don't overlap. Exceptions: inline in text, equivalent control available, user-agent control, essential |

### Understandable
| SC | Level | Requirement |
|---|---|---|
| 3.1.1 Language of page | A | `lang` set |
| 3.1.2 Language of parts | AA | Other-language fragments marked |
| 3.2.1 / 3.2.2 On focus / on input | A | No unexpected context changes |
| 3.2.3 Consistent navigation | AA | Same order across screens |
| 3.2.4 Consistent identification | AA | Same component, same name |
| 3.2.6 Consistent help | A | **New in 2.2**: help mechanisms in the same relative order on every screen |
| 3.3.1 Error identification | A | Error identified and described in text |
| 3.3.2 Labels or instructions | A | Visible labels and format instructions |
| 3.3.3 Error suggestion | AA | How to fix it |
| 3.3.4 Error prevention (legal, financial, data) | AA | Reversible, checked or confirmed |
| 3.3.7 Redundant entry | A | **New in 2.2**: don't ask again for data already entered in the same process |
| 3.3.8 Accessible authentication (min) | AA | **New in 2.2**: no cognitive tests to log in without alternative — allow paste, password managers, passkeys, magic links |

### Robust
| SC | Level | Requirement |
|---|---|---|
| 4.1.2 Name, role, value | A | Custom components expose role, name and state |
| 4.1.3 Status messages | AA | Status messages announced without moving focus |

Useful AAA practices: 2.4.12 focus not obscured (enhanced), 2.4.13 focus appearance (≥ 2 px perimeter, ≥ 3:1 between states), 2.5.5 target 44×44, 1.4.6 contrast 7:1, 3.3.9 authentication (enhanced).

## 3. Accessibility APIs by platform
| Concept | Web | Jetpack Compose | Android View | SwiftUI | UIKit | Flutter | React Native | WinUI/XAML |
|---|---|---|---|---|---|---|---|---|
| Name | `<label>`, `aria-label` | `contentDescription`, `semantics { }` | `contentDescription`, `labelFor` | `.accessibilityLabel` | `accessibilityLabel` | `Semantics(label:)` | `accessibilityLabel` | `AutomationProperties.Name` |
| Role | native element, `role` | `Role.Button`, `clickable(role=)` | widget class | `.accessibilityAddTraits(.isButton)` | `accessibilityTraits` | `Semantics(button: true)` | `accessibilityRole` | control type / `AutomationPeer` |
| State | `aria-checked/expanded/disabled` | `stateDescription`, `toggleableState` | `stateDescription` | `.accessibilityValue` | `accessibilityValue` | `Semantics(checked:)` | `accessibilityState` | `AutomationProperties` |
| Hide decorative | `alt=""`, `aria-hidden` | `contentDescription = null` | `importantForAccessibility="no"` | `.accessibilityHidden(true)` | `isAccessibilityElement = false` | `ExcludeSemantics` | `accessible={false}` | `AccessibilityView="Raw"` |
| Group | semantic container | `semantics(mergeDescendants = true)` | focusable container | `.accessibilityElement(children: .combine)` | `shouldGroupAccessibilityChildren` | `MergeSemantics` | `accessible` on parent | — |
| Announce | `aria-live` | `liveRegion` | `accessibilityLiveRegion` | `AccessibilityNotification.Announcement` | `UIAccessibility.post` | `SemanticsService.announce` | `announceForAccessibility` | `RaiseNotificationEvent` |
| Min target | CSS min-size | `minimumInteractiveComponentSize()` | `minHeight/minWidth 48dp` | `.frame(minWidth:44,minHeight:44)` + `.contentShape` | enlarged `point(inside:)` | `MaterialTapTargetSize.padded` | `hitSlop` | `MinHeight/MinWidth` |
| Scalable text | `rem`, zoom allowed | `sp` | `sp` | Dynamic Type | `UIFontMetrics` | `textScaler` | `allowFontScaling` | system text scale |
| Screen reader | NVDA, JAWS, VoiceOver | TalkBack | TalkBack | VoiceOver | VoiceOver | both | both | Narrator |
| Tooling | axe, Lighthouse, WAVE | Accessibility Scanner, Compose UI Check | Accessibility Scanner | Accessibility Inspector, `performAccessibilityAudit()` | same | `meetsGuideline` | Inspector/Scanner | Accessibility Insights |

## 4. Minimum manual tests (≈15 min per screen)
1. **Keyboard** (web/desktop): Tab through everything; visible focus, logical order, Enter/Space/Esc work, focus returns after closing dialogs.
2. **Zoom 200% / 400%** (web) or largest system font (mobile): nothing cut or overlapping.
3. **Screen reader** on the main flow: name, role, state announced; errors announced.
4. **Dark mode / high contrast / reduce motion / reduce transparency** on.
5. **Grayscale**: everything understandable without color.
6. **320 px width** (web): no horizontal scroll.

## 5. Regulations (not legal advice)
- **EU — European Accessibility Act**: mandatory since 28 June 2025 for e-commerce, banking, transport, e-books, telecom, etc. Met via EN 301 549 (references WCAG 2.1 AA; revision moving to 2.2 AA). Only service micro-enterprises are exempt. Requires an accessibility statement.
- **US**: ADA (case law applies to websites), Section 508 (federal, WCAG 2.0 AA), DOJ Title II rule for state/local governments (WCAG 2.1 AA).
- **Latin America**: several countries regulate public websites (e.g. Brazil eMAG, Colombia NTC 5854). Where no specific rule exists, use WCAG 2.2 AA as the technical reference.
- Recommend specialized legal advice for compliance questions.
