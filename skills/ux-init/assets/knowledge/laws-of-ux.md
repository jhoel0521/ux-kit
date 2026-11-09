# The 30 laws of UX — how to apply and audit them

Base catalogue: Jon Yablonski, lawsofux.com, plus the original research. For each law: **says**, **apply**, **audit**, **careful** (common misuse). "Weight" says how strong the evidence is as an audit criterion:
- **high** — robust empirical model, measurable (Fitts, Doherty, Peak-End, Gestalt).
- **medium** — real but context-dependent (Hick, Jakob, Von Restorff, goal-gradient).
- **guide** — useful for reasoning, not for pass/fail (Occam, Pareto, Parkinson, Tesler).

Before turning any law into a numeric limit, read `myths.md`.

## 1. Perception and grouping (Gestalt)

**Proximity — high.** Nearby elements are seen as a group. Apply: space *between* groups clearly larger than *inside* groups (≈2×); label close to its field. Audit: labels equidistant between fields; uniform spacing everywhere.

**Common region — high.** Elements inside a bounded area are seen as a group. Apply: cards, section backgrounds, subtle borders when proximity is not enough. Audit: cards inside cards inside cards (noise) or important groups without boundaries.

**Similarity — high.** Elements that look alike are seen as related. Apply: everything clickable shares one treatment and nothing static imitates it; one link style. Audit: blue text that is not a link, badges that look like buttons, two styles for the same action.

**Uniform connectedness — high.** Visually connected elements (lines, arrows, continuous backgrounds) feel more related. Apply: steppers with lines, timelines, tabs attached to their panel.

**Prägnanz (simplicity) — high.** Ambiguous shapes are perceived in their simplest form. Apply: simple recognizable icons, clear geometric layouts. Audit: icons with too much detail at 16–24 px; illustrations competing with content.

## 2. Attention and memory

**Selective attention — high.** People attend to what relates to their goal (banner blindness, change blindness). Apply: important notices must not look like ads; announce state changes near where the user looks (and to assistive tech). Audit: critical messages styled as promos; errors appearing far from the field.

**Von Restorff (isolation) — medium.** What differs is noticed and remembered. Apply: **one** primary action per view, distinguished by more than color. Audit: three primary buttons competing; everything bold. Careful: motion as differentiator distracts and can affect vestibular disorders.

**Serial position — medium.** First and last items in a series are remembered best. Apply: key navigation items at the ends. Audit: the most important option buried in the middle.

**Working memory — high.** Temporary, limited (~4 chunks, Cowan 2001). Apply: recognition over recall; keep context visible; never make users carry data between screens (also WCAG 3.3.7). Audit: users must remember a code or option from a previous step.

**Miller's law (7±2) — medium, heavily misused.** Short-term memory holds about 7±2 items (Miller 1956); later research says closer to 4±1 chunks. Apply to information users must **hold in mind without seeing it**: codes, long numbers, multi-step instructions. Do **not** apply to visible menus or lists — they are scanned, not memorized. Audit: asking users to remember > ~4 things; long numbers without grouping.

**Chunking — high.** Grouping into meaningful units eases processing. Apply: `7123 4567`, `4532 7890 1234 5678`; sections with headings; short paragraphs. Audit: walls of text, unformatted long numbers, long forms without sections.

**Zeigarnik effect — medium.** Unfinished tasks are remembered better. Apply: progress for onboarding/profile, "continue where you left off", saved drafts. Careful: permanent red badges or progress that never completes is manipulation.

## 3. Cognitive load and decisions

**Cognitive load — high.** Mental effort to use an interface: intrinsic (the task) vs extraneous (the UI). Only the extraneous is our fault. Apply: remove decoration that does not inform, smart defaults, progressive disclosure, user vocabulary. Audit: elements not helping the task, internal jargon, decisions the system could make.

**Hick–Hyman law — medium.** Decision time grows logarithmically with the number of **equally likely** options and their complexity. Apply: for simple, frequent decisions (CTA, plan choice) prioritize, highlight the recommended option, group the rest, hide advanced ones. Do **not** use as a universal "7 options" limit: in well-categorized menus people search, they don't decide among all. Audit: several actions with the same weight and no recommended one; rare options competing with frequent ones.

**Choice overload — medium.** Too many options can paralyze; evidence is mixed (Scheibehenne et al. 2010) and appears when options are hard to compare. Apply: filters, comparison, "recommended", defaults.

**Mental model — high.** Users have a simplified picture of how the system works. Apply: use the domain's vocabulary and structure (inventory: "receipt", "issue", "stock card", not "transaction type 2"); card sorting when the information architecture is unclear. Audit: navigation mirroring the org chart or database instead of user tasks.

**Cognitive bias — guide.** Systematic thinking errors (anchoring, framing, status quo). Know them to **not exploit** them; status-quo bias makes defaults powerful — pick defaults that benefit the user.

