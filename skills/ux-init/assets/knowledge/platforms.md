# Platform conventions

Jakob's law applied: each platform has its own expectations. A cross-platform product can share brand and tokens, but **navigation, gestures, dialogs and sizes** must follow the platform it runs on.

## 1. Sizes and units
| Platform | Unit | Min touch target | Recommended | Notes |
|---|---|---|---|---|
| WCAG 2.2 (all) | CSS px | 24×24 (AA, 2.5.8) | 44×44 (AAA, 2.5.5) | Legal minimum on the web |
| Android / Material 3 | dp | 48×48 | 48–56 | Hit area can exceed the visual (24dp icon in 48dp box). Spacing ≥ 8dp |
| iOS / iPadOS | pt | 44×44 | 44–48 | HIG asks 44×44 for every touch control |
| visionOS | pt | 60×60 | — | Gaze + gesture |
| macOS | pt | 20–28 (pointer) | — | Compact controls with precise pointer |
| Windows / Fluent | epx | ~40×40 touch (7.5 mm) | — | Compact 24–32 epx only for pointer |
| TV / 10-foot | px | 64–80 | — | D-pad focus must be very visible |
| Web desktop | CSS px | 24 (AA) | 32–44 | Form buttons usually 36–44 tall |

Base text: Android 16sp (Body Large), iOS 17pt (Body), Windows 14 epx (Body), web 16px. Never block system text scaling.

## 2. Material 3 and M3 Expressive (Android, Compose, Flutter, Material Web, MUI-inspired)
- **Color roles**: `primary/onPrimary`, `primaryContainer/onPrimaryContainer`, `secondary`, `tertiary`, `error`, `surface`, `surfaceContainer{Lowest…Highest}`, `onSurface`, `onSurfaceVariant`, `outline`, `outlineVariant`. `X`/`onX` pairs are designed for contrast; don't mix roles randomly. Dynamic color (Material You).
- **Type scale**: Display / Headline / Title / Body / Label × Large/Medium/Small.
- **Shape**: corner tokens extra-small (4dp) → extra-large (28dp) and `full`.
- **Elevation**: tonal surfaces more than shadows.
- **Adaptive layout by window size class**: compact (< 600dp) → bottom navigation bar; medium (600–840dp) → navigation rail; expanded (≥ 840dp) → rail or permanent drawer, list-detail panes.
- **M3 Expressive (2025)**, backed by Google with 46 studies / 18,000+ participants (vendor data): spring-based motion physics; 35 new shapes and shape morphing; button groups, split button, FAB menu (replaces speed dial), loading indicator (for loads < 5 s), toolbars (docked toolbar replaces the deprecated bottom app bar), XS–XL button sizes. Use expressiveness to highlight the key action, not everywhere.
- **Android conventions**: system back always works predictably (predictive back on 14+); edge-to-edge mandatory when targeting SDK 35 (Android 15) — handle `WindowInsets`; one FAB for the primary screen action; snackbar with "Undo"; dialog actions right-aligned, confirming action last.

## 3. Apple HIG and Liquid Glass (iOS, iPadOS, macOS, watchOS, visionOS)
- Principles: hierarchy, harmony, consistency; content first, controls serve it.
- **Liquid Glass (OS 26, 2025)**: translucent material refracting content behind it, floating controls, tab bars that shrink on scroll, corners concentric with hardware. System components adopt it when built with SDK 26; a temporary opt-out (`UIDesignRequiresCompatibility`) was allowed for a year.
  - Documented risks: very low contrast over variable backgrounds (≈1.5:1 measured in betas), text blending into layers, visual noise, unclear interactivity.
  - Mitigations: no critical text/controls over dynamic backgrounds without a scrim; test with Reduce Transparency, Increase Contrast and Reduce Motion; keep glass for the navigation/control layer, not content.
- **iOS conventions**: stack navigation with **edge swipe back** (don't block it); bottom tab bar with 3–5 destinations; sheets with detents for secondary tasks; destructive options in red (`role: .destructive`); preferred alert button bold, `role: .cancel` for Cancel; SF Symbols; Dynamic Type (`.body`, `.headline`, not fixed sizes); safe areas, Dynamic Island, home indicator.
- **macOS**: menu bar with every command and its shortcut; resizable windows; toolbar; sidebar; `Cmd+,` opens settings; drag-and-drop expected.

## 4. Fluent 2 (Windows, WinUI 3, Fluent UI React v9)
- Materials: Mica (window background), Acrylic (transient surfaces like menus), Smoke (behind dialogs).
- Type: Segoe UI Variable; ramp Caption 12 / Body 14 / Subtitle 20 / Title 28 / Display 68 epx.
- Density: standard and compact; with touch, ~40×40 epx targets.
- Corners: 4px controls, 8px windows and top-level surfaces.
- Conventions: window buttons top-right; `ContentDialog` buttons Primary · Secondary · Close (primary on the **left**); Ctrl shortcuts; context menu on right-click and `Shift+F10`; custom title bars must keep a drag area and system buttons.

## 5. Web
No single platform guide; references are WCAG 2.2, established conventions (logo → home, cart top-right, underlined links in text) and the chosen design system (shadcn/ui, Radix, MUI, Ant, Bootstrap, Material Web, Fluent UI, Carbon, Polaris, Primer…).
- Prefer native elements (`<dialog>`, `<details>`, `<select>`, `popover`) or accessible primitives (Radix, React Aria, Headless UI, Ark UI) over hand-made widgets.
- Hover only as enhancement: `@media (hover: hover) and (pointer: fine)`.
- Responsive by content breakpoints, container queries, fluid units (`clamp()`).
- Honor `prefers-color-scheme`, `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`.

## 6. Cross-platform desktop (Tauri, Electron, Qt, Compose Desktop, Flutter desktop, Java Swing/JavaFX, .NET)
- Adapt to the OS: dialog button order (macOS confirm on the right; Windows primary on the left), Cmd vs Ctrl, window controls, app menu (macOS top bar).
- Right-click context menus; shortcuts for frequent commands; tooltips showing the shortcut.
- Resizable windows with sensible minimums; remember size/position.
- File drag-and-drop with a "Browse" alternative.
- Higher density than mobile is fine with a pointer, keeping 24px minimum and the system's text scale/DPI.
- System integration: native notifications, OS light/dark theme, accent color.

## 7. Differences that break most often
| Aspect | Android (M3) | iOS (HIG) | Windows (Fluent) | macOS | Web |
|---|---|---|---|---|---|
| Back | System button/gesture | Edge swipe + "‹" top-left | Back button in title bar (if any) | Button / Cmd+[ | Browser history |
| Mobile primary nav | Bottom navigation bar | Bottom tab bar | — | — | Bottom bar or header |
| Primary action | FAB / filled button | Nav bar button or filled | Accent button | Default button (Return) | Primary button |
| Dialog buttons | Cancel · Confirm (right) | Cancel · Confirm (or stacked) | Primary · Secondary · Close | Cancel · Confirm (right) | Consistent product convention |
| Destructive | Error-colored text/button | `role: .destructive` (red) | Warning style | Alert | Error color + explicit text |
| Menus | Dropdown / bottom sheet | Context menu (long press) / action sheet | Context menu / CommandBar | Menu bar + context | Dropdown / context menu |
| Settings | Settings screen | Settings app or own screen | Settings page | Cmd+, | Settings/profile page |
