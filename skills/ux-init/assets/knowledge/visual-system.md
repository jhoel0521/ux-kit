# Visual system — tokens, color, type, spacing, motion

## 1. Design tokens
- **Standard**: the Design Tokens Community Group (W3C CG) published the **first stable spec (2025.10)** in October 2025. JSON with `$value`, `$type`, `$description`, aliases `{group.token}`; types `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`, and composites `typography`, `shadow`, `border`, `transition`, `gradient`, `strokeStyle`. Recommended extension `.tokens.json`.
- Tools: Style Dictionary v4+, Tokens Studio, Figma Variables export, Terrazzo → CSS variables, Tailwind theme, Compose, Swift, XAML, Dart.
- **Three layers**: primitives (`color.blue.600`, `space.4`) → semantic (`color.text.muted`, `color.action.primary`) → component (optional, `button.primary.bg`). Components use **only** semantic tokens.
- `.ux/standard/tokens.json` is **technology-agnostic**: it states values, never framework class names. Each app's theme should consume or mirror it.
- Audit rule: a hex color, arbitrary px value or literal font size inside a component is a finding (`literal-design-values`), except in theme/token files.

## 2. Color
- Roles, not colors: background, surface, text (primary/secondary/disabled), border, action, states (success, warning, error, info), focus.
- Proportion: neutral dominant + one action color + accents (60-30-10 is a starting heuristic, not a law).
- Contrast: 4.5:1 text, 3:1 large text and non-text (see `accessibility.md`). Verify every text/background pair in light **and** dark.
- Never color alone: add icon and text to states.
- Color vision deficiency: avoid red/green-only distinctions.
- OKLCH (CSS Color 4, Tailwind v4) gives perceptually uniform scales; Material uses HCT.
- If the brand color fails contrast as text, use it on surfaces with a contrasting `on-brand`, or create a darker text variant.

## 3. Typography
- Scale: 4–6 sizes per product; 3–4 visible levels per screen. Modular ratios 1.125–1.25 for dense UIs, 1.25–1.333 for content.
- Base: 16px web (never < 12px for functional text, ≥ 14px preferred), 16sp Android, 17pt iOS.
- Scalable units: `rem`, `sp`, Dynamic Type, system text styles. Never fixed px for text on native mobile.
- Line height 1.4–1.6 body, 1.1–1.3 headings; line length 45–75 characters (`max-width: 65ch`).
- 2–3 weights; 1 family, max 2 (text + display or mono). System fonts are fast and native.
- Tabular figures for numbers in tables (`font-variant-numeric: tabular-nums`).
- Web performance: `font-display: swap`, subsetting, preload 1–2 files, variable fonts.

## 4. Spacing, grid, layout
- Scale on base 4 or 8: 0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96. Off-scale values are `spacing-scale` findings.
- Rhythm: more space between groups than within (proximity, ≈2×).
- Grid: 4 columns mobile, 8 tablet, 12 desktop; margins 16 mobile, 24–32 tablet, ≥ 32 desktop.
- Breakpoints by content; container queries for components in variable containers.
- Safe areas: notch, Dynamic Island, gesture bars, Android edge-to-edge insets.
- Density: data/back-office apps may be dense (rows 32–40px with pointer) if they keep 24px minimum and offer a comfortable mode.

## 5. Shape, elevation, borders, layers
- Radii from tokens; same component, same radius; nested radii concentric (inner = outer − padding).
- Few elevation levels (base, raised, overlay, modal). In dark mode elevation = lighter surfaces, not shadows.
- Input borders need ≥ 3:1 against background (WCAG 1.4.11); decorative dividers can be softer.
- Named layers (`dropdown`, `sticky`, `overlay`, `modal`, `toast`) instead of `z-index: 9999`.

## 6. Icons and images
- One icon family (Material Symbols, SF Symbols, Fluent Icons, Lucide, Phosphor, Heroicons), same stroke and optical size (16/20/24).
- Icon-only only for universal actions; otherwise icon + text.
- Interactive icons inside a target of the platform minimum.
- Images: reserved dimensions / `aspect-ratio` (avoid CLS), AVIF/WebP, lazy-loading below the fold, `srcset`.

## 7. Motion
- Purpose: orient, give feedback, show relationships, add personality sparingly. Never filler.
- Durations (without springs): micro 100–150 ms, small 200–250 ms, medium 300–400 ms, large 400–500 ms. Faster on desktop. > 500 ms feels slow.
- Easing: enter decelerate, exit accelerate, in-screen ease-in-out. M3 Expressive and iOS use **springs** (natural, interruptible).
- Interruptible: never make users wait for an animation to act.
- Performance: animate `transform`/`opacity`; keep 60 fps (16.7 ms/frame), 120 on high-refresh screens.
- Reduce motion (`prefers-reduced-motion`, `isReduceMotionEnabled`, Android animator scale): replace movement, zoom, parallax with fades or nothing.
- Nothing flashes > 3 times per second.

## 8. Dark mode and themes
- Not an inversion: very dark grey (#121212 Material, `systemBackground` iOS) instead of pure black for elevated surfaces; text not 100% white (Material ≈ 87% / 60% / 38%).
- Desaturate accents; re-check contrast — never assume it passes.
- Follow the system theme by default + manual option (System / Light / Dark).
- High contrast: `forced-colors` on web, Increase Contrast on iOS, Windows contrast themes.

## 9. Auditing the visual system
1. Inventory: how many distinct colors, font sizes, radii, shadows, spacings exist in code? (`scan.mjs` counts literals.) > ~8 font sizes or ~15 colors outside tokens = broken system.
2. Component consistency across screens.
3. Hierarchy: squint test (grayscale + blur) — does the primary element read first?
4. Contrast in light and dark (`contrast.mjs`, `render.mjs`).
5. Alignment and rhythm on the scale.
6. Platform coherence (`platforms.md`).
7. Token drift: do app themes match `.ux/standard/tokens.json`?