**Occam's razor — guide.** Among equivalent solutions choose the simplest. Before adding a component ask what happens without it.

**Tesler's law (conservation of complexity) — guide.** Every system has irreducible complexity; decide whether the user or the system carries it. Apply: autocomplete addresses, detect card type, compute dates, remember preferences. Careful: removing features experts need moves complexity into workarounds.

## 4. Motor control and time

**Fitts's law — high.** `T = a + b·log2(D/W + 1)`: time grows with distance and shrinks with target size. Apply:
- Minimum sizes (see `platforms.md`): WCAG 2.5.8 24×24 CSS px · iOS 44×44 pt · Android 48×48 dp · Windows touch ~40×40 epx.
- Hit area can exceed the visual (padding, pseudo-elements, `minimumInteractiveComponentSize`, `contentShape`).
- Clickable labels for checkboxes/radios; whole list rows clickable.
- Screen edges/corners are "infinite" targets for mouse.
- One-handed mobile: frequent actions in the thumb zone; destructive actions away from frequent ones.
Audit: measure (render script) or read sizes in code; opposite actions glued together (Save/Delete). Careful: making destructive actions huge and easy.

**Doherty threshold — high.** Productivity soars when system and user interact in < 400 ms (Doherty & Thadani, IBM 1982). Response limits (Nielsen): 0.1 s instant · 1 s keeps flow · 10 s attention limit. Apply: immediate press feedback, optimistic UI for reversible actions, skeletons, progress for long tasks (see `performance.md`). Audit: buttons without pressed/loading state; clicks that show nothing for 2 s.

**Parkinson's law — guide.** Tasks expand to fill the time available. Reduce the time a task *requires* (autofill, express checkout). Never fake urgency with timers (dark pattern).

## 5. Expectations and behavior

**Jakob's law — medium.** Users spend most of their time on other products and expect yours to work the same. Apply: platform conventions (back, tabs, gestures, settings location, standard icons), familiar e-commerce/form patterns; change redesigns gradually. Audit: invented icons for standard actions, non-standard gestures without visible alternative, logo not going home, iOS patterns on Android or vice versa. Careful: Jakob doesn't forbid innovation; innovation must pay its learning cost.

**Paradox of the active user — high.** Users don't read manuals; they start using right away. Apply: contextual help, empty states that teach, skippable onboarding, learn by doing. Audit: mandatory multi-screen tours; critical features only discoverable in docs.

**Postel's law (robustness) — high.** Be liberal in what you accept, conservative in what you send. Apply: accept `7123-4567`, `71234567`, `+591 71234567`; several date formats; trim spaces; case-insensitive emails. Normalize internally, display canonically. Audit: validation rejecting valid formats; fields that block paste; errors caused by a trailing space.

**Pareto principle — guide.** ~80% of effects come from ~20% of causes. Prioritize the most frequent tasks in navigation and performance.

## 6. Emotion and motivation

**Aesthetic–usability effect — medium.** Attractive designs are perceived as easier to use and make people tolerate minor issues (Kurosu & Kashimura 1995). Apply: invest in visual consistency, spacing rhythm, typography, micro-interactions. Careful: it **masks problems in usability tests** (people say it is easy while failing) — measure task success, not just opinion. Aesthetics never justify low contrast.

**Peak–end rule — high.** Experiences are judged by their most intense moment and their end (Kahneman et al. 1993). Apply: identify the emotional peak (achievement, or error/wait/payment rejection) and the end of each flow; design both: success screen with summary and next step, empathetic errors with a way out. Audit: flow ends in a 2-second toast; worst moment has a generic message; data lost after an error.

**Goal-gradient effect — medium.** Effort increases near the goal (Hull 1932; Kivetz et al. 2006). Apply: progress bars in multi-step flows showing real progress. Careful: fake or backwards progress destroys trust.

**Flow — medium.** Full immersion when challenge matches skill (Csikszentmihalyi). Apply: minimal interruptions, immediate feedback, shortcuts for experts (keyboard on desktop, gestures on mobile). Audit: modals interrupting frequent tasks; no shortcuts in a heavy-use desktop app.

## Symptom → laws to check
| Symptom | Laws |
|---|---|
| "I don't know what to do here" | Von Restorff, Hick, cognitive load, Jakob |
| "I can't find X" | Mental model, Jakob, serial position, selective attention |
| "I tapped the wrong button" | Fitts, proximity |
| "It looks messy" | Proximity, common region, similarity, Prägnanz, aesthetic–usability |
| "It feels slow" | Doherty, peak–end |
| "People abandon the form" | Tesler, Postel, goal-gradient, working memory, cognitive load |
| "They don't finish onboarding" | Active user paradox, Zeigarnik, goal-gradient |
| "They complain about the redesign" | Jakob, mental model |
